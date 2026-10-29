import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** SQL statements from every `*.sql` file in `migrationDir`, in sorted name order. */
export function sqlMigrationStatements(migrationDir: string): string[] {
  const names = readdirSync(migrationDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right, 'en'))

  return names.flatMap((name) =>
    readFileSync(join(migrationDir, name), 'utf8')
      .replaceAll(/--.*$/gm, '')
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0),
  )
}
