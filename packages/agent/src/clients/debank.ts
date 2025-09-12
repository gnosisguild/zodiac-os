import { getDeBankAccessKey } from '@zodiac/env'
import axios from 'axios'

export interface DeBankChain {
  id: string
  community_id: number
  name: string
  native_token_id: string
  logo_url: string
  wrapped_token_id: string
  is_support_pre_exec: boolean
  born_at: number
}

export interface DeBankTotalBalance {
  total_usd_value: number
}

export interface DeBankUser {
  id: string
  addr: string
  total_usd_value: number
  chain_list: DeBankChain[]
}

export interface DeBankTokenBalance {
  id: string
  chain: string
  name: string
  symbol: string
  display_symbol?: string
  optimized_symbol: string
  decimals: number
  logo_url: string
  protocol_id: string
  price: number
  is_core: boolean
  is_wallet: boolean
  time_at: number
  amount: number
  raw_amount: number
}

export interface DeBankProtocol {
  id: string
  chain: string
  name: string
  site_url: string
  logo_url: string
  has_supported_portfolio: boolean
  tvl: number
  portfolio_item_list: Array<{
    stats: {
      asset_usd_value: number
      debt_usd_value: number
      net_usd_value: number
    }
    update_at: number
    name: string
    detail_types: string[]
    detail: any
    proxy_detail: any
    pool?: any
    position_index?: string
  }>
}

class DeBankClient {
  private baseURL = 'https://pro-openapi.debank.com/v1'
  private accessKey: string

  constructor() {
    try {
      this.accessKey = getDeBankAccessKey()
    } catch (error) {
      this.accessKey = ''
      console.warn('DEBANK_ACCESS_KEY not found in environment variables')
    }
  }

