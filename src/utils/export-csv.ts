import { exportFile, type QTableColumn } from 'quasar';

// Excel needs a UTF-8 byte-order mark or it mis-renders Cyrillic in CSVs.
const UTF8_BOM = '﻿';

// Locales where comma is the decimal separator (most of Europe, incl.
// Ukrainian/German) make Excel expect ';' as the CSV field separator
// instead of ','. There's a `sep=,` hint line Excel also recognizes, but it
// conflicts with the UTF-8 BOM above (Excel reads the sep line before it
// re-checks the BOM and gets stuck on the wrong encoding for the rest of
// the file) — so we just delimit with ';' instead of fighting Excel's
// locale detection.
const DELIMITER = ';';

// A cell starting with =, +, -, or @ is executed as a formula by
// Excel/Sheets (CSV/Formula Injection, CWE-1236). Since our data can
// contain user-entered names, neutralize it the OWASP-recommended way: a
// leading single quote forces "treat as text" without changing what's
// visibly displayed.
const FORMULA_TRIGGER = /^[=+\-@]/;

function wrapCsvValue(value: unknown): string {
  let str: string;
  if (value === undefined || value === null) {
    str = '';
  } else if (typeof value === 'string') {
    str = value;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    str = String(value);
  } else {
    str = JSON.stringify(value);
  }
  if (FORMULA_TRIGGER.test(str)) {
    str = `'${str}`;
  }
  return `"${str.split('"').join('""')}"`;
}

function cellValue(row: object, column: QTableColumn<object>): unknown {
  const raw =
    typeof column.field === 'function'
      ? column.field(row)
      : (row as Record<string, unknown>)[column.field ?? column.name];
  return column.format ? column.format(raw, row) : raw;
}

/**
 * Exports a QTable's columns/rows as a CSV file, Excel-compatible: UTF-8
 * BOM so Cyrillic text isn't mangled, ';' delimiter so it splits into
 * columns under comma-decimal locales. Returns false if the browser denied
 * the download so the caller can notify the user.
 */
export function exportTableToCsv<T extends object>(
  fileName: string,
  columns: QTableColumn<T>[],
  rows: T[],
): boolean {
  const cols = columns as unknown as QTableColumn<object>[];
  const header = cols.map((col) => wrapCsvValue(col.label)).join(DELIMITER);
  const lines = rows.map((row) =>
    cols.map((col) => wrapCsvValue(cellValue(row, col))).join(DELIMITER),
  );
  const content = [header, ...lines].join('\r\n');

  const status = exportFile(fileName, content, {
    mimeType: 'text/csv;charset=utf-8',
    byteOrderMark: UTF8_BOM,
  });

  return status === true;
}
