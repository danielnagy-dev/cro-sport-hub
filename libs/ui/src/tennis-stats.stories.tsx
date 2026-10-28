import type { Meta, StoryObj } from '@storybook/react-vite'
import { playedCounts, zeroDenominatorCounts } from './result-samples.ts'
import { TennisStats } from './tennis-stats.tsx'

function Gallery() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <TennisStats player="Sample Player" stats={playedCounts} />
      <TennisStats player="Sample Player" stats={zeroDenominatorCounts} />
    </div>
  )
}

const meta = {
  title: 'Results/Tennis Stats',
  component: Gallery,
} satisfies Meta<typeof Gallery>

export default meta

type Story = StoryObj<typeof meta>

export const Percentages: Story = {}
