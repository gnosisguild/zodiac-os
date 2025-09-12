import {
  getTokenInfo,
  getTokenInfoByAddress,
} from '../../../services/token-resolver'
import { Chain } from '../types'

export function toBigInt(value: string | number): bigint {
  if (typeof value === 'number') return BigInt(Math.trunc(value))
  if (value.startsWith('0x')) return BigInt(value)
  if (value.includes('.')) {
    const [i, f] = value.split('.')
    if (!f) return BigInt(i)
    const trimmed = (i || '0') + f
    return BigInt(trimmed)
  }
  return BigInt(value)
}

export function encodeBytes32Ascii(str: string): string {
  // Browser-compatible implementation using TextEncoder
  const encoder = new TextEncoder()
  const buf = encoder.encode(str)
  if (buf.length > 32) throw new Error('String too long for bytes32')

  // Create a 32-byte array and fill it
  const padded = new Uint8Array(32)
  padded.set(buf, 0)

  // Convert to hex string
  return (
    '0x' +
    Array.from(padded)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  )
}

export function parseAmountToUnits(
  amount: string | number,
  symbolOrAddress: string,
  chain: Chain,
): { value: string; decimals: number } {
  let info = getTokenInfo(symbolOrAddress, chain)
  if (!info && /^0x[a-fA-F0-9]{40}$/.test(symbolOrAddress)) {
    info = getTokenInfoByAddress(symbolOrAddress, chain) || null
  }
  if (!info) throw new Error(`Unknown token for ${chain}: ${symbolOrAddress}`)
  const decimals = info.decimals
  const [whole, frac = ''] = String(amount).split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  let base = BigInt(1)
  for (let i = 0; i < decimals; i++) base = base * BigInt(10)
  const units = BigInt(whole || '0') * base + BigInt(fracPadded || '0')
  return { value: units.toString(), decimals }
}
