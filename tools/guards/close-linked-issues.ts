/**
 * Parse PR bodies for GitHub closing keywords and issue refs; close those issues on merge.
 * See `.github/workflows/close-linked-issues.yml`.
 */

const GITHUB_API_BASE = 'https://api.github.com'

/** GitHub-recognized closing keywords for issues (PR description). */
export const CLOSING_KEYWORD_BODY_REGEX =
  /\b(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#(\d+)\b/gi

export function parseClosingIssueNumbers(body: string): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const m of body.matchAll(CLOSING_KEYWORD_BODY_REGEX)) {
    const digits = m[1]
    if (digits == null) {
      continue
    }
    const n = Number.parseInt(digits, 10)
    if (!Number.isFinite(n) || n <= 0) {
      continue
    }
    if (seen.has(n)) {
      continue
    }
    seen.add(n)
    out.push(n)
  }
  return out
}

type GhIssue = {
  state: string
  pull_request?: unknown
}

function authHeaderRecord(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'cro-sport-hub-close-linked-issues',
  }
}

async function ghJson<T>(
  token: string,
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: T | null }> {
  const { headers: extraHeaders, ...restInit } = init ?? {}
  const headers = new Headers(authHeaderRecord(token))
  if (extraHeaders != null) {
    new Headers(extraHeaders).forEach((value, key) => {
      headers.set(key, value)
    })
  }
  const res = await fetch(url, {
    ...restInit,
    headers,
  })
  const text = await res.text()
  let parsed: T | null = null
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text) as T
    } catch {
      parsed = null
    }
  }
  return { ok: res.ok, status: res.status, body: parsed }
}

export async function closeLinkedIssuesFromPrBody(options: {
  token: string
  owner: string
  repo: string
  prNumber: number
  body: string
}): Promise<void> {
  const { token, owner, repo, prNumber, body } = options
  const issueNumbers = parseClosingIssueNumbers(body)
  if (issueNumbers.length === 0) {
    return
  }

  const base = `${GITHUB_API_BASE}/repos/${owner}/${repo}`
  const commentBody = `Closed by #${prNumber} (merged).`

  for (const issueNumber of issueNumbers) {
    const getUrl = `${base}/issues/${issueNumber}`
    const got = await ghJson<GhIssue>(token, getUrl)
    if (!got.ok || got.body == null) {
      console.warn(
        `close-linked-issues: skip #${issueNumber}: GET ${got.status} (missing or error)`,
      )
      continue
    }
    if (got.body.pull_request !== undefined) {
      continue
    }
    if (got.body.state !== 'open') {
      continue
    }

    const patch = await ghJson<unknown>(token, getUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: 'closed',
        state_reason: 'completed',
      }),
    })
    if (!patch.ok) {
      console.error(`close-linked-issues: failed to close #${issueNumber}: PATCH ${patch.status}`)
      continue
    }

    const commentUrl = `${base}/issues/${issueNumber}/comments`
    const posted = await ghJson<unknown>(token, commentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody }),
    })
    if (!posted.ok) {
      console.error(
        `close-linked-issues: closed #${issueNumber} but comment failed: ${posted.status}`,
      )
    }
  }
}

export function readEnvForAction():
  | {
      token: string
      owner: string
      repo: string
      prNumber: number
      body: string
    }
  | { error: string } {
  const token = process.env['GITHUB_TOKEN']
  if (!token) {
    return { error: 'GITHUB_TOKEN is required' }
  }
  const repoFull = process.env['GITHUB_REPOSITORY']
  if (!repoFull || !repoFull.includes('/')) {
    return { error: 'GITHUB_REPOSITORY must be owner/name' }
  }
  const slash = repoFull.indexOf('/')
  const owner = repoFull.slice(0, slash)
  const repo = repoFull.slice(slash + 1)
  const prRaw = process.env['PR_NUMBER']
  const prNumber = prRaw ? Number.parseInt(prRaw, 10) : Number.NaN
  if (!Number.isFinite(prNumber) || prNumber <= 0) {
    return { error: 'PR_NUMBER must be a positive integer' }
  }
  const body = process.env['PR_BODY'] ?? ''
  return { token, owner, repo, prNumber, body }
}

async function main(): Promise<void> {
  const env = readEnvForAction()
  if ('error' in env) {
    console.error(`close-linked-issues: ${env.error}`)
    process.exitCode = 1
    return
  }
  await closeLinkedIssuesFromPrBody(env)
}

const invokedPath = process.argv[1] ?? ''
const isMain =
  invokedPath.endsWith('close-linked-issues.ts') || invokedPath.endsWith('close-linked-issues.js')
if (isMain) {
  await main()
}
