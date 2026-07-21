// Turn rows into a CSV file and trigger a download. We add a UTF-8 BOM so that
// Excel opens the file with the right encoding (accents, the € sign, etc.), and
// quote any cell that contains a comma, quote, or line break. No dependency —
// a .csv opens directly in Excel / Google Sheets / Numbers.

type Cell = string | number | null | undefined;

const escapeCell = (value: Cell): string => {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildCsv = (headers: string[], rows: Cell[][]): string => {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return lines.join("\r\n");
};

export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: Cell[][]
): void => {
  const csv = buildCsv(headers, rows);
  // ﻿ is the UTF-8 byte-order mark, so Excel reads the file as UTF-8.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
