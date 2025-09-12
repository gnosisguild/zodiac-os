# DeFi Kit Client Implementation Plan

## Executive Summary

Create a TypeScript client for karpatkey's DeFi Kit API that integrates with Zodiac Roles to enable AI-powered treasury management through standardized DeFi permissions. The client will generate Safe-compatible transactions for role-based access control across major DeFi protocols.

## What is DeFi Kit?

DeFi Kit is a permission management system that:
- Defines safe, standardized actions for DeFi protocols (deposit, borrow, stake, swap, etc.)
- Integrates with Zodiac Roles (a Safe module) for role-based access control
- Generates transaction data that can be executed through Safe Transaction Builder
- Supports 35+ protocols across 5+ chains (Ethereum, Gnosis, Arbitrum, Optimism, Base)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Zodiac Agent  │───▶│  DeFi Kit API   │───▶│ Safe Transaction│
│   (AI + Tools)  │    │    (Client)     │    │    Builder      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Client Design

### 1. Simple API Structure

**Base URL**: `https://kit.karpatkey.com/api/v1`
**Pattern**: `GET /<chain>:<address>/<role>/<allow|revoke>/<protocol>/<action>?<params>`

### 2. Client Interface

```typescript
class DeFiKitClient {
  // Core permission management
  allow(params: PermissionParams): Promise<SafeTransaction>
  revoke(params: PermissionParams): Promise<SafeTransaction>
  
  // Protocol-specific helpers
  aave: AaveActions
  uniswap: UniswapActions
  lido: LidoActions
  // ... other protocols
  
  // Utility methods
  getSupportedProtocols(chain: string): Promise<string[]>
  validateAddress(address: string): boolean
  formatTransaction(response: ApiResponse): SafeTransaction
}
```

### 3. Key Types

```typescript
interface PermissionParams {
  chain: string          // 'eth', 'gno', 'arb', 'opt', 'base'
  rolesModAddress: string // Zodiac Roles modifier address
  role: string           // Role identifier
  protocol: string       // 'aave_v3', 'uniswap_v3', etc.
  action: DeFiAction     // 'deposit', 'borrow', 'stake', etc.
  targets?: string[]     // Protocol-specific targets
  tokens?: string[]      // Token addresses or symbols
  // ... other action-specific params
}

type DeFiAction = 'deposit' | 'borrow' | 'stake' | 'swap' | 'bridge' | 'delegate' | 'lock'

interface SafeTransaction {
  to: string
  data: string
  value: string
}
```

## Implementation Phases

### Phase 1: Core Client (Week 1)
- Basic HTTP client with TypeScript types
- Core `allow`/`revoke` methods
- Error handling and validation
- Support for top 5 protocols (Aave v3, Uniswap v3, Lido, Balancer v2, Compound v3)

### Phase 2: Protocol Helpers (Week 2)
- Protocol-specific method builders
- Parameter validation for each action
- Chain-specific contract address resolution
- Transaction simulation capabilities

### Phase 3: Agent Integration (Week 3)
- Tool definitions for common DeFi operations
- Handler methods for AI agent integration
- Response formatting for chat interface
- Example workflows and use cases

### Phase 4: Advanced Features (Week 4)
- Batch transaction support
- Role management utilities
- Permission auditing tools
- Integration with existing portfolio analysis

## Supported Protocols & Actions

### High Priority Protocols
1. **Aave v3** - deposit, borrow, stake, delegate
2. **Uniswap v3** - deposit (LP), swap
3. **Lido** - stake, delegate
4. **Balancer v2** - deposit (LP), stake
5. **Compound v3** - deposit, borrow

### Supported Chains
- Ethereum (`eth`)
- Gnosis Chain (`gno`) 
- Arbitrum (`arb`)
- Optimism (`opt`)
- Base (`base`)

## Agent Tool Integration

### Proposed Tools

1. **`setup_defi_permissions`**
   - Set up role-based permissions for treasury management
   - Parameters: protocol, action, role, constraints

2. **`manage_treasury_position`** 
   - Execute DeFi operations within defined permissions
   - Parameters: protocol, action, amount, constraints

3. **`audit_defi_permissions`**
   - Review current permissions and suggest optimizations
   - Parameters: rolesModAddress, role (optional)

