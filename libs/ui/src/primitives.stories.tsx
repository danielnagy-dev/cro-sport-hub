import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './button.tsx'
import { DataTable } from './data-table.tsx'
import { Drawer } from './drawer.tsx'
import { FilterBar } from './filter-bar.tsx'
import { StatusPill } from './status-pill.tsx'
import { TextField } from './text-field.tsx'

function PrimitivesGallery() {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ display: 'grid', gap: '1.5rem', width: 'min(40rem, 100%)' }}>
      <h2>Kit primitives</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Button tone="tennis">Save</Button>
        <Button tone="football" variant="soft">
          Soft
        </Button>
        <Button variant="outline" size="sm">
          Outline
        </Button>
        <StatusPill status="draft">draft</StatusPill>
        <StatusPill status="review">review</StatusPill>
        <StatusPill status="published">published</StatusPill>
      </div>
      <TextField label="Athlete" defaultValue="Sample Athlete" />
      <FilterBar dayLabel="21 Nov 2026" sport="tennis" athlete="Sample Athlete" status="review" />
      <DataTable
        caption="Sample rows"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'sport', header: 'Sport' },
        ]}
        rows={[{ name: 'Sample Athlete', sport: 'Tennis' }]}
      />
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer title="Post drawer" open={open} onClose={() => setOpen(false)}>
        <p>Seed drawer body</p>
      </Drawer>
    </div>
  )
}

const meta = {
  title: 'Primitives',
  component: PrimitivesGallery,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PrimitivesGallery>

export default meta
type Story = StoryObj<typeof meta>
export const Gallery: Story = {}
