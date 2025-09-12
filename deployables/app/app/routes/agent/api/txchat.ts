import Anthropic from '@anthropic-ai/sdk'
import { executeFunction, txkitTools } from '@zodiac/agent'
import { getAnthropicApiKey } from '@zodiac/env'
import type { Route } from './+types/txchat'

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
})

// TxKit-only system prompt: restricts the assistant to building executable transactions.
const systemPrompt = `You are a Transaction Builder assistant. Your only job is to build executable DeFi transactions using the txkit tools provided. Do not use or mention any permissions/roles tools (defikit_*). If a user asks for permissions or role setup, politely decline and suggest using the main chat.

Capabilities
- Build Safe-compatible transactions for specific protocols via dedicated tools
- Parse intents and request any missing parameters succinctly
- Present JSON payloads in markdown code fences

Tools
- tx_aave_v3: Build Aave v3 Pool transactions (deposit, borrow)
- tx_cowswap: Build CowSwap pre-sign (OrderSigner) payloads
- tx_erc20_approve: Build ERC20 approve(spender, amount)
- tx_lido: Build Lido stETH deposit (stake ETH)
- build_executable_tx: Generic builder (routes to specific builders)

Usage Guidance
- Aave v3: require chain, action (deposit|borrow), asset, amount, sender; optional market, onBehalfOf, rateMode, referralCode
- Lido: require chain, action=deposit, amount, sender; optional referral address
- CowSwap: require chain, from, to, amount, minAmountOut, sender; optional ttlSeconds, feeAmountBp, receiver
- ERC20 approve: chain, token, spender, amount, sender
- Generic builder: accepts either structured args or a clear intent like "swap 10 ETH on cowswap for USDC on arbitrum"

Behavior
- For actionable requests, call exactly one txkit tool to build the transaction, then respond with the tool output and stop.
- Ask for missing required fields only; be concise.
- Include txkit JSON outputs (under code fences) and a short summary; prefer a Download JSON button when Safe tx is built.
- Never reference or call defikit_* tools; this UI is tx-only.
`

export async function action({ request }: Route.ActionArgs) {
  const requestId = Math.random().toString(36).slice(2)
  const start = Date.now()

  try {
    const body = await request.json()
    const { message, messages } = body

    const conversation = Array.isArray(messages)
      ? messages
      : message
        ? [{ role: 'user', content: message }]
        : []

    if (conversation.length === 0) {
      return Response.json(
        { error: 'Message or messages array is required' },
        { status: 400 },
      )
    }

    // Tx-only tools: bypass any external pruner; we explicitly pass txkitTools
    const tools = txkitTools

    // Single-iteration tool execution for deterministic UX
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      tool_choice: { type: 'auto' },
      messages: conversation as any,
      tools,
      system: systemPrompt,
    })

    const assistantText = response.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
    const toolUses = response.content.filter(
      (b) => b.type === 'tool_use',
    ) as any[]

    if (toolUses.length === 0) {
      // No tool call – return assistant text (should be a clarification request)
      return Response.json({
        message:
          assistantText || 'Please provide more details for the transaction.',
      })
    }

    // Execute tool(s) and return results immediately
    const results = await Promise.all(
      toolUses.map(async (call) => {
        try {
          const out = await executeFunction(call.name, call.input)
          return String(out)
        } catch (e: any) {
          return `⚠️ Tool error: ${e?.message || 'Unknown error'}`
        }
      }),
    )

    const combined = [assistantText, ...results].filter(Boolean).join('\n\n')
    return Response.json({ message: combined })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: `Failed to process request: ${message}` },
      { status: 500 },
    )
  } finally {
    const duration = Date.now() - start
    console.log('txchat request completed', { requestId, duration })
  }
}
