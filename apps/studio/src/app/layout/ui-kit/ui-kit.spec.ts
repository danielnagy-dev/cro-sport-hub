import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expect } from 'vite-plus/test'
import { CshUiButton } from './button'
import { CshUiDataTable } from './data-table'
import { CshUiDrawer } from './drawer'
import { CshUiFilterBar } from './filter-bar'
import { CshUiStatusPill } from './status-pill'
import { CshUiTextField } from './text-field'

@Component({
  imports: [CshUiButton, CshUiStatusPill, CshUiTextField],
  template: `
    <button cshUiButton type="button" tone="basketball" size="sm" variant="outline">Go</button>
    <csh-ui-status-pill status="published">published</csh-ui-status-pill>
    <csh-ui-text-field label="Name" fieldId="athlete-name" [(value)]="name" />
  `,
})
class ControlsHost {
  name = 'Sample'
}

@Component({
  imports: [CshUiDrawer],
  template: `
    <csh-ui-drawer title="Post" [open]="open()" (closed)="closedCount = closedCount + 1">
      Body
    </csh-ui-drawer>
  `,
})
class DrawerHost {
  readonly open = signal(false)
  closedCount = 0
}

@Component({
  imports: [CshUiDataTable, CshUiFilterBar],
  template: `
    <csh-ui-data-table [caption]="'Athletes'" [columns]="columns" [rows]="rows" />
    <csh-ui-filter-bar
      dayLabel="21 Nov 2026"
      sport="tennis"
      athlete="Sample Athlete"
      status="review"
      (previousDay)="previousCount = previousCount + 1"
      (nextDay)="nextCount = nextCount + 1"
    />
  `,
})
class ShellsHost {
  columns = [
    { key: 'name', header: 'Name' },
    { key: 'sport', header: 'Sport' },
  ]
  rows = [{ name: 'Sample Athlete', sport: 'Tennis' }]
  previousCount = 0
  nextCount = 0
}

describe('Studio UI kit hosts', () => {
  it('binds documented data-* and csh-* classes on controls', async () => {
    await TestBed.configureTestingModule({ imports: [ControlsHost] }).compileComponents()
    const fixture = TestBed.createComponent(ControlsHost)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement

    const button = root.querySelector('button[cshUiButton]')
    expect(button?.classList.contains('csh-button')).toBe(true)
    expect(button?.classList.contains('csh-kit')).toBe(true)
    expect(button?.getAttribute('data-tone')).toBe('basketball')
    expect(button?.getAttribute('data-size')).toBe('sm')
    expect(button?.getAttribute('data-variant')).toBe('outline')
    expect(button?.textContent).toContain('Go')

    const pill = root.querySelector('csh-ui-status-pill')
    expect(pill?.classList.contains('csh-status-pill')).toBe(true)
    expect(pill?.getAttribute('data-status')).toBe('published')
    expect(pill?.getAttribute('data-size')).toBe('sm')

    const label = root.querySelector('label.csh-text-field')
    expect(label?.getAttribute('data-size')).toBe('md')
    expect(label?.getAttribute('for')).toBe('athlete-name')
    expect(root.querySelector('#athlete-name')?.getAttribute('class')).toContain(
      'csh-text-field__input',
    )
    const nameInput = root.querySelector('#athlete-name')
    expect(nameInput instanceof HTMLInputElement ? nameInput.value : '').toBe('Sample')
  })

  it('hides drawer when closed and emits closed when open', async () => {
    await TestBed.configureTestingModule({ imports: [DrawerHost] }).compileComponents()
    const fixture = TestBed.createComponent(DrawerHost)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement

    expect(root.querySelector('.csh-drawer')).toBeNull()

    fixture.componentInstance.open.set(true)
    fixture.detectChanges()
    await fixture.whenStable()

    const drawer = root.querySelector('.csh-drawer')
    expect(drawer?.getAttribute('role')).toBe('dialog')
    expect(drawer?.getAttribute('aria-label')).toBe('Post')
    expect(root.textContent).toContain('Body')

    const close = root.querySelector(
      'button[aria-label="Close drawer"]',
    ) as HTMLButtonElement | null
    close?.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.closedCount).toBe(1)
  })

  it('renders table rows and FilterBar day outputs', async () => {
    await TestBed.configureTestingModule({ imports: [ShellsHost] }).compileComponents()
    const fixture = TestBed.createComponent(ShellsHost)
    await fixture.whenStable()
    const root = fixture.nativeElement as HTMLElement

    expect(root.querySelector('.csh-data-table caption')?.textContent).toContain('Athletes')
    expect(root.textContent).toContain('Sample Athlete')
    expect(root.textContent).toContain('Tennis')

    const filters = root.querySelector('.csh-filter-bar')
    expect(filters?.querySelector('.csh-filter-bar__day-label')?.textContent).toContain(
      '21 Nov 2026',
    )
    expect(filters?.querySelector('csh-ui-status-pill')?.getAttribute('data-status')).toBe('review')

    const previous = filters?.querySelector(
      'button[aria-label="Previous day"]',
    ) as HTMLButtonElement | null
    const next = filters?.querySelector('button[aria-label="Next day"]') as HTMLButtonElement | null
    previous?.click()
    next?.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.previousCount).toBe(1)
    expect(fixture.componentInstance.nextCount).toBe(1)
  })
})
