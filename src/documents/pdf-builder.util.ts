// src/documents/pdf-builder.util.ts

import PDFDocument from 'pdfkit'; // FIX 1 : import * as (CommonJS compatible)

const COLORS = {
  primary:   '#3B4EFF',
  dark:      '#111827',
  gray:      '#6B7280',
  lightGray: '#F3F4F6',
  border:    '#E5E7EB',
  success:   '#10B981',
  danger:    '#EF4444',
  white:     '#FFFFFF',
};

export interface TableColumn {
  header: string;
  width:  number;
  align?: 'left' | 'right' | 'center';
}

export interface TotalLine {
  label: string;
  value: string;
  bold?:  boolean;
  color?: string;
}

export interface InfoItem {
  label: string;
  value: string;
}

export class PdfBuilder {
  private readonly doc: InstanceType<typeof PDFDocument>;
  private readonly pageMargin = 50;
  // FIX 3 : largeur utile = 595 - 2*50 = 495pt
  private readonly pageWidth  = 495;

  constructor() {
    this.doc = new PDFDocument({
      size:    'A4',
      margins: {
        top:    this.pageMargin,
        bottom: this.pageMargin,
        left:   this.pageMargin,
        right:  this.pageMargin,
      },
      info: { Creator: 'ERP System', Producer: 'PDFKit' },
    });
  }

  getDocument(): InstanceType<typeof PDFDocument> {
    return this.doc;
  }

  // ─── EN-TÊTE ──────────────────────────────────────────────────────
  header(company: string, docType: string, options?: {
    color?: string;
    subtitle?: string;
  }): this {
    const color = options?.color ?? COLORS.primary;

    this.doc.rect(0, 0, 595, 80).fill(color);

    this.doc
      .fillColor(COLORS.white)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(company, this.pageMargin, 22, { align: 'left', lineBreak: false });

    this.doc
      .fontSize(14)
      .font('Helvetica')
      .text(docType, this.pageMargin, 50, { align: 'left', lineBreak: false });

    if (options?.subtitle) {
      this.doc.fontSize(9)
        .text(options.subtitle, this.pageMargin, 66, { lineBreak: false });
    }

    this.doc.fillColor(COLORS.dark);
    // FIX 2 : forcer le curseur après l'en-tête
    this.doc.y = 100;
    return this;
  }

  // ─── DEUX COLONNES INFO / CLIENT ─────────────────────────────────
  infoColumns(left: InfoItem[], right: InfoItem[]): this {
    const startY    = this.doc.y + 10;
    const colWidth  = this.pageWidth / 2; // 247.5pt chacune
    const lineGap   = 4; // espace supplémentaire entre lignes

    // ── Colonne gauche ──────────────────────────────────────────
    let y = startY;
    this.doc.fontSize(7).fillColor(COLORS.gray).font('Helvetica-Bold')
      .text('INFORMATIONS', this.pageMargin, y, { lineBreak: false });
    y += 13;

    const leftLabelW = 75;
    const leftValueW = colWidth - leftLabelW - 8;

    for (const item of left) {
      if (!item.value || item.value === '—' || item.value.trim() === '') continue;

      // Écrire le label (toujours sur une seule ligne courte)
      this.doc.font('Helvetica').fillColor(COLORS.gray).fontSize(8)
        .text(item.label + ' :', this.pageMargin, y, {
          width: leftLabelW, lineBreak: false,
        });

      // Écrire la valeur séparément, à droite du label, avec wrap autorisé
      this.doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(8)
        .text(item.value, this.pageMargin + leftLabelW + 4, y, {
          width: leftValueW,
        });

      // FIX : mesurer la vraie hauteur du texte écrit (gère le wrap automatiquement)
      const valueHeight = this.doc.heightOfString(item.value, { width: leftValueW });
      y += Math.max(13, valueHeight) + lineGap;
    }

    const leftEndY = y;

    // ── Colonne droite (client) ─────────────────────────────────
    y = startY;
    const rightX     = this.pageMargin + colWidth + 8;
    const rightLabelW = 80;
    const rightValueW = colWidth - rightLabelW - 8;

    this.doc.fontSize(7).fillColor(COLORS.gray).font('Helvetica-Bold')
      .text('CLIENT', rightX, y, { lineBreak: false });
    y += 13;

    for (const item of right) {
      if (!item.value || item.value === '—' || item.value.trim() === '') continue;

      this.doc.font('Helvetica-Bold').fillColor(COLORS.gray).fontSize(8)
        .text(item.label + ' :', rightX, y, {
          width: rightLabelW, lineBreak: false,
        });

      this.doc.fillColor(COLORS.dark).font('Helvetica').fontSize(8)
        .text(item.value, rightX + rightLabelW + 4, y, {
          width: rightValueW,
        });

      // FIX : mesurer la vraie hauteur (email longs, adresses sur 2 lignes, etc.)
      const valueHeight = this.doc.heightOfString(item.value, { width: rightValueW });
      y += Math.max(13, valueHeight) + lineGap;
    }

    const rightEndY = y;

    // FIX : positionner le curseur après la colonne la PLUS HAUTE des deux
    this.doc.y = Math.max(leftEndY, rightEndY) + 14;
    return this;
  }

