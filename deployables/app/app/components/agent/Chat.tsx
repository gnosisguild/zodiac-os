import { copyAgentMessage } from '@zodiac/agent'
import { useAutoScroll } from '@zodiac/hooks'
import {
  AgentMessageCopy,
  ChatInput,
  ScrollToBottom,
  TextShimmer,
} from '@zodiac/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import AnimatedMessageContent from '../../components/agent/AnimatedMessageContent'
import TestButtons from '../../components/agent/TestButtons'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  shouldAnimate?: boolean
}

interface ChatProps {
  apiPath?: string
  title?: string
  subtitle?: string
  placeholder?: string
}

export const Chat = ({
  apiPath = '/api/chat',
  title,
  subtitle,
  placeholder,
}: ChatProps) => {
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  // const [messages, setMessages] = useState<Message[]>([
  //   ...(testMessages as Message[]),
  // ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Track which assistant messages finished animating
  const [animationCompleted, setAnimationCompleted] = useState<
    Record<string, boolean>
  >({})
  // Derive if any assistant message is currently animating
  const isAnimatingActive = useMemo(() => {
    return messages.some(
      (m) =>
        m.role === 'assistant' && m.shouldAnimate && !animationCompleted[m.id],
    )
  }, [messages, animationCompleted])
  const [selectedMode, setSelectedMode] = useState<'analysis' | 'transaction'>(
    'analysis',
  )
  const [copiedByMessageId, setCopiedByMessageId] = useState<
    Record<string, boolean>
  >({})
  const messagesEndRef = useRef<HTMLDivElement>(null!)
  const messagesContainerRef = useRef<HTMLDivElement>(null!)

  // Determine API path based on selected mode
  const currentApiPath =
    selectedMode === 'transaction'
      ? '/workspace/:workspaceId/agent/api/txchat'
      : '/workspace/:workspaceId/agent/api/chat'

  // Handle mode changes and clear conversation
  const handleModeChange = (newMode: 'analysis' | 'transaction') => {
    if (newMode !== selectedMode) {
      // setMessages([]) // Don't clear conversation when switching modes for now
      setSelectedMode(newMode)
    }
  }

  // Dynamic placeholder based on selected mode
  const dynamicPlaceholder =
    selectedMode === 'transaction'
      ? 'e.g., Build Aave v3 deposit of 1,000 USDC on mainnet; or swap 10 ETH for USDC on CowSwap (Arbitrum)'
      : placeholder ||
        'Ask about DeFi protocols, market analysis, or portfolio insights...'

  // Scrolling behavior encapsulated in hook
  const {
    showScrollButton,
    scrollToBottom,
    handleAnimationTick,
    handleNewAnimatedMessage,
  } = useAutoScroll(messagesContainerRef, messagesEndRef)

  // Auto-scroll when new animated messages arrive
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage?.shouldAnimate) {
      // Delegate to hook to perform initial smooth scroll and enable follow
      handleNewAnimatedMessage()
    }
  }, [messages])

  const sendMessage = async () => {
    console.log('sendMessage called', {
      input: input.trim(),
      isLoading,
      isAnimatingActive,
    })
    if (!input.trim() || isLoading || isAnimatingActive) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    // Smooth scroll on the next frame to ensure layout is updated
    requestAnimationFrame(() => {
      scrollToBottom()
    })
    const currentInput = input
    setInput('')
    setIsLoading(true)

    // Build conversation history including the new user message
    const conversationHistory = [...messages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch(currentApiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          // Keep backward compatibility
          message: currentInput,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: Failed to get response`,
        )
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          data.message ||
          "I received your message but couldn't generate a response. Please try again.",
        shouldAnimate: true,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)

      let errorContent =
        'Sorry, I encountered an error processing your request.'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorContent =
            '⚠️ **Request Timeout**: Your request took too long to process. Please try asking a simpler question.'
        } else if (error.message.includes('fetch')) {
          errorContent =
            '⚠️ **Connection Error**: Unable to connect to the service. Please check your internet connection and try again.'
        } else if (error.message.includes('HTTP')) {
          errorContent = error.message // Use the specific HTTP error message
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        shouldAnimate: false,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (messages.length === 0) {
    // Landing page with just header and search bar
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Landing Header */}
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mx-auto w-full max-w-2xl text-center">
            {/* Logo and Title */}
            <div className="mb-8">
              <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
                Zodiac Agent
              </h1>
              <p className="text-md text-gray-500">
                AI-powered DeFi assistant for portfolio analysis and transaction
                building
              </p>
            </div>

            {/* Search Input */}
            <div className="mb-8">
              <ChatInput
                input={input}
                setInput={setInput}
                onSendMessage={sendMessage}
                isLoading={isLoading}
                isAnimating={isAnimatingActive}
                placeholder={dynamicPlaceholder}
                selectedMode={selectedMode}
                onModeChange={handleModeChange}
              />
            </div>

            {/* Quick examples */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
              <p className="font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="ease rounded-full border px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => {
                    console.log('Button clicked!')
                    setInput("Show me Bitcoin's price chart")
                  }}
                >
                  Bitcoin price chart
                </button>
                <button
                  className="ease rounded-full border px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => setInput('Swap 1 ETH for USDC')}
                >
                  Swap 1 ETH for USDC
                </button>
                <button
                  className="ease rounded-full border px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => setInput('Analyze portfolio')}
                >
                  Analyze portfolio
                </button>
                <button
                  className="ease ml-2 rounded-full border bg-green-100 px-2 py-1 text-sm text-green-700 transition-colors hover:bg-green-200"
                  onClick={() => {
                    const testUserMessage = {
                      id: `test-user-${Date.now()}`,
                      role: 'user' as const,
                      content:
                        'What are the current gas fees on Ethereum? Should I wait to make transactions?',
                    }
                    setMessages((prev) => [...prev, testUserMessage])
                    requestAnimationFrame(() => {
                      scrollToBottom() // Test user message auto-scroll
                    })

                    // Mock assistant response after a short delay
                    setTimeout(() => {
                      setIsLoading(false)
                      const mockResponse = {
                        id: `test-assistant-${Date.now()}`,
                        role: 'assistant' as const,
                        content:
                          '**Current Ethereum Gas Analysis:**\n\n**Current Gas Prices:**\n- Standard: 25 gwei (~$2.50 for simple transfer)\n- Fast: 35 gwei (~$3.50 for simple transfer)\n- Instant: 45 gwei (~$4.50 for simple transfer)\n\n**Network Status:**\n- Current block utilization: 78%\n- Average block time: 12.1 seconds\n- Pending transactions: 125,000\n\n**Recommendations:**\n• **Wait if possible** - Gas prices typically drop during weekends\n• **Best times**: Late night UTC (2-6 AM) or early morning\n• **Avoid**: Market volatility periods and major NFT drops\n• **Use gas trackers** for real-time monitoring\n\n**Cost Optimization Tips:**\n1. Batch multiple transactions together\n2. Use Layer 2 solutions (Arbitrum, Optimism) for lower fees\n3. Set custom gas limits to avoid overpaying',
                        shouldAnimate: true,
                      }
                      setMessages((prev) => [...prev, mockResponse])
                    }, 800) // Simulate API response delay
                    setIsLoading(true)
                  }}
                >
                  Test Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Full chat interface
  return (
    <div
      className="mx-auto flex max-w-4xl flex-col overflow-hidden bg-gray-50"
      style={{ height: 'calc(100vh - 2rem)' }}
    >
      {/* Messages */}
      <div className="relative flex-1 overscroll-contain">
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 space-y-4 overflow-y-auto p-4 pb-2"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`${
                  message.role === 'user'
                    ? 'max-w-xs sm:max-w-md lg:max-w-lg'
                    : 'max-w-full'
                } rounded-2xl px-3 py-3 sm:px-4 ${
                  message.role === 'user'
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-900' // Not sure if we want to keep a border here or keep it unstyled like ChatGPT / Claude
                }`}
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </p>
                ) : (
                  <div className="group relative">
                    <div className="prose prose-sm prose-gray prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none text-sm">
                      <AnimatedMessageContent
                        content={message.content}
                        shouldAnimate={message.shouldAnimate ?? false}
                        onContentChange={handleAnimationTick}
                        onAnimationEnd={() => {
                          setAnimationCompleted((prev) => ({
                            ...prev,
                            [message.id]: true,
                          }))
                        }}
                      />
                    </div>
                    {/* Copy button */}
                    <button
                      className="ease group -ml-1 mt-2 flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
                      onClick={async () => {
                        console.log('Copy button clicked!')
                        try {
                          await copyAgentMessage(message.content)
                          setCopiedByMessageId((prev) => ({
                            ...prev,
                            [message.id]: true,
                          }))
                          setTimeout(() => {
                            setCopiedByMessageId((prev) => ({
                              ...prev,
                              [message.id]: false,
                            }))
                          }, 1000)
                        } catch (error) {
                          console.error('Copy failed:', error)
                        }
                      }}
                      title="Copy to clipboard"
                    >
                      {/* Enter/fade wrapper: 500ms, ease-out */}
                      <span
                        className={`inline-flex items-center gap-1 transition-opacity duration-500 ease-out ${
                          !message.shouldAnimate ||
                          animationCompleted[message.id]
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                        style={{
                          transitionDelay:
                            message.role === 'assistant' &&
                            message.content.includes('<DownloadButton')
                              ? '550ms'
                              : '0ms',
                        }}
                      >
                        <AgentMessageCopy
                          copied={copiedByMessageId[message.id]}
                        />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <TextShimmer className="ml-4 text-sm" duration={1.4}>
                Analyzing your request...
              </TextShimmer>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <ScrollToBottom visible={showScrollButton} onClick={scrollToBottom} />
      </div>

      {/* Input */}
      <div className="-mt-4 mb-4 p-4">
        <ChatInput
          input={input}
          setInput={setInput}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isAnimating={isAnimatingActive}
          placeholder={dynamicPlaceholder}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
        />
      </div>

      {/* Test Buttons */}
      <TestButtons
        onAddMessage={(message) => {
          setMessages((prev) => [...prev, message])
          if (message.role === 'user') {
            requestAnimationFrame(() => scrollToBottom())
          }
        }}
        onSetLoading={setIsLoading}
      />
    </div>
  )
}
