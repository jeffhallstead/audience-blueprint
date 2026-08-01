/** Browser-side file generation for Blueprint exports (CSV / Excel / clipboard). */

import { EXPORT_COLUMNS, type ExportRow } from "./rows";

function escapeCsv(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: ExportRow[], separator = ","): string {
  const header = EXPORT_COLUMNS.join(separator);
  const body = rows.map((row) =>
    EXPORT_COLUMNS.map((column) => escapeCsv(String(row[column] ?? "").replace(/\r?\n/g, " "))).join(separator),
  );
  return [header, ...body].join("\n");
}

/** Tab-separated text pastes straight into Google Sheets or Excel. */
export function toTsv(rows: ExportRow[]): string {
  const header = EXPORT_COLUMNS.join("\t");
  const body = rows.map((row) =>
    EXPORT_COLUMNS.map((column) => String(row[column] ?? "").replace(/[\t\r\n]+/g, " ")).join("\t"),
  );
  return [header, ...body].join("\n");
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows: ExportRow[], stem: string) {
  // BOM keeps Excel honest about UTF-8.
  download(new Blob(["\uFEFF", toCsv(rows)], { type: "text/csv;charset=utf-8" }), `${stem}.csv`);
}

export async function downloadXlsx(rows: ExportRow[], stem: string) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row) => Object.fromEntries(EXPORT_COLUMNS.map((column) => [column, row[column] ?? ""]))),
    { header: [...EXPORT_COLUMNS] },
  );
  sheet["!cols"] = EXPORT_COLUMNS.map((column) =>
    column === "Detail" ? { wch: 60 } : column === "Title" ? { wch: 44 } : { wch: 16 },
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Blueprint");
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${stem}.xlsx`,
  );
}

export async function copyForSheets(rows: ExportRow[]) {
  await navigator.clipboard.writeText(toTsv(rows));
}
