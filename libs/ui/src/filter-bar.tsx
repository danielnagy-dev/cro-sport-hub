import { Button } from './button.tsx'
import { StatusPill } from './status-pill.tsx'
import type { KitStatus, KitTone } from './variant-contract.ts'

export type FilterBarProps = {
  dayLabel: string
  sport?: KitTone
  athlete?: string
  status?: KitStatus
  onPreviousDay?: () => void
  onNextDay?: () => void
}

export function FilterBar({
  dayLabel,
  sport = 'neutral',
  athlete = 'All athletes',
  status = 'draft',
  onPreviousDay,
  onNextDay,
}: FilterBarProps) {
  return (
    <div className="csh-filter-bar" role="group" aria-label="Filters">
      <div className="csh-filter-bar__day">
        <Button variant="outline" size="sm" aria-label="Previous day" onClick={onPreviousDay}>
          ‹
        </Button>
        <span className="csh-filter-bar__day-label">{dayLabel}</span>
        <Button variant="outline" size="sm" aria-label="Next day" onClick={onNextDay}>
          ›
        </Button>
      </div>
      <span className="csh-kit" data-tone={sport} data-size="sm">
        {sport}
      </span>
      <span className="csh-filter-bar__athlete">{athlete}</span>
      <StatusPill status={status}>{status}</StatusPill>
    </div>
  )
}
