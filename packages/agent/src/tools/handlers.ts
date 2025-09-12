import debankClient from '../clients/debank'
import { defiKitClient } from '../clients/defikit'
import { normalizeDeFiKitArgs } from '../clients/defikit/normalize'
import messariClient from '../clients/messari'
import type { ActionRequest, ExecutionPayload } from '../clients/txkit'
import {
  buildCowOrderSignerPreSign,
  buildErc20Approve,
  buildExecutableTx,
} from '../clients/txkit'

function parseChainAlias(
  text?: string,
): 'eth' | 'arb' | 'opt' | 'base' | 'gno' {
  if (!text) return 'eth'
  const t = text.toLowerCase()
  if (/(eth|mainnet|ethereum)/.test(t)) return 'eth'
  if (/(arbitrum|arb)/.test(t)) return 'arb'
  if (/(optimism|opt)/.test(t)) return 'opt'
  if (/base/.test(t)) return 'base'
  if (/(gnosis|gno|xdai)/.test(t)) return 'gno'
  return 'eth'
}

function parseSwapIntent(intent: string): Partial<ActionRequest> | null {
  const re =
    /swap\s+(\d+(?:\.\d+)?)\s*([a-zA-Z0-9]+)\s+on\s+(cowswap)\s+for\s+([a-zA-Z0-9]+)(?:\s+on\s+([a-zA-Z0-9]+))?/i
  const m = intent.match(re)
  if (!m) return null
  const [, amount, from, protocol, to, chainText] = m
  return {
    protocol: protocol.toLowerCase(),
    action: 'swap',
    amount,
    from,
    to,
    chain: parseChainAlias(chainText),
  } as Partial<ActionRequest>
}

