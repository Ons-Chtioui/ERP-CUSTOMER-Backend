/**
 * Générateur PDF minimal (PDF 1.4) — aucune dépendance externe.
 * Supporte texte, lignes horizontales et tableaux simples.
 */

interface PdfTextOptions {
  size?: number;
  bold?: boolean;
  color?: [number, number, number];
}

interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

export class PdfBuilder {
  private readonly objects: string[] = [];
  private content = '';
  private y = 780;
  private readonly pageWidth = 595;
  private readonly margin = 50;

  private line(text: string, opts: PdfTextOptions = {}): void {
    const size = opts.size ?? 10;
    const font = opts.bold ? 'Helvetica-Bold' : 'Helvetica';
    const [r, g, b] = opts.color ?? [0, 0, 0];
    if (this.y < 60) this.newPage();
    this.content += `BT /${font.replace('-', '') === 'HelveticaBold' ? 'F2' : 'F1'} ${size} Tf ${r} ${g} ${b} rg ${this.margin} ${this.y} Td (${this.escape(text)}) Tj ET\n`;
    this.y -= size + 6;
  }

  private escape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private hr(): void {
    if (this.y < 40) this.newPage();
    this.content += `${this.margin} ${this.y} m ${this.pageWidth - this.margin} ${this.y} l S\n`;
    this.y -= 12;
  }

  private newPage(): void {
    this.y = 780;
  }

  title(text: string): this {
    this.line(text, { size: 18, bold: true });
    this.y -= 4;
    return this;
  }

  subtitle(text: string): this {
    this.line(text, { size: 12, bold: true, color: [0.2, 0.2, 0.2] });
    return this;
  }

  text(text: string, opts?: PdfTextOptions): this {
    this.line(text, opts);
    return this;
  }

  spacer(h = 10): this {
    this.y -= h;
    return this;
  }

  table(columns: TableColumn[], rows: string[][]): this {
    const startX = this.margin;
    let x = startX;

    if (this.y < 80) this.newPage();

    // Header
    for (const col of columns) {
      this.content += `BT /F2 9 Tf 0.3 0.3 0.3 rg ${x} ${this.y} Td (${this.escape(col.header)}) Tj ET\n`;
      x += col.width;
    }
    this.y -= 14;
    this.hr();

    for (const row of rows) {
      if (this.y < 50) this.newPage();
      x = startX;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const cell = row[i] ?? '';
        const offset = col.align === 'right' ? col.width - 40 : 0;
        this.content += `BT /F1 9 Tf 0 0 0 rg ${x + offset} ${this.y} Td (${this.escape(cell)}) Tj ET\n`;
        x += col.width;
      }
      this.y -= 14;
    }
    this.y -= 6;
    return this;
  }

  totals(lines: { label: string; value: string; bold?: boolean }[]): this {
    this.spacer(8);
    for (const t of lines) {
      this.line(`${t.label} : ${t.value}`, { bold: t.bold, size: t.bold ? 11 : 10 });
    }
    return this;
  }

  build(): Buffer {
    const stream = this.content;
    const streamLen = Buffer.byteLength(stream, 'utf8');

    const header = `%PDF-1.4\n`;
    const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
    const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`;
    const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}endstream\nendobj\n`;
    const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
    const obj6 = `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

    const body = obj1 + obj2 + obj3 + obj4 + obj5 + obj6;
    const bodyStart = Buffer.byteLength(header, 'utf8');

    const offsets = [0];
    let pos = bodyStart;
    for (const part of [obj1, obj2, obj3, obj4, obj5, obj6]) {
      offsets.push(pos);
      pos += Buffer.byteLength(part, 'utf8');
    }

    let xref = `xref\n0 7\n0000000000 65535 f \n`;
    for (let i = 1; i <= 6; i++) {
      xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    const xrefStart = bodyStart + Buffer.byteLength(body, 'utf8');
    const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(header + body + xref + trailer, 'utf8');
  }
}

export function fmtMoney(n: number): string {
  return `${Number(n).toFixed(3)} DTN`;
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-TN');
}
