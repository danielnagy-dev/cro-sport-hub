import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  KIT_DATA_ATTRIBUTES,
  KIT_SIZES,
  KIT_STATUSES,
  KIT_TONES,
  KIT_VARIANTS,
} from './variant-contract.ts'

const COLOR_TOKENS = [
  ['--csh-color-canvas', '#f4f6f3'],
  ['--csh-color-surface', '#ffffff'],
  ['--csh-color-text', '#1b2430'],
  ['--csh-color-muted', '#3e4c5f'],
  ['--csh-color-focus', '#0b57d0'],
  ['--csh-color-tennis', '#0c5c38'],
  ['--csh-color-football', '#163e73'],
  ['--csh-color-basketball', '#8c3412'],
] as const

function TokensGallery() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem', fontFamily: 'var(--csh-font-sans)' }}>
      <section aria-labelledby="token-swatches">
        <h2 id="token-swatches">Kit tokens</h2>
        <p>Colour, space, radius, type, and focus tokens for Studio and web.</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
            gap: '0.75rem',
          }}
        >
          {COLOR_TOKENS.map(([name, hex]) => (
            <div key={name} className="csh-token-swatch">
              <div className="csh-token-swatch__chip" style={{ background: `var(${name})` }} />
              <code>{name}</code>
              <span>{hex}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="variant-contract">
        <h2 id="variant-contract">Variant contract</h2>
        <p>
          Allowed attributes: {KIT_DATA_ATTRIBUTES.tone}, {KIT_DATA_ATTRIBUTES.size},{' '}
          {KIT_DATA_ATTRIBUTES.variant}, {KIT_DATA_ATTRIBUTES.status}.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {KIT_TONES.map((tone) => (
            <span key={tone} className="csh-kit" data-tone={tone}>
              {tone}
            </span>
          ))}
          {KIT_SIZES.map((size) => (
            <span key={size} className="csh-kit" data-tone="football" data-size={size}>
              size {size}
            </span>
          ))}
          {KIT_VARIANTS.map((variant) => (
            <span key={variant} className="csh-kit" data-tone="basketball" data-variant={variant}>
              {variant}
            </span>
          ))}
          {KIT_STATUSES.map((status) => (
            <span key={status} className="csh-kit" data-status={status} data-size="sm">
              {status}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'Tokens',
  component: TokensGallery,
} satisfies Meta<typeof TokensGallery>

export default meta

type Story = StoryObj<typeof meta>

export const Swatches: Story = {}