  // ─── SÉPARATEUR ──────────────────────────────────────────────────
  divider(): this {
    const y = this.doc.y;
    this.doc
      .moveTo(this.pageMargin, y)
      .lineTo(this.pageMargin + this.pageWidth, y)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
    this.doc.y = y + 10;
    return this;
  }

  // ─── TABLEAU ──────────────────────────────────────────────────────
  table(columns: TableColumn[], rows: string[][]): this {
    const startX  = this.pageMargin;
    const rowH    = 18;
    const headerH = 20;

    const drawHeader = (headerY: number) => {
      // FIX 3 : utiliser this.pageWidth (495) pas 595-margin
      this.doc.rect(startX, headerY, this.pageWidth, headerH).fill(COLORS.lightGray);
      let x = startX;
      this.doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.gray);
      for (const col of columns) {
        this.doc.text(col.header, x + 4, headerY + 6, {
          width:     col.width - 8,
          align:     col.align ?? 'left',
          lineBreak: false,
        });
        x += col.width;
      }
    };

    // FIX 2 : capturer y avant l'en-tête pour l'avancer manuellement
    let currentY = this.doc.y;
    drawHeader(currentY);
    currentY += headerH;

    let rowIndex = 0;
    for (const row of rows) {
      // Nouvelle page si nécessaire (laisser 30pt de marge basse)
      if (currentY + rowH > 762) {
        this.doc.addPage();
        currentY = this.pageMargin;
        drawHeader(currentY);
        currentY += headerH;
        rowIndex = 0;
      }

      // Fond alterné
      if (rowIndex % 2 === 1) {
        this.doc.rect(startX, currentY, this.pageWidth, rowH).fill('#FAFAFA');
      }

      // Détecter ligne supplément (indentée avec ├─)
      const isSupp = (row[0] ?? '').includes('├─');

      let x = startX;
      this.doc
        .fontSize(isSupp ? 7.5 : 8)
        .font('Helvetica')
        .fillColor(isSupp ? COLORS.gray : COLORS.dark);

      for (let i = 0; i < columns.length; i++) {
        const col  = columns[i];
        const cell = row[i] ?? '';
        this.doc.text(cell, x + 4, currentY + 5, {
          width:     col.width - 8,
          align:     col.align ?? 'left',
          lineBreak: false,
        });
        x += col.width;
      }

      // Bordure basse
      this.doc
        .moveTo(startX, currentY + rowH - 0.5)
        .lineTo(startX + this.pageWidth, currentY + rowH - 0.5)
        .strokeColor(COLORS.border)
        .lineWidth(0.3)
        .stroke();

      currentY += rowH;
      rowIndex++;
    }

