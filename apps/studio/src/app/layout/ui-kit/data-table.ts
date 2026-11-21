import { Component, input } from '@angular/core'

export type CshUiDataTableColumn = { key: string; header: string }

@Component({
  selector: 'csh-ui-data-table',
  template: `
    <div class="csh-data-table">
      <table>
        <caption>
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
              <th scope="col">{{ column.header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length">No rows</td>
            </tr>
          } @else {
            @for (row of rows(); track $index) {
              <tr>
                @for (column of columns(); track column.key; let first = $first) {
                  @if (first) {
                    <th scope="row">{{ row[column.key] }}</th>
                  } @else {
                    <td>{{ row[column.key] }}</td>
                  }
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CshUiDataTable {
  readonly caption = input.required<string>()
  readonly columns = input.required<readonly CshUiDataTableColumn[]>()
  readonly rows = input.required<readonly Record<string, string>[]>()
}
