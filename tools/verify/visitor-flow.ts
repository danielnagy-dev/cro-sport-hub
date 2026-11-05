import AxeBuilder from '@axe-core/playwright'
import { type Page } from '@playwright/test'
import { blockingViolations, formatBlockingSummary, type AxeViolation } from './axe-impact.ts'

export type VisitorStep = {
  name: string
  url: string
  ok: boolean
  detail?: string
  screenshot: string | null
}

async function axeCheck(page: Page, step: string): Promise<string | undefined> {
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = blockingViolations(results.violations as readonly AxeViolation[])
  if (blocking.length === 0) return undefined
  return `${step}: ${formatBlockingSummary(blocking)}`
}

export async function runVisitorFlow(
  page: Page,
  base: string,
  screenshotDir: string,
  stepIndex: { value: number },
): Promise<VisitorStep[]> {
  const steps: VisitorStep[] = []
  const capture = async (name: string, url: string, detail?: string): Promise<void> => {
    const index = stepIndex.value
    stepIndex.value += 1
    const file = `${String(index + 1).padStart(2, '0')}-${name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)}.png`
    let screenshot: string | null = null
    try {
      await page.screenshot({ path: `${screenshotDir}/${file}`, fullPage: true })
      screenshot = file
    } catch {
      // Keep the axe or navigation failure as the primary detail.
    }
    steps.push({ name, url, ok: detail === undefined, detail, screenshot })
  }

  await page.goto(base, { waitUntil: 'networkidle', timeout: 30_000 })
  await page.getByRole('main').waitFor({ state: 'visible', timeout: 15_000 })
  await capture('home', page.url(), await axeCheck(page, 'home'))

  await page.getByRole('link', { name: 'tennis' }).click()
  await page.getByRole('main').waitFor({ state: 'visible', timeout: 15_000 })
  await capture('tennis', page.url(), await axeCheck(page, 'tennis'))

  const athleteLink = page.getByRole('link', { name: 'Sample Player A' })
  await athleteLink.waitFor({ state: 'visible', timeout: 15_000 })
  await athleteLink.click()
  await page.getByRole('heading', { name: 'Sample Player A' }).waitFor({
    state: 'visible',
    timeout: 15_000,
  })
  await capture('athlete', page.url(), await axeCheck(page, 'athlete'))

  return steps
}
