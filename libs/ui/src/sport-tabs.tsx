import type { SportSlug } from '@cro-sport-hub/shared-types'
import type { KeyboardEvent, ReactNode } from 'react'
import { useId } from 'react'
import { nextSport, sportLabel, sportOrder } from './sports.ts'

export type SportTabsProps = {
  value: SportSlug
  onChange: (sport: SportSlug) => void
  panels: Record<SportSlug, ReactNode>
}

export function SportTabs({ value, onChange, panels }: SportTabsProps) {
  const baseId = useId()

  function tabId(sport: SportSlug) {
    return `${baseId}-${sport}-tab`
  }

  function panelId(sport: SportSlug) {
    return `${baseId}-${sport}-panel`
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextSport(value, event.key)
    if (next === undefined) return
    event.preventDefault()
    if (next !== value) onChange(next)
    document.getElementById(tabId(next))?.focus()
  }

  return (
    <div className="csh-sport-tabs">
      <div
        className="csh-sport-tabs__list"
        role="tablist"
        aria-label="Sports"
        onKeyDown={onKeyDown}
      >
        {sportOrder.map((sport) => {
          const selected = sport === value
          return (
            <button
              key={sport}
              className="csh-sport-tabs__tab"
              type="button"
              role="tab"
              id={tabId(sport)}
              aria-selected={selected}
              aria-controls={panelId(sport)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(sport)}
            >
              {sportLabel[sport]}
            </button>
          )
        })}
      </div>
      {sportOrder.map((sport) => (
        <div
          key={sport}
          className="csh-sport-tabs__panel"
          role="tabpanel"
          id={panelId(sport)}
          aria-labelledby={tabId(sport)}
          hidden={sport !== value}
          tabIndex={0}
        >
          {panels[sport]}
        </div>
      ))}
    </div>
  )
}
