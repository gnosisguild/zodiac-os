import { getProtocolConfig } from './protocols'
import {
  DeFiKitParams,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types'

export class ParameterValidator {
  /**
   * Comprehensive parameter validation for DeFi Kit requests
   */
  validate(params: DeFiKitParams): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 1. Basic protocol validation
    const protocolValidation = this.validateProtocol(params)
    errors.push(...protocolValidation.errors)
    warnings.push(...(protocolValidation.warnings || []))

    // 2. Required parameter validation
    const requiredValidation = this.validateRequired(params)
    errors.push(...requiredValidation.errors)

    // 3. Parameter type validation
    const typeValidation = this.validateTypes(params)
    errors.push(...typeValidation.errors)

    // 4. Parameter constraint validation
    const constraintValidation = this.validateConstraints(params)
    errors.push(...constraintValidation.errors)
    warnings.push(...(constraintValidation.warnings || []))

    // 5. Parameter dependency validation
    const dependencyValidation = this.validateDependencies(params)
    errors.push(...dependencyValidation.errors)

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Validate protocol exists and supports the action/chain
   */
  private validateProtocol(params: DeFiKitParams): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check if protocol exists
    const config = getProtocolConfig(params.protocol)
    if (!config) {
      errors.push({
        parameter: 'protocol',
        message: `Unknown protocol: ${params.protocol}`,
        type: 'constraint',
      })
      return { valid: false, errors, warnings }
    }

    // Check if action is supported
    if (!config.actions.includes(params.action)) {
      errors.push({
        parameter: 'action',
        message: `Protocol ${params.protocol} does not support action: ${params.action}`,
        type: 'constraint',
      })
    }

    // Check if chain is supported
    const deployment = config.deployments[params.chain]
    if (!deployment?.supported) {
      errors.push({
        parameter: 'chain',
        message: `Protocol ${params.protocol} is not deployed on chain: ${params.chain}`,
        type: 'constraint',
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate all required parameters are present
   */
  private validateRequired(params: DeFiKitParams): ValidationResult {
    const errors: ValidationError[] = []
    const config = getProtocolConfig(params.protocol)

    if (!config) {
      return { valid: true, errors } // Protocol validation will catch this
    }

    const actionParams = config.parameters[params.action]
    if (!actionParams) {
      return { valid: true, errors } // No parameters defined for this action
    }

    // Check each required parameter
    for (const [paramName, schema] of Object.entries(actionParams)) {
      if (schema.required && !this.hasValue(params, paramName)) {
        errors.push({
          parameter: paramName,
          message: `Required parameter missing: ${paramName}`,
          type: 'required',
        })
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate parameter types match schema
   */
  private validateTypes(params: DeFiKitParams): ValidationResult {
    const errors: ValidationError[] = []
    const config = getProtocolConfig(params.protocol)

    if (!config) return { valid: true, errors }

    const actionParams = config.parameters[params.action]
    if (!actionParams) return { valid: true, errors }

    for (const [paramName, schema] of Object.entries(actionParams)) {
      const value = this.getValue(params, paramName)
      if (value === undefined || value === null) continue

      if (!this.validateType(value, schema.type)) {
        errors.push({
          parameter: paramName,
          message: `Parameter ${paramName} must be of type ${schema.type}, got ${typeof value}`,
          type: 'type',
        })
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate parameter constraints (min/max, enum, patterns)
   */
  private validateConstraints(params: DeFiKitParams): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const config = getProtocolConfig(params.protocol)

    if (!config) return { valid: true, errors, warnings }

    const actionParams = config.parameters[params.action]
    if (!actionParams) return { valid: true, errors, warnings }

    for (const [paramName, schema] of Object.entries(actionParams)) {
      const value = this.getValue(params, paramName)
      if (value === undefined || value === null) continue

      const constraints = schema.constraints
      if (!constraints) continue

      // Numeric constraints
      if (typeof value === 'number') {
        if (constraints.min !== undefined && value < constraints.min) {
          errors.push({
            parameter: paramName,
            message: `Parameter ${paramName} must be >= ${constraints.min}, got ${value}`,
            type: 'constraint',
          })
        }
        if (constraints.max !== undefined && value > constraints.max) {
          errors.push({
            parameter: paramName,
            message: `Parameter ${paramName} must be <= ${constraints.max}, got ${value}`,
            type: 'constraint',
          })
        }
      }

      // Enum constraints
      if (constraints.enum && typeof value === 'string') {
        if (!constraints.enum.includes(value)) {
          errors.push({
            parameter: paramName,
            message: `Parameter ${paramName} must be one of [${constraints.enum.join(', ')}], got ${value}`,
            type: 'constraint',
          })
        }
      }

      // Pattern constraints
      if (constraints.pattern && typeof value === 'string') {
        if (!constraints.pattern.test(value)) {
          errors.push({
            parameter: paramName,
            message: `Parameter ${paramName} does not match required pattern`,
            type: 'constraint',
          })
        }
      }

      // Address format constraints
      if (constraints.addressFormat && typeof value === 'string') {
        if (!this.isValidAddress(value)) {
          errors.push({
            parameter: paramName,
            message: `Parameter ${paramName} must be a valid Ethereum address`,
            type: 'constraint',
          })
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate parameter dependencies (e.g., TWAP requires receiver)
   */
  private validateDependencies(params: DeFiKitParams): ValidationResult {
    const errors: ValidationError[] = []

    // CowSwap TWAP dependency
    if (params.protocol === 'cowswap' && params.twap === true) {
      if (!params.receiver) {
        errors.push({
          parameter: 'receiver',
          message: 'Parameter receiver is required when twap is true',
          type: 'dependency',
        })
      }
    }

    // Uniswap v3 position dependency
    if (params.protocol === 'uniswap_v3' && params.action === 'deposit') {
      if (!params.targets && !params.tokens) {
        errors.push({
          parameter: 'tokens',
          message:
            'Either targets (position IDs) or tokens must be specified for Uniswap v3 deposits',
          type: 'dependency',
        })
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Helper methods
   */
  private hasValue(params: DeFiKitParams, paramName: string): boolean {
    const value = this.getValue(params, paramName)
    return value !== undefined && value !== null && value !== ''
  }

  private getValue(params: DeFiKitParams, paramName: string): any {
    return (params as any)[paramName]
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'address':
        return typeof value === 'string' && this.isValidAddress(value)
      case 'string[]':
        return (
          Array.isArray(value) &&
          value.every((item) => typeof item === 'string')
        )
      default:
        return false
    }
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
}

/**
 * Convenience function for quick validation
 */
export function validateParameters(params: DeFiKitParams): ValidationResult {
  const validator = new ParameterValidator()
  return validator.validate(params)
}

/**
 * Throws an error if validation fails
 */
export function validateAndThrow(params: DeFiKitParams): void {
  const result = validateParameters(params)
  if (!result.valid) {
    const errorMessages = result.errors.map(
      (err) => `${err.parameter}: ${err.message}`,
    )
    throw new Error(`Parameter validation failed:\n${errorMessages.join('\n')}`)
  }
}