### Example Agent Workflows

1. **Treasury Setup**: "Set up permissions for the treasury team to deposit up to 100 ETH in Aave v3"
2. **Position Management**: "Deposit 50 ETH into Lido staking with current permissions"  
3. **Permission Audit**: "Review all DeFi permissions for role 'traders' and identify risks"

## File Structure

```
lib/clients/defi-kit/
├── index.ts              # Main client export
├── client.ts             # Core DeFiKitClient class
├── types.ts              # TypeScript interfaces
├── protocols/            # Protocol-specific helpers
│   ├── aave.ts
│   ├── uniswap.ts
│   ├── lido.ts
│   └── ...
├── utils/                # Utility functions
│   ├── validation.ts
│   ├── formatting.ts
│   └── constants.ts
└── __tests__/            # Test files
    ├── client.test.ts
    └── protocols/
```

## Implementation Details

### HTTP Client
- Use axios for HTTP requests (already in project)
- Implement retry logic with exponential backoff
- Cache supported protocols/chains for performance
- Comprehensive error handling with user-friendly messages

### Type Safety
- Strict TypeScript types for all API interactions
- Runtime validation using Zod or similar
- Protocol-specific parameter validation
- Chain ID and address format validation

### Error Handling
- API rate limiting graceful handling
- Network timeout and retry logic
- Invalid parameter validation with helpful messages
- Transaction simulation warnings

### Testing Strategy
- Unit tests for core client functionality
- Integration tests with live API endpoints
- Mock tests for protocol-specific methods
- End-to-end tests for common workflows

## Security Considerations

### Address Validation
- Strict validation of all Ethereum addresses
- Chain-specific address format checking
- Roles modifier address verification

### Permission Safety
- Parameter constraint validation
- Protocol-specific safety checks
- Transaction value limits
- Multi-sig requirement enforcement

### API Security
- Input sanitization for all parameters
- Rate limiting compliance
- Secure HTTP headers
- No sensitive data in logs

## Success Metrics

### Technical Metrics
- 100% TypeScript coverage
- <200ms average API response time
- >99% API reliability
- Zero security vulnerabilities

### User Experience Metrics
- Simple 3-step setup process
- Clear error messages for all failure cases
- Comprehensive documentation with examples
- Seamless integration with existing tools

## Future Enhancements

### Advanced Features
- Transaction batching for gas optimization
- Cross-chain permission management
- Advanced role hierarchy support
- Real-time permission monitoring

### AI/ML Integration
- Smart parameter suggestion based on portfolio analysis
- Risk assessment for permission changes
- Automated permission optimization
- Predictive treasury management recommendations

## Dependencies

### Required
- `axios`: HTTP client (already installed)
- `ethers` or `viem`: Ethereum utilities for address validation
- `zod`: Runtime type validation

### Optional
- `@safe-global/safe-core-sdk`: Enhanced Safe integration
- `@zodiac-roles/sdk`: Direct Roles modifier integration

## Risk Assessment

### Low Risk
- API availability (public, stable service)
- Breaking changes (versioned API)
- Performance (cached responses, simple endpoints)

### Medium Risk  
- Complex protocol interactions (mitigated by comprehensive testing)
- Multi-chain complexity (isolated by chain-specific modules)

### High Risk
- Smart contract security (mitigated by using only whitelisted protocols)
- Permission management errors (mitigated by strict validation)

## Timeline

**Week 1**: Core client implementation with basic protocols
**Week 2**: Protocol helpers and enhanced validation  
**Week 3**: Agent integration and tool definitions
**Week 4**: Testing, documentation, and advanced features

**Total**: 4 weeks for full implementation and integration

## Conclusion

This implementation plan provides a simple yet powerful DeFi Kit client that seamlessly integrates with Zodiac Agent for AI-powered treasury management. The modular design ensures maintainability while the comprehensive type system provides safety and developer experience.

The client will enable users to:
1. **Set up** role-based DeFi permissions through natural language
2. **Execute** treasury operations within defined constraints  
3. **Audit** and optimize permission structures
4. **Scale** across multiple protocols and chains

By focusing on simplicity and safety, this client will democratize access to sophisticated DeFi treasury management tools while maintaining the security and precision required for handling substantial assets.