  async getAllComplexProtocolList(
    address: string,
    chainIds?: string[],
  ): Promise<DeBankProtocol[]> {
    console.log('🔄 DeBank API Request - Get All Complex Protocol List:', {
      url: `${this.baseURL}/user/all_complex_protocol_list`,
      address,
      chainIds,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(
        `${this.baseURL}/user/all_complex_protocol_list`,
        {
          params: {
            id: address,
            ...(chainIds && chainIds.length
              ? { chain_ids: chainIds.join(',') }
              : {}),
          },
          headers: this.getHeaders(),
          timeout: 30000,
        },
      )

      const duration = Date.now() - startTime
      console.log('✅ DeBank API Success - Get All Complex Protocol List:', {
        duration: `${duration}ms`,
        protocolsCount: Array.isArray(response.data) ? response.data.length : 0,
        timestamp: new Date().toISOString(),
      })

      return response.data || []
    } catch (error) {
      console.error('❌ DeBank API Error - Get All Complex Protocol List:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401) {
          throw new Error(
            'DeBank API authentication failed. Check your access key.',
          )
        }
        if (status === 429) {
          throw new Error(
            'DeBank API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'DeBank API is currently unavailable. Please try again later.',
          )
        }
      }

      throw new Error(
        `DeBank all complex protocol list request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getTotalNetCurve(
    address: string,
    chainIds?: string[],
  ): Promise<Array<{ timestamp: number; usd_value: number }>> {
    console.log('🔄 DeBank API Request - Get Total Net Curve:', {
      url: `${this.baseURL}/user/total_net_curve`,
      address,
      chainIds,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(`${this.baseURL}/user/total_net_curve`, {
        params: {
          id: address,
          ...(chainIds && chainIds.length
            ? { chain_ids: chainIds.join(',') }
            : {}),
        },
        headers: this.getHeaders(),
        timeout: 30000,
      })

      const duration = Date.now() - startTime
      console.log('✅ DeBank API Success - Get Total Net Curve:', {
        duration: `${duration}ms`,
        points: Array.isArray(response.data) ? response.data.length : 0,
        timestamp: new Date().toISOString(),
      })

      return response.data || []
    } catch (error) {
      console.error('❌ DeBank API Error - Get Total Net Curve:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401) {
          throw new Error(
            'DeBank API authentication failed. Check your access key.',
          )
        }
        if (status === 429) {
          throw new Error(
            'DeBank API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'DeBank API is currently unavailable. Please try again later.',
          )
        }
      }

      throw new Error(
        `DeBank total net curve request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private getHeaders() {
    return {
      AccessKey: this.accessKey,
      'Content-Type': 'application/json',
    }
  }

  async getUsedChains(address: string): Promise<DeBankChain[]> {
    console.log('🔄 DeBank API Request - Get Used Chains:', {
      url: `${this.baseURL}/user/used_chain_list`,
      address: address,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(`${this.baseURL}/user/used_chain_list`, {
        params: { id: address },
        headers: this.getHeaders(),
        timeout: 30000,
      })

      const duration = Date.now() - startTime

      console.log('✅ DeBank API Success - Get Used Chains:', {
        duration: `${duration}ms`,
        chainsCount: response.data.length || 0,
        timestamp: new Date().toISOString(),
      })

      // Debug: Log the actual chains returned
      if (response.data && response.data.length > 0) {
        console.log(
          '🔍 Debug - Chains returned:',
          response.data.map((chain: DeBankChain) => ({
            id: chain.id,
            name: chain.name,
            community_id: chain.community_id,
          })),
        )
      }

      return response.data || []
    } catch (error) {
      console.error('❌ DeBank API Error - Get Used Chains:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401) {
          throw new Error(
            'DeBank API authentication failed. Check your access key.',
          )
        }
        if (status === 429) {
          throw new Error(
            'DeBank API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'DeBank API is currently unavailable. Please try again later.',
          )
        }
      }

      throw new Error(
        `DeBank used chains request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getTotalBalance(address: string): Promise<DeBankTotalBalance> {
    console.log('🔄 DeBank API Request - Get Total Balance:', {
      url: `${this.baseURL}/user/total_balance`,
      address: address,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(`${this.baseURL}/user/total_balance`, {
        params: { id: address },
        headers: this.getHeaders(),
        timeout: 30000,
      })

      const duration = Date.now() - startTime

      console.log('✅ DeBank API Success - Get Total Balance:', {
        duration: `${duration}ms`,
        totalValue: response.data.total_usd_value,
        timestamp: new Date().toISOString(),
      })

      return response.data
    } catch (error) {
      console.error('❌ DeBank API Error - Get Total Balance:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401) {
          throw new Error(
            'DeBank API authentication failed. Check your access key.',
          )
        }
        if (status === 429) {
          throw new Error(
            'DeBank API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'DeBank API is currently unavailable. Please try again later.',
          )
        }
      }

      throw new Error(
        `DeBank total balance request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getTokenList(
    address: string,
    chainId: string,
  ): Promise<DeBankTokenBalance[]> {
    console.log('🔄 DeBank API Request - Get Token List:', {
      url: `${this.baseURL}/user/token_list`,
      address: address,
      chainId: chainId,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(`${this.baseURL}/user/token_list`, {
        params: {
          id: address,
          chain_id: chainId,
          is_all: true,
        },
        headers: this.getHeaders(),
        timeout: 30000,
      })

      const duration = Date.now() - startTime

      console.log('✅ DeBank API Success - Get Token List:', {
        duration: `${duration}ms`,
        chainId: chainId,
        tokensCount: response.data.length || 0,
        timestamp: new Date().toISOString(),
      })

      return response.data || []
    } catch (error) {
      console.error('❌ DeBank API Error - Get Token List:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        chainId: chainId,
        timestamp: new Date().toISOString(),
      })

      throw new Error(
        `DeBank token list request failed for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getProtocolList(
    address: string,
    chainId: string,
  ): Promise<DeBankProtocol[]> {
    console.log('🔄 DeBank API Request - Get Protocol List:', {
      url: `${this.baseURL}/user/complex_protocol_list`,
      address: address,
      chainId: chainId,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.get(
        `${this.baseURL}/user/complex_protocol_list`,
        {
          params: {
            id: address,
            chain_id: chainId,
          },
          headers: this.getHeaders(),
          timeout: 30000,
        },
      )

      const duration = Date.now() - startTime

      console.log('✅ DeBank API Success - Get Protocol List:', {
        duration: `${duration}ms`,
        chainId: chainId,
        protocolsCount: response.data.length || 0,
        timestamp: new Date().toISOString(),
      })

      return response.data || []
    } catch (error) {
      console.error('❌ DeBank API Error - Get Protocol List:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        chainId: chainId,
        timestamp: new Date().toISOString(),
      })

      throw new Error(
        `DeBank protocol list request failed for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

export default new DeBankClient()
