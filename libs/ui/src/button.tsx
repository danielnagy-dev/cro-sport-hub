import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { KitSize, KitTone, KitVariant } from './variant-contract.ts'

export type ButtonProps = {
  tone?: KitTone
  size?: KitSize
  variant?: KitVariant
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function Button({
  tone = 'neutral',
  size = 'md',
  variant = 'solid',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className="csh-button csh-kit"
      data-tone={tone}
      data-size={size}
      data-variant={variant}
      {...rest}
    >
      {children}
    </button>
  )
}