    // FIX 2 : remettre le curseur à jour
    this.doc.y = currentY + 8;
    return this;
  }

  // ─── TOTAUX ───────────────────────────────────────────────────────
  totals(lines: TotalLine[]): this {
    const blockWidth = 210;
    const x          = this.pageMargin + this.pageWidth - blockWidth;

    let currentY = this.doc.y;

    for (const line of lines) {
      const isBold = line.bold ?? false;
      // FIX 4 : vérifier que color est défini avant de l'utiliser
      const color  = line.color ?? (isBold ? COLORS.primary : COLORS.dark);

      if (isBold) {
        this.doc
          .rect(x - 8, currentY - 3, blockWidth + 8, 20)
          .fill(COLORS.lightGray);
      }

      this.doc
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isBold ? 10 : 8.5)
        .fillColor(COLORS.gray)
        .text(line.label, x, currentY, { continued: true, width: 105, lineBreak: false });

      this.doc
        .fillColor(color)
        .text(line.value, { align: 'right', width: 105, lineBreak: false });

      currentY += isBold ? 18 : 14;
    }

    this.doc.y = currentY + 8;
    return this;
  }

  // ─── NOTE ─────────────────────────────────────────────────────────
  note(text: string): this {
    if (!text || !text.trim()) return this;

    const noteY = this.doc.y + 4;
    this.doc
      .rect(this.pageMargin, noteY, this.pageWidth, 0.5)
      .fill(COLORS.border);

    this.doc.y = noteY + 10;
    this.doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica-Bold')
      .text('Note :', this.pageMargin, this.doc.y, { lineBreak: false });

    this.doc.y += 13;
    this.doc.font('Helvetica').fillColor(COLORS.dark)
      .text(text, this.pageMargin, this.doc.y, {
        width: this.pageWidth,
      });
    this.doc.y += 8;
    return this;
  }

  // ─── BADGE STATUT ─────────────────────────────────────────────────
  badge(text: string, color: string): this {
    // FIX 4 : vérifier que color est bien une string valide
    const safeColor = (typeof color === 'string' && color.startsWith('#')) ? color : COLORS.gray;
    const bgColor   = safeColor + '22'; // 13% opacité

    const badgeY = this.doc.y;
    const w = 90, h = 15;

    this.doc.roundedRect(this.pageMargin, badgeY, w, h, 4).fill(bgColor);
    this.doc
      .fontSize(7.5)
      .fillColor(safeColor)
      .font('Helvetica-Bold')
      .text(text.toUpperCase(), this.pageMargin + 4, badgeY + 4, {
        width: w - 8, align: 'center', lineBreak: false,
      });

    this.doc.y = badgeY + h + 8;
    return this;
  }

  // ─── PIED DE PAGE ─────────────────────────────────────────────────
  // FIX 5 : utiliser une position relative à la page courante
  footer(company: string): this {
    // 762 = 842 (A4 hauteur) - 50 (marge basse) - 30 (espace pied)
    const footerY = 762;

    this.doc
      .moveTo(this.pageMargin, footerY)
      .lineTo(this.pageMargin + this.pageWidth, footerY)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    this.doc
      .fontSize(7)
      .fillColor(COLORS.gray)
      .font('Helvetica')
      .text(
        `${company} — Document généré le ${fmtDate(new Date())}`,
        this.pageMargin, footerY + 6,
        { align: 'center', width: this.pageWidth, lineBreak: false },
      );
    return this;
  }

  // ─── BUILD ────────────────────────────────────────────────────────
  build(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
      this.doc.on('end',   () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────

export function fmtMoney(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '0,000 DTN';
  return `${Number(n).toFixed(3).replace('.', ',')} DTN`;
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-TN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft:     '#6B7280', sent:      '#3B82F6',
    accepted:  '#10B981', refused:   '#EF4444',
    expired:   '#F97316', converted: '#8B5CF6',
    confirmed: '#3B82F6', preparing: '#F59E0B',
    shipped:   '#8B5CF6', delivered: '#10B981',
    cancelled: '#EF4444', paid:      '#10B981',
    partial:   '#F59E0B', overdue:   '#EF4444',
    pending:   '#6B7280', signed:    '#10B981',
  };
  return map[status] ?? '#6B7280';
}