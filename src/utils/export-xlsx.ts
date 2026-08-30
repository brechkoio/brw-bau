import { exportFile, type QTableColumn } from 'quasar';

const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Brand tokens ($accent / $dark), duplicated here the same way
// quasar.config.ts's framework.config.brand duplicates
// quasar.variables.scss — Sass variables aren't reachable from plain .ts.
// ARGB, not RGB: ExcelJS colors need a leading alpha channel.
const ACCENT_ARGB = 'FFFFCF00';
const DARK_ARGB = 'FF161A1D';

function cellValue(row: object, column: QTableColumn<object>): unknown {
  const raw =
    typeof column.field === 'function'
      ? column.field(row)
      : (row as Record<string, unknown>)[column.field ?? column.name];
  return column.format ? column.format(raw, row) : raw;
}

/**
 * Exports a QTable's columns/rows as a real .xlsx workbook. ExcelJS is
 * loaded on demand (it's a heavy dependency) so it never sits in the main
 * bundle, only pulled in the moment someone actually clicks "Export".
 *
 * Unlike the CSV export, a plain-string XLSX cell is never re-interpreted
 * as a formula by Excel — that only happens for cells explicitly typed as
 * formulas, which this never creates — so there's no CSV-style leading-
 * quote neutralization here; adding one would just show up as a literal
 * stray apostrophe in the cell.
 */
export async function exportTableToXlsx<T extends object>(
  fileName: string,
  columns: QTableColumn<T>[],
  rows: T[],
): Promise<boolean> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  const cols = columns as unknown as QTableColumn<object>[];
  sheet.columns = cols.map((col) => {
    const label = String(col.label ?? col.name);
    return { header: label, key: col.name, width: Math.max(12, label.length + 4) };
  });
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: DARK_ARGB } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_ARGB } };
  });

  for (const row of rows) {
    const record: Record<string, unknown> = {};
    for (const col of cols) {
      record[col.name] = cellValue(row, col) ?? '';
    }
    sheet.addRow(record);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME_TYPE });

  const status = exportFile(fileName, blob);

  return status === true;
}
