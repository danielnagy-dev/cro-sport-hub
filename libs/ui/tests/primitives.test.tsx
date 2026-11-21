import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import { Button } from '../src/button.tsx'
import { DataTable } from '../src/data-table.tsx'
import { Drawer } from '../src/drawer.tsx'
import { FilterBar } from '../src/filter-bar.tsx'
import { StatusPill } from '../src/status-pill.tsx'
import { TextField } from '../src/text-field.tsx'

test('button binds documented data-* variants', () => {
  const html = renderToStaticMarkup(
    createElement(Button, {
      tone: 'basketball',
      size: 'sm',
      variant: 'outline',
      children: 'Go',
    }),
  )
  expect(html).toContain('csh-button')
  expect(html).toContain('csh-kit')
  expect(html).toContain('data-tone="basketball"')
  expect(html).toContain('data-variant="outline"')
})

test('status pill and text field render kit attributes', () => {
  const pill = renderToStaticMarkup(
    createElement(StatusPill, { status: 'published', children: 'published' }),
  )
  const field = renderToStaticMarkup(
    createElement(TextField, { label: 'Name', defaultValue: 'Sample', id: 'athlete-name' }),
  )
  expect(pill).toContain('data-status="published"')
  expect(field).toContain('for="athlete-name"')
  expect(field).toContain('Sample')
})

test('drawer shell is absent when closed and labeled when open', () => {
  expect(
    renderToStaticMarkup(createElement(Drawer, { title: 'Post', open: false, children: 'Body' })),
  ).toBe('')
  const open = renderToStaticMarkup(
    createElement(Drawer, { title: 'Post', open: true, children: 'Body' }),
  )
  expect(open).toContain('role="dialog"')
  expect(open).toContain('aria-label="Post"')
})

test('data table and filter bar shells expose seed chrome', () => {
  const table = renderToStaticMarkup(
    createElement(DataTable, {
      caption: 'Athletes',
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'sport', header: 'Sport' },
      ],
      rows: [{ name: 'Sample Athlete', sport: 'Tennis' }],
    }),
  )
  const filters = renderToStaticMarkup(
    createElement(FilterBar, {
      dayLabel: '21 Nov 2026',
      sport: 'tennis',
      athlete: 'Sample Athlete',
      status: 'review',
    }),
  )
  expect(table).toContain('Sample Athlete')
  expect(filters).toContain('Previous day')
  expect(filters).toContain('21 Nov 2026')
  expect(filters).toContain('data-status="review"')
})
