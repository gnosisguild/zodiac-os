import axios from 'axios'
import { normalizeDeFiKitArgs } from './defikit/normalize'
import {
  Chain,
  DeFiKitParams,
  DeFiKitResponse,
  DeFiKitTransaction,
} from './defikit/types'
import { validateParameters } from './defikit/validation'

// Re-export types for backward compatibility
export type { DeFiKitParams, DeFiKitResponse, DeFiKitTransaction }

class DeFiKitClient {
  private baseURL = 'https://kit.karpatkey.com/api/v1'

  constructor() {
    // No API key needed - DeFi Kit API is public
    console.log('🔧 DeFi Kit Client initialized with public API')
  }

  private buildUrl(
    params: DeFiKitParams,
    operation: 'allow' | 'revoke',
  ): string {
    const { chain, rolesModAddress, role, protocol, action, ...queryParams } =
      params

    // Build base URL following DeFi Kit pattern:
    // GET /<chain>:<address>/<role>/<allow|revoke>/<protocol>/<action>?<query>
    let url = `${this.baseURL}/${chain}:${rolesModAddress}/${role}/${operation}/${protocol}/${action}`

    // Add query parameters (mapping is now done before this method is called)
    const query = new URLSearchParams()

    // Use the already-mapped parameters
    const mappedParams = queryParams

    if (mappedParams.targets && mappedParams.targets.length > 0) {
      query.append('targets', mappedParams.targets.join(','))
    }

    if (mappedParams.tokens && mappedParams.tokens.length > 0) {
      query.append('tokens', mappedParams.tokens.join(','))
    }

    if (mappedParams.sell && mappedParams.sell.length > 0) {
      query.append('sell', mappedParams.sell.join(','))
    }

    if (mappedParams.buy && mappedParams.buy.length > 0) {
      query.append('buy', mappedParams.buy.join(','))
    }

    if (mappedParams.fees && mappedParams.fees.length > 0) {
      query.append('fees', mappedParams.fees.join(','))
    }

    if (mappedParams.market) {
      query.append('market', mappedParams.market)
    }

    if (mappedParams.delegatee) {
      query.append('delegatee', mappedParams.delegatee)
    }

    if (mappedParams.recipient) {
      query.append('recipient', mappedParams.recipient)
    }

    if (mappedParams.sender) {
      query.append('sender', mappedParams.sender)
    }

    if (mappedParams.feeAmountBp !== undefined) {
      query.append('feeAmountBp', mappedParams.feeAmountBp.toString())
    }

    if (mappedParams.twap !== undefined) {
      query.append('twap', mappedParams.twap.toString())
    }

    if (mappedParams.receiver) {
      query.append('receiver', mappedParams.receiver)
    }

    const queryString = query.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  // Legacy method removed - now using dedicated mapping system in ./defikit/mappings.ts

  private validateParams(params: DeFiKitParams): void {
    // Use comprehensive validation system
    const validation = validateParameters(params)

    if (!validation.valid) {
      const errorMessages = validation.errors.map((err) => err.message)
      throw new Error(
        `Parameter validation failed: ${errorMessages.join('; ')}`,
      )
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        console.warn(
          `⚠️ DeFi Kit Warning [${warning.parameter}]: ${warning.message}`,
        )
      })
    }
  }

  async allowPermission(params: DeFiKitParams): Promise<DeFiKitResponse> {
    // 1. Validate parameters using comprehensive validation system
    this.validateParams(params)

    // 2. Apply minimal, protocol-aware normalization
    const mappedParams = normalizeDeFiKitArgs(params)

    const url = this.buildUrl(mappedParams, 'allow')

    console.log('🔄 DeFi Kit API Request - Allow Permission:', {
      url: url,
      protocol: params.protocol,
      action: params.action,
      chain: params.chain,
      role: params.role,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      })

      const duration = Date.now() - startTime

      console.log('✅ DeFi Kit API Success - Allow Permission:', {
        duration: `${duration}ms`,
        protocol: params.protocol,
        action: params.action,
        transactionCount: response.data.transactions?.length || 0,
        chainId: response.data.chainId,
        timestamp: new Date().toISOString(),
      })

      return response.data
    } catch (error) {
      console.error('❌ DeFi Kit API Error - Allow Permission:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
        protocol: params.protocol,
        action: params.action,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 400) {
          throw new Error(
            `Invalid request parameters: ${error.response?.data?.message || 'Check protocol and action parameters'}`,
          )
        }
        if (status === 404) {
          throw new Error(
            `Protocol or action not supported: ${params.protocol}/${params.action}`,
          )
        }
        if (status === 429) {
          throw new Error(
            'DeFi Kit API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'DeFi Kit API is currently unavailable. Please try again later.',
          )
        }
      }

      throw new Error(
        `DeFi Kit permission request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async revokePermission(params: DeFiKitParams): Promise<DeFiKitResponse> {
    // 1. Validate parameters using comprehensive validation system
    this.validateParams(params)

    // 2. Apply minimal, protocol-aware normalization
    const mappedParams = normalizeDeFiKitArgs(params)

    const url = this.buildUrl(mappedParams, 'revoke')

    console.log('🔄 DeFi Kit API Request - Revoke Permission:', {
      url: url,
      protocol: params.protocol,
      action: params.action,
      chain: params.chain,
      role: params.role,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      })

      const duration = Date.now() - startTime

      console.log('✅ DeFi Kit API Success - Revoke Permission:', {
        duration: `${duration}ms`,
        protocol: params.protocol,
        action: params.action,
        transactionCount: response.data.transactions?.length || 0,
        chainId: response.data.chainId,
        timestamp: new Date().toISOString(),
      })

      return response.data
    } catch (error) {
      console.error('❌ DeFi Kit API Error - Revoke Permission:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
        protocol: params.protocol,
        action: params.action,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 400) {
          throw new Error(
            `Invalid request parameters: ${error.response?.data?.message || 'Check protocol and action parameters'}`,
          )
        }
        if (status === 404) {
          throw new Error(
            `Protocol or action not supported: ${params.protocol}/${params.action}`,
          )
        }
        if (status === 429) {
          throw new Error(
            'DeFi Kit API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'DeFi Kit API is currently unavailable. Please try again later.',
          )
        }
      }

      throw new Error(
        `DeFi Kit permission request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // Helper method to format response for display
  formatResponse(
    response: DeFiKitResponse,
    params: DeFiKitParams,
    operation: 'allow' | 'revoke',
  ): string {
    const operationText = operation === 'allow' ? 'Granted' : 'Revoked'
    const chainName = this.getChainName(params.chain)

    return `# DeFi Permission ${operationText}

## Transaction Details
- **Protocol**: ${params.protocol.toUpperCase()}
- **Action**: ${params.action}
- **Chain**: ${chainName} (${params.chain})
- **Role**: ${params.role}
- **Operation**: ${operation.toUpperCase()}
${response.meta?.description ? `- **Description**: ${response.meta.description}` : ''}

## Generated Transactions
${response.transactions
  .map(
    (tx, i) => `
### Transaction ${i + 1}
- **To**: \`${tx.to || 'N/A'}\`
- **Value**: ${tx.value || '0'} ETH
- **Method**: \`${tx.contractMethod?.name || 'N/A'}\`
- **Parameters**: ${
      tx.contractInputsValues
        ? Object.entries(tx.contractInputsValues)
            .map(([key, value]) => `\n  - **${key}**: \`${value}\``)
            .join('')
        : 'None'
    }
