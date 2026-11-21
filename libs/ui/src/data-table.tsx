import type { ReactNode } from 'react'

export type DataTableColumn = { key: string; header: string }

export type DataTableProps = {
  caption: string
  columns: readonly DataTableColumn[]
  rows: readonly Record<string, ReactNode>[]
}

export function DataTable({ caption, columns, rows }: DataTableProps) {
  return (
    <div className="csh-data-table">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No rows</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column, columnIndex) =>
                  columnIndex === 0 ? (
                    <th key={column.key} scope="row">
                      {row[column.key]}
                    </th>
                  ) : (
                    <td key={column.key}>{row[column.key]}</td>
                  ),
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
