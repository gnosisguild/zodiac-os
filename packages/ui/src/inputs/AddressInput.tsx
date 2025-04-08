import { ZERO_ADDRESS } from '@zodiac/chains'
import { addressSchema, type HexAddress } from '@zodiac/schema'
import classNames from 'classnames'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Blockie } from '../addresses'
import { Input, type ComposableInputProps } from './Input'
import { InputLayout } from './InputLayout'

type AddressInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'id' | 'type' | 'className' | 'value' | 'defaultValue' | 'onChange'
> &
  Omit<ComposableInputProps, 'before' | 'after'> & {
    value?: HexAddress | null
    onChange?: (value: HexAddress | null) => void
    defaultValue?: HexAddress
    action?: ReactNode
  }

export const AddressInput = ({
  label,
  description,
  error,
  action,
  disabled,
  value,
  defaultValue,
  placeholder = ZERO_ADDRESS,
  hideLabel,
  onChange,
  ...props
}: AddressInputProps) => (
  <Input
    label={label}
    description={description}
    error={error}
    hideLabel={hideLabel}
  >
    {({ inputId, descriptionId }) => (
      <InputLayout
        disabled={disabled}
        before={
          <Blockie
            address={value || defaultValue || ZERO_ADDRESS}
            className="ml-4 size-5 shrink-0"
          />
        }
        after={action && <div className="mr-2">{action}</div>}
      >
        <input
          {...props}
          type="text"
          pattern="0x\w+"
          id={inputId}
          disabled={disabled}
          value={value == null ? undefined : value}
          defaultValue={defaultValue}
          aria-describedby={descriptionId}
          aria-errormessage={error ?? undefined}
          placeholder={placeholder}
          onInvalid={(e) => {
            if (e.currentTarget.validity.patternMismatch) {
              e.currentTarget.setCustomValidity(
                'Please use a 40 character hex address',
              )
            }
          }}
          onInput={(e) => e.currentTarget.setCustomValidity('')}
          onChange={(event) => {
            const value = event.target.value

            if (onChange != null) {
              try {
                onChange(addressSchema.parse(value))
              } catch {
                onChange(null)
              }
            }
          }}
          className={classNames(
            'outline-hidden w-full border-none bg-transparent px-4 py-2 font-mono text-sm',
            disabled && 'cursor-not-allowed',
          )}
        />
      </InputLayout>
    )}
  </Input>
)
