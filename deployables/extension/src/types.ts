import type { JsonRpcRequest } from '@zodiac/messages'
import type { Hex, HexAddress } from '@zodiac/schema'

export type { JsonRpcRequest } from '@zodiac/messages'
export type { HexAddress } from '@zodiac/schema'

export interface JsonRpcError extends Error {
  data: {
    code: number
    message?: string
    data?: string
    originalError?: JsonRpcError['data']
  }
}

export interface Eip1193Provider {
  request(request: JsonRpcRequest): Promise<unknown>
  on(event: string, listener: (...args: any[]) => void): void
  removeListener(event: string, listener: (...args: any[]) => void): void
}

export interface TransactionData {
  to?: HexAddress
  value?: string
  data?: Hex
  from?: HexAddress
}
