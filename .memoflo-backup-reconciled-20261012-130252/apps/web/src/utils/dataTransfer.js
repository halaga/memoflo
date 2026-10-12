function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(filename, rows) {
  const list = Array.isArray(rows) ? rows : [];
  const keys = [...new Set(list.flatMap((row) => Object.keys(row || {})))];
  const csv = [keys.join(","), ...list.map((row) => keys.map((key) => escapeCsv(row?.[key])).join(","))].join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function parseLine(line) {
  const cells = []; let cell = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"' && quoted) { cell += '"'; i++; } else if (ch === '"') quoted = !quoted; else if (ch === "," && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += ch; }
  cells.push(cell.trim()); return cells;
}

export async function parseCsv(file) {
  const text = await file.text();
  const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseLine(lines.shift()).map((header) => header.trim());
  return lines.map((line) => { const cells = parseLine(line); return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])); });
}
