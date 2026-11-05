import { type Page } from '@playwright/test'

export const EDITOR_USER_ID = 'editor-demo'
export const ADMIN_USER_ID = 'admin-demo'

/** Published list label for the tennis draft this flow creates. */
export const EDITOR_FLOW_MATCH_LABEL = 'Sample Player C vs Sample Player D'

export type EditorStep = {
  name: string
  url: string
  ok: boolean
  detail?: string
  screenshot: string | null
}

type FlowBases = {
  studio: string
  web: string
}

type FlowPasswords = {
  editor: string
  admin: string
}

async function captureStep(
  page: Page,
  screenshotDir: string,
  stepIndex: { value: number },
  name: string,
  url: string,
  detail?: string,
): Promise<EditorStep> {
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
    // Keep the navigation failure as the primary detail.
  }
  return { name, url, ok: detail === undefined, detail, screenshot }
}

async function studioLogin(
  page: Page,
  studioBase: string,
  userId: string,
  password: string,
): Promise<void> {
  const loginUrl = `${studioBase.replace(/\/$/, '')}/login`
  await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.getByRole('heading', { name: 'Log in' }).waitFor({ state: 'visible', timeout: 15_000 })
  await page.getByLabel('User id').fill(userId)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('navigation', { name: 'Studio sections' }).waitFor({
    state: 'visible',
    timeout: 30_000,
  })
}

async function studioLogOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.getByRole('heading', { name: 'Log in' }).waitFor({ state: 'visible', timeout: 15_000 })
}

async function fillTennisDraft(page: Page): Promise<void> {
  await page.getByLabel('Competition').selectOption({ label: 'Sample Cup (2026)' })
  await page.getByLabel('Date').fill('2026-11-01')
  await page.getByLabel('Round').fill('Editor verify')
  await page.getByLabel('Player A').selectOption({ label: 'Sample Player C' })
  await page.getByLabel('Player B').selectOption({ label: 'Sample Player D' })
  await page.locator('#set-a-0').fill('6')
  await page.locator('#set-b-0').fill('4')
  await page.locator('#set-a-1').fill('6')
  await page.locator('#set-b-1').fill('2')
  await page.getByLabel('Winner').selectOption({ label: 'Player A' })
}

function readSavedMatchId(text: string): string | undefined {
  const match = /Draft saved as ([\w-]+)/.exec(text)
  return match?.[1]
}

export async function runEditorFlow(
  page: Page,
  bases: FlowBases,
  passwords: FlowPasswords,
  screenshotDir: string,
  stepIndex: { value: number },
): Promise<EditorStep[]> {
  const steps: EditorStep[] = []
  const studio = bases.studio.replace(/\/$/, '')
  const web = bases.web.replace(/\/$/, '')

  try {
    await studioLogin(page, studio, EDITOR_USER_ID, passwords.editor)
    steps.push(
      await captureStep(page, screenshotDir, stepIndex, 'editor-login', `${studio}/`, undefined),
    )

    const newMatchUrl = `${studio}/matches/new/tennis`
    await page.goto(newMatchUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.getByRole('heading', { name: 'New tennis match' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    })
    await fillTennisDraft(page)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await page.getByRole('status').filter({ hasText: 'Draft saved as' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    })
    const savedText = (await page.getByRole('main').textContent()) ?? ''
    const matchId = readSavedMatchId(savedText)
    if (matchId === undefined) {
      steps.push(
        await captureStep(
          page,
          screenshotDir,
          stepIndex,
          'save-draft',
          page.url(),
          'Could not read the draft id after save.',
        ),
      )
      return steps
    }
    steps.push(
      await captureStep(page, screenshotDir, stepIndex, 'save-draft', page.url(), undefined),
    )

    await page.getByRole('button', { name: 'Submit for review' }).click()
    await page.getByText('Status: review').waitFor({ state: 'visible', timeout: 30_000 })
    steps.push(await captureStep(page, screenshotDir, stepIndex, 'submit', page.url(), undefined))

    await studioLogOut(page)
    steps.push(
      await captureStep(page, screenshotDir, stepIndex, 'editor-logout', page.url(), undefined),
    )

    await studioLogin(page, studio, ADMIN_USER_ID, passwords.admin)
    steps.push(
      await captureStep(page, screenshotDir, stepIndex, 'admin-login', page.url(), undefined),
    )

    const reviewUrl = `${studio}/matches/${matchId}/review`
    await page.goto(reviewUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.getByRole('heading', { name: 'Review match' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    })
    const labelCell = page.locator('dt', { hasText: 'Label' }).locator('..').locator('dd')
    await labelCell.filter({ hasText: EDITOR_FLOW_MATCH_LABEL }).waitFor({
      state: 'visible',
      timeout: 15_000,
    })
    steps.push(await captureStep(page, screenshotDir, stepIndex, 'review', page.url(), undefined))

    await page.getByRole('button', { name: 'Publish' }).click()
    await page.locator('dt', { hasText: 'Status' }).locator('..').getByText('published').waitFor({
      state: 'visible',
      timeout: 30_000,
    })
    steps.push(await captureStep(page, screenshotDir, stepIndex, 'publish', page.url(), undefined))

    await page.goto(web, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.getByRole('main').waitFor({ state: 'visible', timeout: 15_000 })
    const main = page.getByRole('main')
    await main.getByText('Sample Player C', { exact: true }).waitFor({
      state: 'visible',
      timeout: 15_000,
    })
    await main.getByText('Sample Player D', { exact: true }).waitFor({
      state: 'visible',
      timeout: 15_000,
    })
    steps.push(
      await captureStep(page, screenshotDir, stepIndex, 'public-home', page.url(), undefined),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'editor flow failed'
    steps.push(
      await captureStep(page, screenshotDir, stepIndex, 'editor-flow', page.url(), message),
    )
  }

  return steps
}
