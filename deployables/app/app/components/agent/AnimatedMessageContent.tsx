import { remarkNbspInCode } from '@zodiac/agent'
import { useAnimatedText } from '@zodiac/hooks'
import { JSONDownload } from '@zodiac/ui'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

// MessariChart client-only with skeleton to reserve space immediately
const MessariChart = lazy(() =>
  import('@zodiac/ui').then((module) => ({ default: module.MessariChart })),
)

type TextBlock = { kind: 'text'; text: string }
type ChartBlock = { kind: 'chart'; data?: any; index?: number }
type DownloadBlock = { kind: 'download'; data: string; filename: string }
type Block = TextBlock | ChartBlock | DownloadBlock

function parseBlocks(content: string): Block[] {
  const compRegex = /<MessariChart[^>]*\/>|<DownloadButton[^>]*\/>/g
  const blocks: Block[] = []
  let last = 0
  for (const m of content.matchAll(compRegex)) {
    const i = m.index ?? 0
    const tok = m[0]
    if (i > last) blocks.push({ kind: 'text', text: content.slice(last, i) })
    if (tok.startsWith('<MessariChart')) {
      const dataAttr = tok.match(/data='(.+?)'/)
      const idxAttr = tok.match(/index='(\d+)'/)
      let data: any
      try {
        if (dataAttr) data = JSON.parse(dataAttr[1].replace(/'/g, '"'))
      } catch {}
      blocks.push({
        kind: 'chart',
        data,
        index: idxAttr ? parseInt(idxAttr[1], 10) : undefined,
      })
    } else {
      const dataAttr = tok.match(/data='(.+?)'/)
      const nameAttr = tok.match(/filename='(.+?)'/)
      blocks.push({
        kind: 'download',
        data: dataAttr ? dataAttr[1] : '',
        filename: nameAttr ? nameAttr[1] : 'download.txt',
      })
    }
    last = i + tok.length
  }
  if (last < content.length)
    blocks.push({ kind: 'text', text: content.slice(last) })
  return blocks
}

/** Fires on mount (once), then renders children. Used to advance the block cursor safely. */
function BlockGate({
  index,
  onAdvance,
  onMountedNonText,
  children,
}: {
  index: number
  onAdvance: (i: number) => void
  onMountedNonText?: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    // next tick ensures the slot is in the DOM before advancing
    const id = requestAnimationFrame(() => {
      onMountedNonText?.()
      onAdvance(index)
    })
    return () => cancelAnimationFrame(id)
    // deps intentionally stable; we want this to fire **once**
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <div className="my-3">{children}</div>
}

interface AnimatedMessageContentProps {
  content: string
  shouldAnimate: boolean
  onContentChange?: () => void
  onAnimationEnd?: () => void
  onAllComponentsMounted?: () => void
}

export default function AnimatedMessageContent({
  content,
  shouldAnimate,
  onContentChange,
  onAnimationEnd,
  onAllComponentsMounted,
}: AnimatedMessageContentProps) {
  const blocks = useMemo(() => parseBlocks(content), [content])

  // which block we are revealing now
  const [cursor, setCursor] = useState(0)

  // ensure we only advance once per block
  const advanced = useRef<Set<number>>(new Set())
  const advanceOnce = useCallback((i: number) => {
    if (advanced.current.has(i)) return
    advanced.current.add(i)
    // only advance if this is still the current block
    setCursor((c) => (i === c ? c + 1 : c))
  }, [])

  // count non-text mounts (to support onAllComponentsMounted)
  const totalNonText = useMemo(
    () => blocks.filter((b) => b.kind !== 'text').length,
    [blocks],
  )
  const mountedNonText = useRef(0)
  const handleNonTextMounted = useCallback(() => {
    mountedNonText.current += 1
    if (mountedNonText.current === totalNonText && totalNonText > 0) {
      onAllComponentsMounted?.()
    }
  }, [onAllComponentsMounted, totalNonText])

  // typing only for the current text block
  const currentText = useMemo(
    () =>
      blocks[cursor]?.kind === 'text' ? (blocks[cursor] as TextBlock).text : '',
    [blocks, cursor],
  )
  const chunkText = useAnimatedText(currentText, '\n\n')
  const characterText = useAnimatedText(chunkText, '')
  const typed = useMemo(
    () => (!shouldAnimate ? currentText : characterText || chunkText || ''),
    [shouldAnimate, characterText, chunkText, currentText],
  )
  const endFiredRef = useRef(0)

  // reset ref whenever the parsed blocks change (i.e., new content)
  useEffect(() => {
    endFiredRef.current = 0
  }, [blocks])

  useEffect(() => {
    if (cursor >= blocks.length && endFiredRef.current === 0) {
      endFiredRef.current = 1
      onAnimationEnd?.()
    }
  }, [cursor, blocks.length])

  // when the current text block is fully typed, advance once
  useEffect(() => {
    const isText = blocks[cursor]?.kind === 'text'
    const done =
      !shouldAnimate || (currentText.length > 0 && typed === currentText)
    if (isText && done) {
      advanceOnce(cursor)
    }
  }, [blocks, cursor, typed, currentText, shouldAnimate, advanceOnce])

  // scroll pings during typing - use ref to avoid re-render triggers
  const onContentChangeRef = useRef(onContentChange)
  onContentChangeRef.current = onContentChange

  useEffect(() => {
    if (!shouldAnimate) return
    const id = requestAnimationFrame(() => onContentChangeRef.current?.())
    return () => cancelAnimationFrame(id)
  }, [typed, cursor, shouldAnimate])

  const mdComponents = useMemo<Components>(
    () => ({
      h1({ node, ...props }) {
        return (
          <h1
            {...props}
            className="mb-2 border-b pb-1 text-lg font-bold text-gray-900"
          />
        )
      },
      h2({ node, ...props }) {
        return (
          <h2
            {...props}
            className="mb-2 mt-3 text-base font-semibold text-gray-800"
          />
        )
      },
      h3({ node, ...props }) {
        return (
          <h3
            {...props}
            className="mb-1 mt-2 text-sm font-semibold text-gray-700"
          />
        )
      },
      p({ node, ...props }) {
        return <p {...props} className="my-3 text-sm leading-relaxed" />
      },
      ul({ node, ...props }) {
        return <ul {...props} className="my-2 list-disc space-y-1 pl-4" />
      },
      ol({ node, ...props }) {
        return <ol {...props} className="my-2 list-decimal space-y-1 pl-4" />
      },
      li({ node, ...props }) {
        return <li {...props} className="text-sm" />
      },
      a({ node, ...props }) {
        return (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 underline hover:text-gray-900"
          />
        )
      },
      strong({ node, ...props }) {
        return <strong {...props} className="font-semibold text-gray-900" />
      },
      code({ node, className, children, ...props }) {
        if (!className?.includes('language-')) {
          return (
            <code
              {...props}
              className="break-words rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-800"
            >
              {children}
            </code>
          )
        }
        return (
          <code {...props} className={className}>
            {children}
          </code>
        )
      },
      pre({ node, ...props }) {
        return (
          <div className="w-fit">
            <pre
              {...props}
              className="block overflow-x-auto whitespace-pre-wrap break-words rounded bg-gray-800 p-4 text-xs text-gray-100"
            />
          </div>
        )
      },
      table({ node, ...props }) {
        return <table {...props} className="text-sm" />
      },
      th({ node, ...props }) {
        return (
          <th
            {...props}
            className="whitespace-nowrap px-2 py-2 font-semibold text-gray-900"
          />
        )
      },
      td({ node, ...props }) {
        return (
          <td
            {...props}
            className="whitespace-nowrap border-t px-2 py-2 align-top text-gray-700"
          />
        )
      },
    }),
    [],
  )

  return (
    <div>
      {blocks.map((b, i) => {
        if (i < cursor) {
          // PAST blocks
          if (b.kind === 'text') {
            return (
              <ReactMarkdown
                key={`t-full-${i}`}
                remarkPlugins={[remarkGfm, remarkBreaks, remarkNbspInCode]}
                rehypePlugins={[rehypeHighlight]}
                components={mdComponents}
              >
                {(b as TextBlock).text}
              </ReactMarkdown>
            )
          }
          if (b.kind === 'chart') {
            const cb = b as ChartBlock
            return (
              <Suspense
                key={`chart-${i}`}
                fallback={
                  <div className="my-3 h-80 w-full animate-pulse rounded-lg bg-gray-200" />
                }
              >
                <div className="my-3">
                  <MessariChart chartData={cb.data} index={cb.index} />
                </div>
              </Suspense>
            )
          }
          const db = b as DownloadBlock
          return (
            <div key={`dl-${i}`} className="my-3">
              <JSONDownload data={db.data} filename={db.filename} />
            </div>
          )
        }

        if (i === cursor) {
          // CURRENT block
          if (b.kind === 'text') {
            return (
              <ReactMarkdown
                key={`t-typing-${i}`}
                remarkPlugins={[remarkGfm, remarkBreaks, remarkNbspInCode]}
                components={mdComponents}
              >
                {typed}
              </ReactMarkdown>
            )
          }
          if (b.kind === 'chart') {
            const cb = b as ChartBlock
            return (
              <BlockGate
                key={`chart-gate-${i}`}
                index={i}
                onAdvance={advanceOnce}
                onMountedNonText={handleNonTextMounted}
              >
                <Suspense
                  fallback={
                    <div className="my-3 h-80 w-full animate-pulse rounded-lg bg-gray-200" />
                  }
                >
                  <MessariChart chartData={cb.data} index={cb.index} />
                </Suspense>
              </BlockGate>
            )
          }
          const db = b as DownloadBlock
          return (
            <BlockGate
              key={`dl-gate-${i}`}
              index={i}
              onAdvance={advanceOnce}
              onMountedNonText={handleNonTextMounted}
            >
              <JSONDownload data={db.data} filename={db.filename} />
            </BlockGate>
          )
        }

        // FUTURE blocks
        return null
      })}
    </div>
  )
}
