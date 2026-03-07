declare module 'jspdf' {
  export class jsPDF {
    constructor(...args: unknown[]);
    setFontSize(size: number): void;
    text(text: string, x: number, y: number, options?: Record<string, unknown>): void;
    output(): string;
    save(filename: string): void;
    setProperties(props: Record<string, unknown>): void;
    setPage(pageNumber: number): void;
    internal: {
      pages: unknown[];
      pageSize: { getWidth: () => number; getHeight: () => number };
    };
  }

  const defaultExport: typeof jsPDF;
  export default defaultExport;
}

declare module 'jspdf-autotable';

declare module '@vanilla-extract/css' {
  export function createGlobalTheme<T extends Record<string, unknown>>(
    selector: string,
    vars: T
  ): T;
}