export async function executeFunction(
  name: string,
  args: any,
): Promise<string> {
  console.log('🔧 Tool Execution Started:', {
    toolName: name,
    args: args,
    timestamp: new Date().toISOString(),
  })

  const startTime = Date.now()

  try {
    switch (name) {
      case 'greeting':
        const userName = args.user_name ? ` ${args.user_name}` : ''
        return `Hello${userName}! I'm your Zodiac Agent. I can help you with:

## 📊 Market Intelligence
• Comprehensive crypto market analysis and insights
• Real-time portfolio tracking and analysis
• Token performance data and trends

## 🔐 Treasury Permission Management
• Multi-protocol setup: CowSwap, Uniswap, Lido, Aave v3
• Define roles and actions to allow or revoke
• Generate Safe transaction files ready to import
• Batch multiple permissions in one session
• Smart parsing of plain-English requests

What would you like to explore today?`

      case 'messari_copilot':
        console.log('📊 Calling Messari Copilot:', {
          query: args.query,
          context: args.context,
        })
        const copilotResult = await messariClient.query(
          args.query,
          args.context,
        )

        // Format response with sources and citations
        let formattedResponse = copilotResult.content

        // Convert inline citations to clickable links if sources are available
        if (copilotResult.sources && copilotResult.sources.length > 0) {
          // Replace inline citations like [^1] with clickable links to sources
          formattedResponse = formattedResponse.replace(
            /\[\^(\d+)\]/g,
            (match, num) => {
              const sourceIndex = parseInt(num) - 1
              if (
                sourceIndex >= 0 &&
                sourceIndex < copilotResult.sources.length
              ) {
                const source = copilotResult.sources[sourceIndex]
                return `[[${num}]](${source.url} "${source.title}")`
              }
              return match // Keep original if source doesn't exist
            },
          )

          // Add sources section at the bottom
          formattedResponse += '\n\n## Sources\n'
          copilotResult.sources.forEach((source, index) => {
            const sourceNumber = index + 1
            const description = source.description
              ? ` - ${source.description}`
              : ''
            formattedResponse += `${sourceNumber}. [${source.title}](${source.url})${description}\n`
          })
        }

        // Add charts section if available
        if (copilotResult.charts && copilotResult.charts.length > 0) {
          console.log('📊 Charts found:', copilotResult.charts.length, 'charts')

          formattedResponse += '\n## Charts & Data\n'
          copilotResult.charts.forEach((chart, index) => {
            const chartNumber = index + 1
            const entityName =
              chart.metricTimeseries.series[0]?.entity?.name || 'Asset'
            const metricName =
              chart.metric?.charAt(0).toUpperCase() + chart.metric?.slice(1) ||
              'Metric'
            const timeRange = chart.granularity || 'daily'

            // Add a special markdown marker that we can detect in the frontend to render the actual chart
            formattedResponse += `\n<MessariChart data='${JSON.stringify(chart)}' index='${index}' />\n`
            formattedResponse += `**Chart ${chartNumber}**: ${entityName} ${metricName} (${timeRange} data)\n`
          })
        }

        console.log('✅ Tool Execution Completed:', {
          toolName: name,
          duration: `${Date.now() - startTime}ms`,
          resultLength: formattedResponse.length,
          sourcesFound: copilotResult.sources.length,
          chartsFound: copilotResult.charts.length,
          timestamp: new Date().toISOString(),
        })

        return formattedResponse

      case 'get_portfolio': {
        // Validate wallet address
        if (!args.address || typeof args.address !== 'string') {
          return JSON.stringify({
            error: 'Missing address. Provide an EVM address starting with 0x.',
          })
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(args.address)) {
          return JSON.stringify({
            error: 'Invalid address. Expected 0x-prefixed 20-byte hex.',
          })
        }

        const address: string = args.address
        console.log('💼 Building portfolio via DeBank:', { address })

        const CHAIN_SET = ['eth', 'arb', 'base', 'op', 'xdai'] as const

        const start = Date.now()
        const [totalBalanceRes, protocolsRes, netCurveRes, tokensRes] =
          await Promise.allSettled([
            debankClient.getTotalBalance(address),
            debankClient.getAllComplexProtocolList(address, [...CHAIN_SET]),
            debankClient.getTotalNetCurve(address, [...CHAIN_SET]),
            Promise.allSettled(
              [...CHAIN_SET].map((c) => debankClient.getTokenList(address, c)),
            ),
          ])

        const warnings: string[] = []

        // Total balance
        let total_usd_value = 0
        if (totalBalanceRes.status === 'fulfilled') {
          total_usd_value = totalBalanceRes.value.total_usd_value || 0
        } else {
          warnings.push('Failed to fetch total balance')
        }

        // Net curve
        let net_curve_24h: Array<{ timestamp: number; usd_value: number }> = []
        if (netCurveRes.status === 'fulfilled') {
          net_curve_24h = Array.isArray(netCurveRes.value)
            ? netCurveRes.value
            : []
        } else {
          warnings.push('Failed to fetch 24h net curve')
        }

        // Protocols mapping + filter
        type Proto = {
          chain_id: string
          name: string
          logo_url: string
          portfolio_item_list: any[]
        }
        let protocols: Proto[] = []
        if (protocolsRes.status === 'fulfilled') {
          const raw = Array.isArray(protocolsRes.value)
            ? protocolsRes.value
            : []
          protocols = raw
            .map((p: any) => {
              const items = Array.isArray(p.portfolio_item_list)
                ? p.portfolio_item_list
                : []
              const filtered = items.filter(
                (it: any) => (it?.stats?.net_usd_value || 0) > 1,
              )
              return {
                chain_id: p.chain,
                name: p.name,
                logo_url: p.logo_url,
                portfolio_item_list: filtered,
              }
            })
            .filter((p: Proto) => p.portfolio_item_list.length > 0)
        } else {
          warnings.push('Failed to fetch protocol positions')
        }

        // Tokens mapping + filter
        type Token = {
          chain_id: string
          name: string
          optimized_symbol: string
          logo_url: string
          price: number
          amount: number
          balance: number
        }
        let tokens: Token[] = []
        if (tokensRes.status === 'fulfilled') {
          tokens = tokensRes.value
            .filter(
              (r): r is PromiseFulfilledResult<any[]> =>
                r.status === 'fulfilled',
            )
            .flatMap((r, idx) => {
              const chainId = CHAIN_SET[idx]
              return (r.value || []).map((t: any) => {
                const price = Number(t.price || 0)
                const amount = Number(t.amount || 0)
                const balance = price * amount
                return {
                  chain_id: chainId,
                  name: t.name,
                  optimized_symbol: t.optimized_symbol,
                  logo_url: t.logo_url,
                  price,
                  amount,
                  balance,
                }
              })
            })
            .filter((t: Token) => t.balance > 1)

          const failedTokenChains = tokensRes.value
            .map((r, idx) => ({ r, chain: CHAIN_SET[idx] }))
            .filter(({ r }) => r.status === 'rejected')
            .map(({ chain }) => chain)
          if (failedTokenChains.length)
            warnings.push(
              `Failed token balances on: ${failedTokenChains.join(', ')}`,
            )
        } else {
          warnings.push('Failed to fetch token balances')
        }

        const result = {
          address,
          fetched_at: new Date().toISOString(),
          version: '1.0',
          summary: {
            total_usd_value,
          },
          protocols,
          tokens,
          net_curve_24h,
          meta: {
            counts: {
              protocols: protocols.length,
              portfolio_items: protocols.reduce(
                (acc, p) => acc + p.portfolio_item_list.length,
                0,
              ),
              tokens: tokens.length,
            },
            chains_present: Array.from(
              new Set([
                ...protocols.map((p) => p.chain_id),
                ...tokens.map((t) => t.chain_id),
              ]),
            ).sort(),
            warnings,
            duration_ms: Date.now() - start,
          },
        }

        console.log('✅ Tool Execution Completed:', {
          toolName: name,
          duration: `${Date.now() - startTime}ms`,
          protocols: result.meta.counts.protocols,
          tokens: result.meta.counts.tokens,
          warnings: warnings.length,
          timestamp: new Date().toISOString(),
        })

        return JSON.stringify(result)
      }

      case 'tx_aave_v3': {
        const required = ['chain', 'action', 'asset', 'amount', 'sender']
        for (const k of required) {
          if (!(k in args)) return `⚠️ Missing required field: ${k}`
        }
        const req: ActionRequest = {
          protocol: 'aave_v3',
          action: args.action,
          chain: args.chain,
          asset: args.asset,
          amount: args.amount,
          market: args.market,
          onBehalfOf: args.onBehalfOf,
          interestRateMode: args.interestRateMode,
          referralCode: args.referralCode,
          sender: args.sender,
        }
        try {
          const payload = await buildExecutableTx(req)
          const summary = `Aave v3 ${req.market || 'Core'} ${req.action} tx for ${req.amount} ${req.asset} on ${req.chain}.`
          const builderFile = {
            version: '1.0',
            chainId: payload.chainId,
            createdAt: Date.now(),
            meta: { name: 'TxKit Aave v3', description: payload.preview },
            transactions: [payload.safeTx],
          }
          const download = `\n\n<DownloadButton data='${JSON.stringify(builderFile)}' filename='tx-aave_v3-${req.chain}-${Date.now()}.json' />\n`
          return `${summary}\n\n\`\`\`json\n${JSON.stringify(payload.safeTx, null, 2)}\n\`\`\`${download}`
        } catch (e: any) {
          return `⚠️ Failed to build Aave v3 payload: ${e?.message || 'Unknown error'}`
        }
      }

      case 'tx_lido': {
        const required = ['chain', 'action', 'amount', 'sender']
        for (const k of required) {
          if (!(k in args)) return `⚠️ Missing required field: ${k}`
        }
        const req: ActionRequest = {
          protocol: 'lido',
          action: 'deposit',
          chain: args.chain,
          amount: args.amount,
          referral: args.referral,
          sender: args.sender,
        } as any
        try {
          const payload = await buildExecutableTx(req)
          const summary = `Lido ${req.action} tx for ${req.amount} ETH on ${req.chain}.`
          const builderFile = {
            version: '1.0',
            chainId: payload.chainId,
            createdAt: Date.now(),
            meta: { name: 'TxKit Lido', description: payload.preview },
            transactions: [payload.safeTx],
          }
          const download = `\n\n<DownloadButton data='${JSON.stringify(builderFile)}' filename='tx-lido-${req.chain}-${Date.now()}.json' />\n`
          return `${summary}\n\n\`\`\`json\n${JSON.stringify(payload.safeTx, null, 2)}\n\`\`\`${download}`
        } catch (e: any) {
          return `⚠️ Failed to build Lido payload: ${e?.message || 'Unknown error'}`
        }
      }

      case 'tx_erc20_approve': {
        const required = ['chain', 'token', 'spender', 'amount', 'sender']
        for (const k of required) {
          if (!(k in args)) return `⚠️ Missing required field: ${k}`
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(args.spender)) {
          return '⚠️ Invalid spender address. Must be 0x-prefixed 40-hex.'
        }
        try {
          const payload = await buildErc20Approve({
            chain: args.chain,
            token: args.token,
            spender: args.spender,
            amount: args.amount,
            sender: args.sender,
          })
          const summary = `Approve ${args.token} for ${args.spender} on ${args.chain}.`
          const builderFile = {
            version: '1.0',
            chainId: payload.chainId,
            createdAt: Date.now(),
            meta: { name: 'TxKit ERC20 Approve', description: payload.preview },
            transactions: [payload.safeTx],
          }
          const download = `\n\n<DownloadButton data='${JSON.stringify(builderFile)}' filename='tx-erc20-approve-${args.chain}-${Date.now()}.json' />\n`
          return `${summary}\n\n\`\`\`json\n${JSON.stringify(payload.safeTx, null, 2)}\n\`\`\`${download}`
        } catch (e: any) {
          return `⚠️ Failed to build ERC20 approve payload: ${e?.message || 'Unknown error'}`
        }
      }

      case 'build_executable_tx': {
        const sender: string = args.sender
        if (
          !sender ||
          typeof sender !== 'string' ||
          !/^0x[a-fA-F0-9]{40}$/.test(sender)
        ) {
          return '⚠️ Missing or invalid `sender` address. Provide a valid 0x… address.'
        }

        let req: Partial<ActionRequest> = {}
        if (typeof args.intent === 'string' && args.intent.trim().length > 0) {
          const parsed = parseSwapIntent(args.intent)
          if (parsed) req = { ...req, ...parsed }
        }

        if (args.protocol) req.protocol = args.protocol
        if (args.action) req.action = args.action
        if (args.chain) req.chain = args.chain
        if (args.from) req.from = args.from
        if (args.to) req.to = args.to
        if (args.amount) req.amount = args.amount
        if (args.minAmountOut) req.minAmountOut = args.minAmountOut
        if (args.slippageBps) req.slippageBps = args.slippageBps
        if (args.feeAmountBp) req.feeAmountBp = args.feeAmountBp
        if (args.ttlSeconds) req.ttlSeconds = args.ttlSeconds
        if (args.receiver) req.receiver = args.receiver
        req.sender = sender

        if (!req.protocol || !req.action) {
          return '⚠️ Unable to infer protocol/action. Provide `protocol` and `action`, or a clearer intent.'
        }
        if (!req.chain) req.chain = 'eth'

        try {
          // Default: CowSwap orders use Safe pre-sign (OrderSigner)
          if (req.protocol === 'cowswap' && req.action === 'swap') {
            const required = ['from', 'to', 'amount', 'minAmountOut'] as const
            for (const k of required) {
              if (!(k in req) || !(req as any)[k]) {
                return `⚠️ Missing required field for CowSwap pre-sign: ${k}`
              }
            }
            const payload = await buildCowOrderSignerPreSign(
              req as ActionRequest,
            )
            const summary = `CowSwap pre-sign Safe tx (delegatecall) on chain ${payload.chainId}.\n\n${payload.preview}`
            const builderFile = {
              version: '1.0',
              chainId: payload.chainId,
              createdAt: Date.now(),
              meta: {
                name: 'TxKit CowSwap Pre-Sign',
                description: payload.preview,
              },
              transactions: [payload.safeTx],
            }
            const download = `\n\n<DownloadButton data='${JSON.stringify(builderFile)}' filename='tx-cowswap-presign-${(req as any).chain}-${Date.now()}.json' />\n`
            return `${summary}\n\n\`\`\`json\n${JSON.stringify(payload.safeTx, null, 2)}\n\`\`\`${download}`
          }

          // Non-CowSwap: use router default (may return EIP-712 or Safe payloads)
          const payload: ExecutionPayload = await buildExecutableTx(
            req as ActionRequest,
          )
          const summary = `Built ${payload.kind.toUpperCase()} payload on chain ${payload.chainId}.\n\n${payload.preview}`
          const json =
            payload.kind === 'eip712' ? payload.eip712 : payload.safeTx
          if (payload.kind === 'safeTx' && payload.safeTx) {
            const builderFile = {
              version: '1.0',
              chainId: payload.chainId,
              createdAt: Date.now(),
              meta: { name: 'TxKit Transaction', description: payload.preview },
              transactions: [payload.safeTx],
            }
            const download = `\n\n<DownloadButton data='${JSON.stringify(builderFile)}' filename='tx-${(req as any).protocol}-${(req as any).chain}-${Date.now()}.json' />\n`
            return `${summary}\n\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\`${download}`
          }
          return `${summary}\n\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``
        } catch (e: any) {
          return `⚠️ Failed to build executable tx: ${e?.message || 'Unknown error'}`
        }
      }

      case 'tx_cowswap': {
        const required = [
          'chain',
          'from',
          'to',
          'amount',
          'minAmountOut',
          'sender',
        ]
        for (const k of required) {
          if (!(k in args)) return `⚠️ Missing required field: ${k}`
        }
        const req: ActionRequest = {
          protocol: 'cowswap',
          action: 'swap',
          chain: args.chain,
          from: args.from,
          to: args.to,
          amount: args.amount,
          minAmountOut: args.minAmountOut,
          ttlSeconds: args.ttlSeconds,
          feeAmountBp: args.feeAmountBp,
          receiver: args.receiver,
          sender: args.sender,
        }
        try {
          const payload = await buildCowOrderSignerPreSign(req)
          const summary = `CowSwap pre-sign Safe tx (delegatecall) for ${req.amount} ${req.from} → ${req.to} on ${req.chain}.`
          const builderFile = {
            version: '1.0',
            chainId: payload.chainId,
            createdAt: Date.now(),
            meta: {
              name: 'TxKit CowSwap Pre-Sign',
              description: payload.preview,
            },
            transactions: [payload.safeTx],
          }
          const download = `\n\n<DownloadButton data='${JSON.stringify(builderFile)}' filename='tx-cowswap-presign-${req.chain}-${Date.now()}.json' />\n`
          return `${summary}\n\n\`\`\`json\n${JSON.stringify(payload.safeTx, null, 2)}\n\`\`\`${download}`
        } catch (e: any) {
          return `⚠️ Failed to build CowSwap pre-sign payload: ${e?.message || 'Unknown error'}`
        }
      }

      default:
        // Consolidated per‑protocol executor: defikit_<protocol>
        if (name.startsWith('defikit_')) {
          const protocol = name.replace(/^defikit_/, '')

          // Basic validation
          if (
            !args.rolesModAddress ||
            typeof args.rolesModAddress !== 'string'
          ) {
            return '⚠️ **Missing Roles Modifier Address**: Provide the Zodiac Roles modifier contract address.'
          }
          if (!/^0x[a-fA-F0-9]{40}$/.test(args.rolesModAddress)) {
            return '⚠️ **Invalid Address**: Provide a valid Ethereum address (0x + 40 hex).'
          }
          if (!args.role || typeof args.role !== 'string') {
            return '⚠️ **Missing Role**: Please specify a role identifier (e.g., "manager").'
          }
          if (!args.action || typeof args.action !== 'string') {
            return '⚠️ **Missing Action**: Specify an action supported by the protocol.'
          }

          const op = (args.op === 'revoke' ? 'revoke' : 'allow') as
            | 'allow'
            | 'revoke'
          const chain = args.chain || 'eth'

          const rawParams = {
            chain,
            rolesModAddress: args.rolesModAddress,
            role: args.role,
            protocol,
            action: args.action,
            targets: args.targets,
            tokens: args.tokens,
            market: args.market,
            fees: args.fees,
            sell: args.sell,
            buy: args.buy,
            feeAmountBp: args.feeAmountBp,
            twap: args.twap,
            receiver: args.receiver,
          }

          try {
            const params = normalizeDeFiKitArgs(rawParams as any)
            const resp =
              op === 'allow'
                ? await defiKitClient.allowPermission(params)
                : await defiKitClient.revokePermission(params)
            const formatted = defiKitClient.formatResponse(resp, params, op)
            const embeddedJson = `\n<DeFiKitResponse>${JSON.stringify(resp)}</DeFiKitResponse>\n`

            console.log('✅ Tool Execution Completed:', {
              toolName: name,
              duration: `${Date.now() - startTime}ms`,
              protocol,
              action: args.action,
              operation: op,
              transactionCount: resp.transactions.length,
              timestamp: new Date().toISOString(),
            })

            return formatted + embeddedJson
          } catch (error) {
            console.error('❌ DeFi Kit Execution Failed:', {
              toolName: name,
              protocol,
              action: args.action,
              operation: op,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            })
            throw error
          }
        }
        console.log('⚠️ Unknown tool called:', name)
        return `Function ${name} not implemented yet.`
    }
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('❌ Tool Execution Failed:', {
      toolName: name,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    // Provide specific error messages based on the tool and error type
    const getErrorMessage = (toolName: string, error: any): string => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      switch (toolName) {
        case 'messari_copilot':
          if (
            errorMessage.includes('authentication failed') ||
            errorMessage.includes('API key')
          ) {
            return '⚠️ Service unavailable for market analysis right now.'
          }
          if (errorMessage.includes('rate limit')) {
            return '⚠️ Too many requests for market analysis. Please try again shortly.'
          }
          if (errorMessage.includes('timeout')) {
            return '⚠️ The market analysis request timed out.'
          }
          if (errorMessage.includes('unavailable')) {
            return '⚠️ Market data service is temporarily unavailable.'
          }
          return '⚠️ Unable to complete market analysis.'

        case 'get_portfolio':
          if (
            errorMessage.includes('authentication failed') ||
            errorMessage.includes('access key')
          ) {
            return '⚠️ Portfolio analysis service is temporarily unavailable.'
          }
          if (errorMessage.includes('rate limit')) {
            return '⚠️ Too many portfolio requests. Please wait a moment and retry.'
          }
          if (args.address && !/^0x[a-fA-F0-9]{40}$/.test(args.address)) {
            return '⚠️ The provided wallet address is invalid.'
          }
          return '⚠️ Unable to analyze that wallet right now.'

        case 'setup_defi_permission':
        case 'revoke_defi_permission':
          if (errorMessage.includes('rate limit')) {
            return '⚠️ Too many permission requests. Please retry in a moment.'
          }
          if (errorMessage.includes('Protocol or action not supported')) {
            return '⚠️ The chosen protocol or action is not supported.'
          }
          if (errorMessage.includes('Invalid request parameters')) {
            return '⚠️ Some parameters look invalid for this protocol.'
          }
          if (errorMessage.includes('unavailable')) {
            return '⚠️ The permissions service is temporarily unavailable.'
          }
          if (
            args.rolesModAddress &&
            (!args.rolesModAddress.startsWith('0x') ||
              args.rolesModAddress.length !== 42)
          ) {
            return '⚠️ The provided modifier contract address is invalid.'
          }
          return '⚠️ Unable to process the permissions request.'

        default:
          return '⚠️ Something went wrong while processing your request.'
      }
    }

    // Build a concise, non-technical summary for the agent
    const contextSummary = (() => {
      if (
        name === 'setup_defi_permission' ||
        name === 'revoke_defi_permission'
      ) {
        const verb = name === 'setup_defi_permission' ? 'setup' : 'revocation'
        const proto =
          typeof args?.protocol === 'string' ? args.protocol : 'unknown'
        const act = typeof args?.action === 'string' ? args.action : 'unknown'
        return `❌ ${verb} failed: protocol "${proto}", action "${act}".`
      }
      return `❌ ${name} failed.`
    })()

    const friendly = getErrorMessage(name, error)

    // Ask the agent/user to clarify next steps without exposing technical details
    const nextStepHint = (() => {
      if (
        name === 'setup_defi_permission' ||
        name === 'revoke_defi_permission'
      ) {
        return '\nPlease confirm the protocol, action, and any required parameters (e.g., tokens/targets/fees/market), and I can try again.'
      }
      return ''
    })()

    return `${contextSummary}\n${friendly}${nextStepHint}`
  }
}
