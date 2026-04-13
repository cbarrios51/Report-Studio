/**
 * Tipos para datos de Excel
 */

export interface ExcelCell {
  value: string | number | boolean | Date | null;
  type: 'string' | 'number' | 'boolean' | 'date' | 'empty';
}

export interface ExcelRow {
  [key: string]: ExcelCell | string | number | boolean | Date | null;
}

export interface ExcelSheet {
  name: string;
  data: ExcelRow[];
  headers: string[];
  isTabular: boolean;
  columnTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'>;
  metadata?: {
    title: string | null;
    subtitle: string | null;
    period: string | null;
  };
  parsedSheet?: any;
}

export interface ExcelFile {
  name: string;
  sheets: ExcelSheet[];
  uploadedAt: Date;
}

export interface RawExcelData {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}
