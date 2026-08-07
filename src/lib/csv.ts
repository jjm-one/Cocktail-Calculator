export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function download(name: string, content: string, type = 'text/plain'): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

export function exportCsv(name: string, headers: string[], rows: unknown[][]): void {
  download(
    name,
    [headers.join(';'), ...rows.map((r) => r.map(csvEscape).join(';'))].join('\n'),
    'text/csv;charset=utf-8',
  );
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === delim && !q) {
        out.push(cur);
        cur = '';
      } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = parseLine(lines.shift()!).map((x) => x.trim().toLowerCase());
  return lines.map((l) => Object.fromEntries(parseLine(l).map((v, i) => [header[i], v.trim()])));
}
