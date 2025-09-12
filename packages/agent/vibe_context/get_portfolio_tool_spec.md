# Debank `get_portfolio` Tool Spec

Purpose: Replace redundant Debank tools with a single tool that returns an agent-readable JSON of protocol positions, token balances, and 24h net curve for a wallet.

## Tool
- Name: `get_portfolio`
- Input: `{ address: string }` (0x-prefixed EVM address)
- Chains: Restricted to `eth, arb, base, op, xdai` (Gnosis uses `xdai` in DeBank)
- Threshold: Only include entries with balance/value strictly greater than $1

## Endpoints Used (DeBank User API)
- Protocols (all chains): `GET /v1/user/all_complex_protocol_list`
  - Params: `id`, `chain_ids=eth,arb,base,op,xdai`
- Tokens (per chain): `GET /v1/user/token_list`
  - Params: `id`, `chain_id` in {eth,arb,base,op,xdai}, `is_all=true`
- 24h Net Curve (all chains): `GET /v1/user/total_net_curve`
  - Params: `id`, `chain_ids=eth,arb,base,op,xdai`
- Summary value: `GET /v1/user/total_balance`
  - Params: `id`

## Output JSON (Agent-Readable)
Top-level fields:
- `address`: input address
- `fetched_at`: ISO timestamp
- `version`: e.g., `"1.0"`
- `summary`: `{ total_usd_value: number }`
- `protocols`: Array of protocol objects
- `tokens`: Array of token objects
- `net_curve_24h`: Array of `{ timestamp: number, usd_value: number }`
- `meta`: statistics and warnings

Protocol object:
- `chain_id`: string (e.g., `"eth"`)
- `name`: string
- `logo_url`: string
- `portfolio_item_list`: Array of DeBank portfolio items (preserved shape as in `context/debank_portfolio_item_docs.md`), filtered to items where `stats.net_usd_value > 1`

Token object:
- `chain_id`: string (e.g., `"arb"`)
- `name`: string
- `optimized_symbol`: string
- `logo_url`: string
- `price`: number
- `amount`: number
- `balance`: number (= `price * amount`), only included if `balance > 1`

Meta:
- `counts`: `{ protocols: number, portfolio_items: number, tokens: number }`
- `chains_present`: string[] (unique chain ids from protocols/tokens)
- `warnings`: string[] (partial failures, rate-limit notes, etc.)
- `duration_ms`: number

### Example Skeleton
```json
{
  "address": "0xabc...def",
  "fetched_at": "2025-08-30T12:34:56.789Z",
  "version": "1.0",
  "summary": { "total_usd_value": 12345.67 },
  "protocols": [
    {
      "chain_id": "eth",
      "name": "Uniswap V3",
      "logo_url": "https://.../uniswap3.png",
      "portfolio_item_list": [
        { "name": "Position #123", "stats": { "net_usd_value": 250.12 }, "detail": { /* ... */ } }
      ]
    }
  ],
  "tokens": [
    {
      "chain_id": "arb",
      "name": "USD Coin",
      "optimized_symbol": "USDC",
      "logo_url": "https://.../usdc.png",
      "price": 1.0,
      "amount": 512.34,
      "balance": 512.34
    }
  ],
  "net_curve_24h": [
    { "timestamp": 1671012000, "usd_value": 333318.12 }
  ],
  "meta": {
    "counts": { "protocols": 1, "portfolio_items": 1, "tokens": 1 },
    "chains_present": ["arb", "eth"],
    "warnings": [],
    "duration_ms": 1234
  }
}
```

## Implementation Notes
- Address validation: require `^0x[a-fA-F0-9]{40}$`.
- Concurrency: Use `Promise.allSettled` for a single protocols call, a single 24h net-curve call, and 5 token-list calls.
- Filtering: drop token entries with `balance <= 1`; drop portfolio items with `stats.net_usd_value <= 1`; drop protocols that become empty after filtering.
- Error handling: collect non-fatal errors into `meta.warnings`; still return successful parts.
- Authentication: via `DEBANK_ACCESS_KEY` header.
- Frontend: JSON is structured to be renderable by the UI later; no markdown formatting.

## Code Touchpoints
- Client: `lib/clients/debank.ts`
  - `getAllComplexProtocolList(address, chainIds)`
  - `getTotalNetCurve(address, chainIds)`
  - Existing: `getTokenList(address, chainId)`, `getTotalBalance(address)`
- Tool definition: `lib/tools/definitions.ts` (`get_portfolio`)
- Handler: `lib/tools/handlers.ts` (case: `get_portfolio`)
- Pruner: `lib/tools/pruner.ts` (always keep `get_portfolio`)
- System prompt: `app/api/chat/route.ts` (refer to `get_portfolio`)

## Decisions (resolved)
- Include `total_usd_value` in output summary: Yes
- Custom input chains: No (fixed to ETH/ARB/BASE/OP/Gnosis)
- Protocol scope: restricted to the five chains above

