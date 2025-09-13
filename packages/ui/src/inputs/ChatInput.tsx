import {
  AdjustmentsHorizontalIcon,
  ArrowUpIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/solid'
import { useLayoutEffect, useRef, useState } from 'react'
// Decided to use Radix UI, can change to shadcn or Catalyst UI later
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CheckIcon } from '@radix-ui/react-icons'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSendMessage: () => void
  isLoading: boolean
  isAnimating?: boolean
  placeholder?: string
  selectedMode?: 'analysis' | 'transaction'
  onModeChange?: (mode: 'analysis' | 'transaction') => void
}

export const ChatInput = ({
  input,
  setInput,
  onSendMessage,
  isLoading,
  isAnimating = false,
  placeholder,
  selectedMode = 'analysis',
  onModeChange,
}: ChatInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleModeChange = (mode: 'analysis' | 'transaction') => {
    onModeChange?.(mode)
  }

  // Auto-resize when placeholder or input changes
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200) // Max 200px height
      textareaRef.current.style.height = newHeight + 'px'
    }
  }, [placeholder, input])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <div className="border-gray-200">
      <div className="ease mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors duration-200 focus-within:border-gray-300">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            // Auto-resize with max height constraint
            e.target.style.height = 'auto'
            const newHeight = Math.min(e.target.scrollHeight, 200) // Max 200px height
            e.target.style.height = newHeight + 'px'
          }}
          onKeyPress={handleKeyPress}
          placeholder={
            placeholder ||
            'Ask about DeFi protocols, market analysis, or portfolio insights...'
          }
          className="w-full resize-none border-none bg-transparent px-5 pb-4 pt-4 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
          disabled={isLoading}
          rows={1}
          style={{
            overflow: 'auto',
            maxHeight: '200px',
          }}
        />

        {/* Icons at the bottom */}
        <div className="flex items-center justify-between px-3 pb-2">
          <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenu.Trigger asChild>
              <div className="duration-125 ease cursor-pointer rounded-lg p-1 transition-colors hover:bg-gray-100">
                <AdjustmentsHorizontalIcon
                  className="h-6 w-6 text-gray-900"
                  strokeWidth={1.5}
                />
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="animate-dropdown-in w-64 origin-bottom-left rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenu.RadioGroup
                  value={selectedMode}
                  onValueChange={(value: string) =>
                    handleModeChange(value as typeof selectedMode)
                  }
                >
                  <DropdownMenu.RadioItem
                    value="analysis"
                    className="ease flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-gray-900" />
                      <span className="text-sm text-gray-900">
                        Analysis & Permissions
                      </span>
                    </div>
                    <DropdownMenu.ItemIndicator>
                      <CheckIcon className="h-5 w-5 text-gray-900" />
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>

                  <DropdownMenu.RadioItem
                    value="transaction"
                    className="ease flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-gray-100 data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <CogIcon className="h-5 w-5 text-gray-900" />
                      <span className="text-sm text-gray-900">
                        Transaction Builder
                      </span>
                    </div>
                    <DropdownMenu.ItemIndicator>
                      <CheckIcon className="h-5 w-5 text-gray-900" />
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <button
            onClick={onSendMessage}
            disabled={!input.trim() || isLoading || isAnimating}
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-medium text-white transition-all ${
              !input.trim() || isLoading || isAnimating
                ? 'cursor-not-allowed bg-gray-400'
                : 'cursor-pointer bg-black hover:bg-gray-700 active:scale-95'
            }`}
          >
            {isLoading || isAnimating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <ArrowUpIcon className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