`,
  )
  .join('')}

## Safe Transaction Builder Compatible
✅ This JSON response can be directly imported into Safe Transaction Builder for execution.

## Download Transaction File
\`\`\`json
${JSON.stringify(this.toSafeTransactionBuilder(response), null, 2)}
\`\`\`

*${response.transactions.length} transaction(s) ready for execution*`
  }

  // Helper method to get chain display name
  private getChainName(chain: string): string {
    const chainNames: Record<string, string> = {
      eth: 'Ethereum',
      arb: 'Arbitrum',
      opt: 'Optimism',
      base: 'Base',
      gno: 'Gnosis Chain',
    }
    return chainNames[chain] || chain.toUpperCase()
  }

  // Helper method to convert DeFi Kit response to Safe Transaction Builder format
  // The DeFi Kit API response is already Safe Transaction Builder compatible!
  toSafeTransactionBuilder(response: DeFiKitResponse): any {
    return {
      version: response.version,
      chainId: response.chainId,
      createdAt: response.createdAt,
      meta: {
        ...response.meta,
        name: 'DeFi Kit Permissions Batch',
        description: 'Generated by DeFi Kit API for Zodiac Roles management',
      },
      transactions: response.transactions.map((tx) => ({
        to: tx.to,
        value: tx.value,
        data: null, // Safe Transaction Builder uses contractMethod + contractInputsValues
        contractMethod: tx.contractMethod,
        contractInputsValues: tx.contractInputsValues,
      })),
    }
  }

  // Helper method to aggregate multiple DeFi Kit responses into a single Safe Transaction Builder batch
  static aggregateResponses(
    responses: DeFiKitResponse[],
    batchName: string = 'Multi-Protocol DeFi Permissions',
  ): any {
    if (responses.length === 0) {
      throw new Error('No responses to aggregate')
    }

    // Use the first response as the base
    const baseResponse = responses[0]

    // Collect all transactions from all responses
    const allTransactions = responses.flatMap((response) =>
      response.transactions.map((tx) => ({
        to: tx.to,
        value: tx.value,
        data: null,
        contractMethod: tx.contractMethod,
        contractInputsValues: tx.contractInputsValues,
      })),
    )

    // Generate protocol summary for description
    const protocolSummary = responses
      .map((response, index) => {
        const txCount = response.transactions.length
        return `Batch ${index + 1}: ${txCount} transaction(s)`
      })
      .join(', ')

    return {
      version: baseResponse.version,
      chainId: baseResponse.chainId,
      createdAt: Date.now(),
      meta: {
        name: batchName,
        description: `Combined permissions batch: ${protocolSummary}. Total: ${allTransactions.length} transactions`,
        txBuilderVersion: baseResponse.meta?.txBuilderVersion || '1.16.2',
      },
      transactions: allTransactions,
    }
  }

  // Helper method to create a formatted summary of aggregated permissions
  static formatAggregatedSummary(
    responses: DeFiKitResponse[],
    protocols: string[],
  ): string {
    const totalTransactions = responses.reduce(
      (sum, response) => sum + response.transactions.length,
      0,
    )

    const protocolSummaries = responses
      .map((response, index) => {
        const protocol = protocols[index] || `Protocol ${index + 1}`
        return `• **${protocol.toUpperCase()}**: ${response.transactions.length} transaction(s)`
      })
      .join('\n')

    return `# Multi-Protocol DeFi Permissions Setup

## Summary
Successfully configured permissions across ${responses.length} protocol(s):

${protocolSummaries}

## Safe Transaction Builder Compatible
✅ Combined ${totalTransactions} transaction(s) ready for Safe Transaction Builder import.

## Combined Transaction File
\`\`\`json
${JSON.stringify(this.aggregateResponses(responses), null, 2)}
\`\`\`

*Total: ${totalTransactions} transaction(s) across ${responses.length} protocol(s)*`
  }

  // Helper methods for common protocols
  async setupAaveV3Permission(
    rolesModAddress: string,
    role: string,
    action: 'deposit' | 'borrow' | 'stake',
    tokens: string[],
    chain: Chain = 'eth',
    market?: string,
  ): Promise<DeFiKitResponse> {
    return this.allowPermission({
      chain,
      rolesModAddress,
      role,
      protocol: 'aave_v3',
      action,
      tokens, // Will be automatically mapped to targets
      market,
    })
  }

  async setupLidoPermission(
    rolesModAddress: string,
    role: string,
    chain: Chain = 'eth',
  ): Promise<DeFiKitResponse> {
    return this.allowPermission({
      chain,
      rolesModAddress,
      role,
      protocol: 'lido',
      action: 'stake',
      tokens: ['ETH'], // Will be automatically mapped to targets
    })
  }

  async setupUniswapV3Permission(
    rolesModAddress: string,
    role: string,
    action: 'deposit' | 'swap',
    tokens?: string[],
    fees?: string[],
    targets?: string[],
    chain: Chain = 'eth',
  ): Promise<DeFiKitResponse> {
    return this.allowPermission({
      chain,
      rolesModAddress,
      role,
      protocol: 'uniswap_v3',
      action,
      tokens,
      fees,
      targets,
    })
  }
}

const defiKitClient = new DeFiKitClient()

// Add static methods to the client instance for easy access
;(defiKitClient as any).aggregateResponses = DeFiKitClient.aggregateResponses
;(defiKitClient as any).formatAggregatedSummary =
  DeFiKitClient.formatAggregatedSummary

export { defiKitClient }
