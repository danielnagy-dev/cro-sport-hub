import { slideHeight, slideWidth } from './football.ts'

/** Text-forward MVP document until a design pass lands brand art. */
export type MvpSlideDocument = {
  width: typeof slideWidth
  height: typeof slideHeight
  sportSlug: 'tennis' | 'basketball'
  html: string
}

export type MvpSlideRow = {
  athleteName: string
  clubName: string
  competition: string
  round: string
  date: string
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  minutes: number
  goals: number
  assists: number
}

type MvpTheme = {
  sportSlug: 'tennis' | 'basketball'
  label: string
  accent: string
}

/** Navy slide tokens with a sport accent; intentional placeholder until design. */
const PAGE_CSS = `*{box-sizing:border-box;margin:0;padding:0}body{margin:0;background:#0A0F25;color:#F3EEE3;font-family:system-ui,sans-serif}article{position:relative;display:flex;flex-direction:column;padding:72px 72px 184px;background:linear-gradient(180deg,#0E1431 0%,#0A0F25 100%)}.eyebrow{display:flex;align-items:center;gap:16px;font:700 20px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:rgba(243,238,227,.7)}.eyebrow i{display:inline-block;width:12px;height:12px;background:var(--accent)}.name{margin-top:48px;font:800 96px/.9 system-ui,sans-serif}.club{margin-top:16px;font:500 28px/1.2 system-ui,sans-serif;color:rgba(243,238,227,.7)}.match{margin-top:40px;font:700 36px/1.2 system-ui,sans-serif}.match span{color:rgba(243,238,227,.5);font-weight:500;margin:0 12px}.stats{margin-top:56px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;border-top:1px solid rgba(243,238,227,.16);padding-top:32px}.stat span{display:block;font:700 14px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:rgba(243,238,227,.7)}.stat b{display:block;margin-top:8px;font:800 48px/.9 system-ui,sans-serif}.note{margin-top:auto;padding-top:40px;font:500 18px/1.4 system-ui,sans-serif;color:rgba(243,238,227,.5)}.brand{position:absolute;left:72px;right:72px;bottom:56px;display:flex;align-items:center;gap:16px;font:800 32px/1 system-ui,sans-serif}.brand i{width:40px;height:40px;background:conic-gradient(#fff 0 25%,var(--accent) 0 50%,#fff 0 75%,var(--accent) 0)}`

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (char) =>
    char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;',
  )
}

function page(theme: MvpTheme, row: MvpSlideRow): string {
  const score = `${row.homeGoals}–${row.awayGoals}`
  return `<!doctype html><html lang="hr"><head><meta charset="utf-8"><style>${PAGE_CSS}</style></head><body><article style="--accent:${theme.accent};width:${slideWidth}px;height:${slideHeight}px" data-sport="${theme.sportSlug}" data-mvp="placeholder"><header class="eyebrow"><i></i><span>${esc(theme.label)}</span><span>·</span><span>${esc(row.competition)}</span><span>·</span><span>${esc(row.round)}</span><span>·</span><span>${esc(row.date)}</span></header><h1 class="name">${esc(row.athleteName)}</h1><p class="club">${esc(row.clubName)}</p><p class="match">${esc(row.homeTeam)}<span>vs</span>${esc(row.awayTeam)} · ${score}</p><div class="stats"><div class="stat"><span>Goals</span><b>${row.goals}</b></div><div class="stat"><span>Assists</span><b>${row.assists}</b></div><div class="stat"><span>Minutes</span><b>${row.minutes}</b></div></div><p class="note">MVP placeholder — text-forward until a design pass.</p><footer class="brand"><i></i><b>HRVATSKI SPORT</b></footer></article></body></html>`
}

/** One text-forward slide per appearance row. */
export function mvpSlides(theme: MvpTheme, rows: readonly MvpSlideRow[]): MvpSlideDocument[] {
  return rows.map((row) => ({
    width: slideWidth,
    height: slideHeight,
    sportSlug: theme.sportSlug,
    html: page(theme, row),
  }))
}
