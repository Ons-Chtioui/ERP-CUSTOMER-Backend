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
export declare class PdfBuilder {
    private readonly objects;
    private content;
    private y;
    private readonly pageWidth;
    private readonly margin;
    private line;
    private escape;
    private hr;
    private newPage;
    title(text: string): this;
    subtitle(text: string): this;
    text(text: string, opts?: PdfTextOptions): this;
    spacer(h?: number): this;
    table(columns: TableColumn[], rows: string[][]): this;
    totals(lines: {
        label: string;
        value: string;
        bold?: boolean;
    }[]): this;
    build(): Buffer;
}
export declare function fmtMoney(n: number): string;
export declare function fmtDate(d: string | Date | null | undefined): string;
export {};
