import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Split SQL on `;` outside dollar-quoted strings (`$tag$…$tag$`). */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let start = 0
  let i = 0
  while (i < sql.length) {
    if (sql[i] === '$') {
      const tagEnd = sql.indexOf('$', i + 1)
      if (tagEnd === -1) break
      const tag = sql.slice(i, tagEnd + 1)
      const close = sql.indexOf(tag, tagEnd + 1)
      if (close === -1) break
      i = close + tag.length
      continue
    }
    if (sql[i] === ';') {
      const piece = sql.slice(start, i).trim()
      if (piece.length > 0) statements.push(piece)
      start = i + 1
    }
    i += 1
  }
  const tail = sql.slice(start).trim()
  if (tail.length > 0) statements.push(tail)
  return statements
}

/** SQL statements from every `*.sql` file in `migrationDir`, in sorted name order. */
export function sqlMigrationStatements(migrationDir: string): string[] {
  const names = readdirSync(migrationDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right, 'en'))

  return names.flatMap((name) =>
    splitSqlStatements(readFileSync(join(migrationDir, name), 'utf8').replaceAll(/--.*$/gm, '')),
  )
}
