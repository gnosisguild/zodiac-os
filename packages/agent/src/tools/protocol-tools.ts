import type { Anthropic } from '@anthropic-ai/sdk'
import {
  getProtocolConfig,
  getSupportedProtocols,
} from '../clients/defikit/protocols'
import { ParameterSchema } from '../clients/defikit/types'

/**
 * Generate per‑protocol tool definitions from SSOT (protocols.ts)
 * Names: defikit_<protocol>; short descriptions; action enum scoped per protocol.
 */
export function generateProtocolTools(): Anthropic.Tool[] {
  const tools: Anthropic.Tool[] = []

  for (const protocol of getSupportedProtocols()) {
    const cfg = getProtocolConfig(protocol)
    if (!cfg) continue

    // Collect protocol‑specific params across actions (all optional in input schema)
    const paramEntries = new Map<string, ParameterSchema>()
    for (const act of cfg.actions) {
      const params = cfg.parameters[act]
      for (const [name, schema] of Object.entries(params || {})) {
        if (!paramEntries.has(name)) paramEntries.set(name, schema)
      }
    }

    const properties: Record<string, any> = {
      rolesModAddress: {
        type: 'string',
        description: 'Zodiac Roles modifier address',
      },
      role: { type: 'string', description: 'Role identifier (e.g., "trader")' },
      action: {
        type: 'string',
        enum: cfg.actions,
        description: 'Protocol action',
      },
      chain: {
        type: 'string',
        enum: ['eth', 'arb', 'opt', 'base', 'gno'],
        default: 'eth',
        description: 'Chain (default eth)',
      },
      op: {
        type: 'string',
        enum: ['allow', 'revoke'],
        default: 'allow',
        description: 'Operation (allow or revoke)',
      },
    }

    for (const [name, schema] of Array.from(paramEntries.entries())) {
      properties[name] = convertSchema(schema)
    }

    tools.push({
      name: `defikit_${protocol}`,
      description: `DeFi Kit permissions for ${cfg.name}. Actions: ${cfg.actions.join(', ')}.`,
      input_schema: {
        type: 'object',
        properties,
        required: ['rolesModAddress', 'role', 'action'],
      },
    })
  }

  return tools
}

function convertSchema(schema: ParameterSchema): any {
  const converted: any = { description: schema.description }
  switch (schema.type) {
    case 'string':
    case 'address':
      converted.type = 'string'
      break
    case 'number':
      converted.type = 'number'
      break
    case 'boolean':
      converted.type = 'boolean'
      break
    case 'string[]':
      converted.type = 'array'
      converted.items = { type: 'string' }
      break
  }
  if (schema.constraints?.enum) converted.enum = schema.constraints.enum
  if (schema.constraints?.min !== undefined)
    converted.minimum = schema.constraints.min
  if (schema.constraints?.max !== undefined)
    converted.maximum = schema.constraints.max
  return converted
}
