import Anthropic from '@anthropic-ai/sdk'
import {
  defiKitClient,
  executeFunction,
  pruneTools,
  tools,
} from '@zodiac/agent'
import { getAnthropicApiKey } from '@zodiac/env'
import type { Route } from './+types/chat'

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
})

export async function action({ request }: Route.ActionArgs) {
  const requestId = Math.random().toString(36).substring(2, 15)
  const claudeStartTime = Date.now()

  try {
    const body = await request.json()
    const { message, messages } = body

    // Support both old format (single message) and new format (conversation history)
    let conversationMessages
    if (messages && Array.isArray(messages)) {
      conversationMessages = messages
    } else if (message) {
      conversationMessages = [{ role: 'user', content: message }]
    } else {
      console.error('❌ Chat Request Error: No message or messages provided')
      return Response.json(
        { error: 'Message or messages array is required' },
        { status: 400 },
      )
    }

    console.log('Chat Request Started:', {
      requestId,
      messageCount: conversationMessages.length,
      lastMessage:
        conversationMessages[
          conversationMessages.length - 1
        ]?.content?.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
    })

    // Prune tools deterministically based on last messages
    const prunedTools = pruneTools(tools, conversationMessages)

    console.log('🤖 Calling Claude API:', {
      requestId,
      model: 'claude-3-5-sonnet-20241022',
      toolsCount: prunedTools.length,
      conversationLength: conversationMessages.length,
      timestamp: new Date().toISOString(),
    })

    // Initialize conversation history for tool loop
    const history = [...conversationMessages]
    const MAX_ITERATIONS = 10
    let totalToolsExecuted = 0
    let finalResponse = ''

    // Server-side accumulator for DeFi Kit bundles
    const accumulatedBundles: any[] = []

    // Helper to strip embedded payloads from text
    const stripEmbeddedPayloads = (text: string) =>
      text.replace(/<DeFiKitResponse>[\s\S]*?<\/DeFiKitResponse>/g, '')

    const systemPrompt = `You are an intelligent DeFi assistant integrated into the Zodiac Agent platform. You excel at understanding user intent and autonomously orchestrating multiple tools to accomplish complex tasks.

## Core Capabilities
- **Market Analysis**: Use messari_copilot for comprehensive crypto market insights
- **Portfolio Analysis**: Use get_portfolio for wallet analysis
- **DeFi Permission Management**: Use per‑protocol tools named 
  
  defikit_<protocol>  
  
  Example: defikit_aave_v3, defikit_uniswap_v3, defikit_lido. Each tool accepts: rolesModAddress, role, action, chain (default eth), and optional params per action. Include op = "allow" or "revoke" (default allow).

## Multi-Protocol Request Patterns
**CRITICAL**: When users request multiple protocols, make separate tool calls across multiple iterations:

**Example Request**: "Set up permissions to swap USDC and ETH on CowSwap and provide liquidity on Uniswap, and stake ETH on Lido"
**Your Process**: 
1. Call defikit_cowswap (action: "swap", tokens: ["USDC","ETH"]) 
2. Call defikit_uniswap_v3 (action: "deposit", tokens: ["USDC","ETH"])  
3. Call defikit_lido (action: "deposit")
4. **Complete**: Provide final summary of all protocol setups

**Key Behaviors**:
- Break complex requests into sequential tool calls
- After each tool execution, assess what still needs to be done
- Continue until all requested protocols are handled
- Provide comprehensive final summaries
- If no per-protocol tools match the user’s request (due to pruning), ask targeted clarification (protocol(s), action(s), chain(s), and any required params like tokens/targets/fees/market) instead of guessing.

## DeFi Permission Management Excellence
For permission requests:
- **Protocol-Specific Parameters**: Pay attention to the detailed protocol guidance in tool descriptions
- **Parameter Selection**: Choose the right parameters for each protocol (e.g., 'sell'/'buy' for CowSwap, 'tokens' for most others)
- **Action Mapping**: Use "deposit" for Lido staking and Uniswap liquidity provision
- **Sequential Processing**: Handle one protocol at a time, building on previous results
- **Error Recovery**: Continue with successful protocols if some fail

**Key Protocol Rules**:
- Lido: action="deposit" for staking; no extra params
- CowSwap: prefer 'sell'/'buy'; symbols ok; ETH stays "ETH"
- Uniswap V3: 'deposit' only; use 'tokens'; fee tiers like 0.3%

## Error Handling & Clarification
- When a tool call fails, respond with a brief, user-friendly summary.
- Ask the user for clarification or a revision (e.g., confirm protocol, action, tokens/targets/fees/market).
- If the toolset is empty for DeFi due to pruning, request more info rather than attempting a guess.
- Do not expose technical details, stack traces, or API error bodies.

## Response Style
- Work through complex requests step by step
- Use tool results to inform next steps
- Provide clear progress updates as you work
- Synthesize final comprehensive summaries

Remember: Complex requests require multiple iterations. Don't try to do everything at once.`

    // Implement proper Claude tool loop pattern
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      console.log(
        `🔄 Tool loop iteration ${iteration + 1}/${MAX_ITERATIONS}:`,
        {
          requestId,
          historyLength: history.length,
          timestamp: new Date().toISOString(),
        },
      )

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000, // Increased for complex reasoning
        tool_choice: { type: 'auto' }, // Let Claude decide when to use tools
        messages: history,
        tools: prunedTools,
        system: systemPrompt,
      })

      const claudeDuration = Date.now() - claudeStartTime

      console.log(`✅ Claude API Response (iteration ${iteration + 1}):`, {
        requestId,
        duration: `${claudeDuration}ms`,
        hasToolUse: response.content.some((block) => block.type === 'tool_use'),
        toolCount: response.content.filter((block) => block.type === 'tool_use')
          .length,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      })

      // Sanitize assistant text before adding to history
      const sanitizedAssistantContent = response.content.map((block) => {
        if (block.type === 'text') {
          return { ...block, text: stripEmbeddedPayloads(block.text) }
        }
        return block
      })

      // Add Claude's response to history (sanitized)
      history.push({
        role: 'assistant',
        content: sanitizedAssistantContent as any,
      })

      // Check for tool calls
      const toolUses = response.content.filter(
        (block) => block.type === 'tool_use',
      )

      if (toolUses.length === 0) {
        // No more tools needed - Claude is done
        finalResponse = sanitizedAssistantContent
          .filter((block) => block.type === 'text')
          .map((block: any) => block.text)
          .join('')

        // Inject aggregated bundle if available
        if (accumulatedBundles.length > 0) {
          const aggregatedResult = (defiKitClient.constructor as any)
            .aggregateResponses
            ? (defiKitClient.constructor as any).aggregateResponses(
                accumulatedBundles,
                'Combined DeFi Permissions',
              )
            : {
                transactions: accumulatedBundles.flatMap(
                  (b) => b.transactions || [],
                ),
              }
          const downloadBlock = `\n\n## Download Combined Transaction File\n\n<DownloadButton data='${JSON.stringify(aggregatedResult)}' filename='defi-permissions-${Date.now()}.json' />\n`
          finalResponse += downloadBlock
        }

        console.log(
          `🏁 Tool loop completed after ${iteration + 1} iteration(s):`,
          {
            requestId,
            totalToolsExecuted,
            finalResponseLength: finalResponse.length,
            timestamp: new Date().toISOString(),
          },
        )
        break
      }

      // Execute all requested tools (can be parallel)
      console.log('🔧 Tool calls detected:', {
        requestId,
        iteration: iteration + 1,
        toolsToExecute: toolUses.map((block) => ({
          name: block.name,
          id: block.id,
        })),
      })

      const toolResults = await Promise.all(
        toolUses.map(async (block) => {
          const result = await executeFunction(block.name, block.input)
          totalToolsExecuted++

          // Extract and accumulate DeFi Kit bundles from tool result
          const matches = Array.from(
            String(result).matchAll(
              /<DeFiKitResponse>([\s\S]*?)<\/DeFiKitResponse>/g,
            ),
          )
          for (const m of matches) {
            try {
              const json = JSON.parse(m[1])
              accumulatedBundles.push(json)
            } catch {}
          }

          // Sanitize tool result content before adding back to history
          const sanitized = stripEmbeddedPayloads(String(result))

          return {
            type: 'tool_result',
            tool_use_id: block.id,
            content: sanitized,
          }
        }),
      )

      console.log(`📋 Tool execution completed (iteration ${iteration + 1}):`, {
        requestId,
        toolsExecuted: toolResults.length,
        totalToolsExecuted,
        timestamp: new Date().toISOString(),
      })

      // Add tool results to history for next iteration (sanitized)
      history.push({
        role: 'user',
        content: toolResults as any,
      })
    }

    // Handle case where we hit max iterations
    if (finalResponse === '') {
      console.log('⚠️ Tool loop reached max iterations without completion:', {
        requestId,
        maxIterations: MAX_ITERATIONS,
        totalToolsExecuted,
        timestamp: new Date().toISOString(),
      })
      finalResponse =
        'I encountered an issue completing your request. The operation may have exceeded the maximum number of iterations allowed.'
    }

    const totalDuration = Date.now() - claudeStartTime

    console.log('✅ Chat Request Completed:', {
      requestId,
      totalDuration: `${totalDuration}ms`,
      responseLength: finalResponse.length,
      totalToolsExecuted,
      timestamp: new Date().toISOString(),
    })

    return Response.json({
      message:
        finalResponse ||
        'I apologize, but I encountered an issue processing your request. Please try again.',
    })
  } catch (error) {
    const totalDuration = Date.now() - (claudeStartTime || Date.now())
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error('❌ Chat API Error:', {
      requestId,
      duration: `${totalDuration}ms`,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })

    // Provide specific error messages based on error type
    let userErrorMessage = 'Failed to process your message. Please try again.'
    let statusCode = 500

    if (errorMessage.includes('API key')) {
      userErrorMessage =
        '⚠️ **Service Unavailable**: The AI assistant is temporarily unavailable. Please try again later.'
      statusCode = 503
    } else if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429')
    ) {
      userErrorMessage =
        '⚠️ **Too Many Requests**: Please wait a moment before sending another message.'
      statusCode = 429
    } else if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      userErrorMessage =
        '⚠️ **Request Timeout**: That took too long to process. Please try a simpler question.'
      statusCode = 504
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('ECONNREFUSED')
    ) {
      userErrorMessage =
        '⚠️ **Connection Error**: Please check your internet connection and try again.'
      statusCode = 503
    } else if (
      errorMessage.includes('JSON') ||
      errorMessage.includes('parse')
    ) {
      userErrorMessage =
        '⚠️ **Request Error**: There was an issue processing your message. Please try again.'
      statusCode = 400
    }

    return Response.json({ error: userErrorMessage }, { status: statusCode })
  }
}
