/**
 * Infer board metadata from an issue or PR title/body.
 * Prints one JSON object to stdout. Does not call the GitHub API.
 *
 * Usage:
 *   vpx tools/gh-metadata/infer-metadata.ts --kind issue --title '...' --body '...'
 *   vpx tools/gh-metadata/infer-metadata.ts --kind pr --title-file t.txt --body-file b.txt
 */

import { readFileSync } from 'node:fs'

const KNOWN_AREAS = ['cache', 'docs', 'gallery', 'import', 'matches', 'studio', 'web'] as const

type KnownArea = (typeof KNOWN_AREAS)[number]

/** Conventional Commits scopes and path cues that map onto area:docs. */
const AREA_ALIASES: Record<string, KnownArea> = {
  agents: 'docs',
  api: 'docs',
  ci: 'docs',
  env: 'docs',
  meta: 'docs',
  ops: 'docs',
  rewrite: 'docs',
  tooling: 'docs',
  ui: 'docs',
}

const CC_TYPE_NAMES = [
  'feat',
  'fix',
  'docs',
  'chore',
  'refactor',
  'test',
  'ci',
  'build',
  'perf',
  'style',
] as const

type CcType = (typeof CC_TYPE_NAMES)[number]

type Kind = 'issue' | 'pr'
type IssueTypeName = 'Task' | 'Bug' | 'Feature'
type TypeLabel = 'type:task' | 'type:feature' | 'type:bug'

interface InferResult {
  kind: Kind
  areas: KnownArea[]
  issueType: IssueTypeName | null
  readyForAgent: boolean
  /** PR-only Conventional Commits type labels. Always empty for issues. */
  typeLabels: TypeLabel[]
}

const args = parseArgs(process.argv.slice(2))
const kind: Kind = args.kind === 'pr' ? 'pr' : 'issue'
const title = readText(args.title, args['title-file'])
const body = readText(args.body, args['body-file'])

const result: InferResult = {
  kind,
  areas: inferAreas(title, body),
  issueType: kind === 'issue' ? inferIssueType(title, body) : null,
  readyForAgent: kind === 'issue' ? inferReadyForAgent(body) : false,
  typeLabels: kind === 'pr' ? inferPrTypeLabels(title) : [],
}

process.stdout.write(`${JSON.stringify(result)}\n`)

function parseArgs(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      out[key] = true
      continue
    }
    out[key] = next
    i += 1
  }
  return out
}

function readText(direct: string | true | undefined, filePath: string | true | undefined): string {
  if (typeof direct === 'string') return direct
  if (typeof filePath === 'string') {
    return readFileSync(filePath, 'utf8')
  }
  return ''
}

function inferAreas(titleText: string, bodyText: string): KnownArea[] {
  const found = new Set<KnownArea>()
  const haystack = `${titleText}\n${bodyText}`

  for (const match of titleText.matchAll(/\[([^\]]+)\]/g)) {
    const raw = match[1].trim().toLowerCase()
    for (const part of raw.split(/[,\s|/]+/).filter(Boolean)) {
      const area = resolveAreaToken(part)
      if (area) found.add(area)
    }
  }

  // Conventional Commits: type(scope): … / type: …
  const cc = parseConventionalCommit(titleText)
  if (cc) {
    for (const part of cc.scopes) {
      const area = resolveAreaToken(part)
      if (area) found.add(area)
    }
    // Prefer a non-empty area when the title is clearly docs/ci work.
    if (found.size === 0 && (cc.type === 'docs' || cc.type === 'ci')) {
      found.add('docs')
    }
  }

  for (const match of haystack.matchAll(/\barea:([a-z0-9-]+)\b/gi)) {
    const area = resolveAreaToken(match[1])
    if (area) found.add(area)
  }

  // Path cues: docs/agents/…, .github/workflows/…
  if (found.size === 0) {
    if (
      /\bdocs\//i.test(haystack) ||
      /\.cursor\//i.test(haystack) ||
      /\bagents\b/i.test(titleText)
    ) {
      found.add('docs')
    } else if (/\.github\//i.test(haystack) || /\bci\b/i.test(titleText)) {
      found.add('docs')
    }
  }

  return [...found].sort()
}

function parseConventionalCommit(titleText: string): { type: CcType; scopes: string[] } | null {
  const pattern = `^(${CC_TYPE_NAMES.join('|')})(?:\\(([^)]*)\\))?\\s*:`
  const match = titleText.trim().match(new RegExp(pattern, 'i'))
  if (!match) return null
  const type = match[1].toLowerCase() as CcType
  const scopeRaw = match[2] ?? ''
  const scopes = scopeRaw.split(/[,\s|/]+/).filter(Boolean)
  return { type, scopes }
}

function resolveAreaToken(token: string): KnownArea | null {
  const lower = token.toLowerCase()
  if ((KNOWN_AREAS as readonly string[]).includes(lower)) {
    return lower as KnownArea
  }
  const base = lower.split('.')[0] ?? lower
  if ((KNOWN_AREAS as readonly string[]).includes(base)) {
    return base as KnownArea
  }
  return AREA_ALIASES[base] ?? AREA_ALIASES[lower] ?? null
}

function inferPrTypeLabels(titleText: string): TypeLabel[] {
  const cc = parseConventionalCommit(titleText)
  if (!cc) return []
  switch (cc.type) {
    case 'feat':
      return ['type:feature']
    case 'fix':
      return ['type:bug']
    case 'docs':
    case 'ci':
    case 'chore':
    case 'refactor':
    case 'test':
    case 'build':
    case 'perf':
    case 'style':
      return ['type:task']
    default: {
      const _exhaustive: never = cc.type
      return _exhaustive
    }
  }
}

function inferIssueType(titleText: string, bodyText: string): IssueTypeName {
  const text = `${titleText}\n${bodyText}`.toLowerCase()
  if (
    /\b(bug|fix|regression)\b/.test(text) ||
    titleText.toLowerCase().includes('[bug]') ||
    /^fix(\(|:)/i.test(titleText.trim())
  ) {
    return 'Bug'
  }
  if (
    /\b(feature|enhancement)\b/.test(text) ||
    titleText.toLowerCase().includes('[feature]') ||
    /^(feat)(\(|:)/i.test(titleText.trim())
  ) {
    return 'Feature'
  }
  return 'Task'
}

/**
 * Conservative ready-for-agent: require a Size section with a numeric estimate
 * at or under 400 (corrected), plus Goal and Acceptance headings.
 * Skip when unsure.
 */
function inferReadyForAgent(bodyText: string): boolean {
  if (!/^##\s+Size\b/im.test(bodyText)) return false
  if (!/^##\s+Goal\b/im.test(bodyText)) return false
  if (!/^##\s+Acceptance criteria\b/im.test(bodyText)) return false

  const sizeSection = extractSection(bodyText, 'Size')
  if (!sizeSection) return false

  const corrected = sizeSection.match(/corrected[^0-9]{0,40}(~?\s*)(\d{2,4})\b/i)
  const anyNumber = sizeSection.match(/\b(\d{2,4})\b/)
  const estimate = corrected ? Number(corrected[2]) : anyNumber ? Number(anyNumber[1]) : null

  if (estimate === null) return false
  if (estimate > 400) return false
  return true
}

function extractSection(markdown: string, heading: string): string | null {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((line) =>
    new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'i').test(line),
  )
  if (start < 0) return null
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line))
  const slice = end < 0 ? lines.slice(start + 1) : lines.slice(start + 1, end)
  return slice.join('\n').trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
