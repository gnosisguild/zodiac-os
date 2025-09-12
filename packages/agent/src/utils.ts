import { visit } from 'unist-util-visit'

export const copyAgentMessage = async (text: string) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !navigator?.clipboard) {
    console.warn('Clipboard API not available in this environment')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

export const remarkNbspInCode = () => {
  return (tree: any) => {
    visit(tree, ['code', 'inlineCode'], (node: any) => {
      if (typeof node.value === 'string') {
        node.value = node.value.replaceAll('&nbsp;', '\u00A0')
      }
    })
  }
}

export const rehypeInlineCompPlaceholders = () => {
  // Use non-global regex for test; we'll split with a global later.
  const PLACEHOLDER = /\[\[COMP:(\d+)\]\]/

  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      const value: string = node.value
      if (
        !parent ||
        !Array.isArray(parent.children) ||
        !PLACEHOLDER.test(value)
      )
        return

      const parts = value.split(/(\[\[COMP:\d+\]\])/g)
      const newChildren: any[] = []

      for (const part of parts) {
        const m = part.match(/^\[\[COMP:(\d+)\]\]$/)
        if (m) {
          newChildren.push({
            type: 'element',
            tagName: 'x-comp',
            properties: { idx: m[1] },
            children: [],
          })
        } else if (part) {
          newChildren.push({ type: 'text', value: part })
        }
      }

      parent.children.splice(index, 1, ...newChildren)
    })
  }
}
