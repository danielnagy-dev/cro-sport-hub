import type { InputHTMLAttributes } from 'react'
import type { KitSize } from './variant-contract.ts'

export type TextFieldProps = {
  label: string
  size?: KitSize
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>

export function TextField({ label, size = 'md', id = 'csh-text-field', ...rest }: TextFieldProps) {
  return (
    <label className="csh-text-field" data-size={size} htmlFor={id}>
      <span className="csh-text-field__label">{label}</span>
      <input id={id} className="csh-text-field__input" {...rest} />
    </label>
  )
}
