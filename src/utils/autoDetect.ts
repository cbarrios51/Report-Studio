import * as XLSX from 'xlsx';
import type { ExcelSheet, ExcelRow } from '@/types/excel';
import type { KpiMetric } from '@/types/sections';
import { formatters, parseValue } from './formatters';

export type DetectedSheetLayout = 'single-column' | 'two-column';
export type DetectedColumnType = 'text' | 'number' | 'currency' | 'percentage' | 'date';

export interface SuggestedMetric {
  label: string;
  column: string;
  operation: 'sum' | 'avg' | 'count' | 'max' | 'min';
  value: number;
  formatted: string;
}

export interface SuggestedChart {
  type: 'bar' | 'pie' | 'line';
  xColumn: string;
  yColumn: string;
  reason: string;
}

export interface DetectedTable {
  id: string;
  title: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  headers: string[];
  rows: (string | number | null)[][];
  columnTypes: DetectedColumnType[];
  hasTotalsRow: boolean;
  suggestedMetrics: SuggestedMetric[];
  suggestedCharts: SuggestedChart[];
}

export interface DetectedSheet {
  sheetName: string;
  reportTitle: string | null;
  reportPeriod: string | null;
  tables: DetectedTable[];
  layout: DetectedSheetLayout;
}

const TABLE_HEADER_MIN_CELLS = 3;
const TWO_COLUMN_GAP = 2;
const TOTAL_KEYWORDS = ['total', 'total general', 'subtotal', 'subtotal general', 'totales'];
const REPORT_TITLE_KEYWORDS = /reporte|relaci[oó]n|informe|facturaci[oó]n/i;
const PERIOD_REGEX = /(\d{1,2}-\d{2})\s*al\s*(\d{1,2}-\d{2})/i;

export function cleanCell(value: any): string | number | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    const dateValue = value;
    if (isNaN(dateValue.getTime())) return null;
    return formatters.date(dateValue, 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  if (typeof value === 'number') {
    return Number(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

export function isRowEmpty(row: any[]): boolean {
  return row.every(cell => cleanCell(cell) === null);
}

export function isSectionHeader(row: any[], allRows: any[][], rowIndex: number): boolean {
  const cleaned = row.map(cleanCell);
  const nonEmpty = cleaned.filter(value => value !== null) as string[];

  if (nonEmpty.length === 0 || nonEmpty.length > 2) return false;
  if (!row.every((cell, index) => index < row.indexOf(nonEmpty[0]) || index > row.lastIndexOf(nonEmpty[nonEmpty.length - 1]) ? cleanCell(cell) === null : true)) {
    return false;
  }

  const text = nonEmpty.join(' ').trim();
  if (text.length < 5) return false;

  if (REPORT_TITLE_KEYWORDS.test(text) || /TOTAL|GENERA|FACTURACI[oó]N|LIBRAS|GUÍAS|GUIAS|PIEZAS/i.test(text)) {
    return true;
  }

  if (text === text.toUpperCase() && text.length >= 8) {
    return true;
  }

  if (rowIndex < allRows.length - 1 && isColumnHeader(allRows[rowIndex + 1], allRows[rowIndex + 2] || [])) {
    return true;
  }

  return false;
}

export function isColumnHeader(row: any[], nextRow: any[]): boolean {
  const cleaned = row.map(cleanCell);
  const shortTextCount = cleaned.filter(value => typeof value === 'string' && value.length > 0 && value.length < 30).length;
  const nonEmptyCount = cleaned.filter(value => value !== null).length;

  if (nonEmptyCount < TABLE_HEADER_MIN_CELLS) return false;
  if (shortTextCount < TABLE_HEADER_MIN_CELLS) return false;

  const nextRowCleaned = nextRow.map(cleanCell);
  const nextRowDataCount = nextRowCleaned.filter(value => value !== null && (typeof value === 'number' || typeof value === 'string')).length;

  return nextRowDataCount >= 2;
}

export function detectTwoColumnLayout(headerRow: any[]): { left: number[]; right: number[] } | null {
  const cleaned = headerRow.map(cleanCell);
  const blocks: Array<[number, number]> = [];
  let activeBlock: [number, number] | null = null;

  for (let index = 0; index < cleaned.length; index++) {
    const value = cleaned[index];
    if (value !== null) {
      if (!activeBlock) {
        activeBlock = [index, index];
      } else {
        activeBlock[1] = index;
      }
    } else if (activeBlock) {
      blocks.push(activeBlock);
      activeBlock = null;
    }
  }

  if (activeBlock) {
    blocks.push(activeBlock);
  }

  if (blocks.length < 2) return null;

  for (let index = 0; index < blocks.length - 1; index++) {
    const current = blocks[index];
    const next = blocks[index + 1];
    const gap = next[0] - current[1] - 1;
    if (gap >= TWO_COLUMN_GAP && current[1] - current[0] + 1 >= 2 && next[1] - next[0] + 1 >= 2) {
      return { left: [current[0], current[1]], right: [next[0], next[1]] };
    }
  }

  return null;
}

export function formatValue(value: number, type: 'currency' | 'percentage' | 'number'): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (type === 'percentage') {
    return `${value.toFixed(2)}%`;
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getSectionTitle(row: any[]): string {
  const cleaned = row.map(cleanCell).filter(value => value !== null) as string[];
  return cleaned.length > 0 ? String(cleaned[0]).trim() : 'Tabla';
}

function valuesFromRow(row: any[], startCol: number, endCol: number): Array<string | number | null> {
  return row.slice(startCol, endCol + 1).map(cleanCell);
}

function getColumnValues(rows: (string | number | null)[][], index: number): Array<string | number> {
  return rows
    .map(row => row[index])
    .filter(value => value !== null) as Array<string | number>;
}

function detectTotalsRow(row: any[]): boolean {
  const cleaned = row.map(cleanCell).filter(value => value !== null) as string[];
  if (cleaned.length === 0) return false;

  const label = String(cleaned[0]).toLowerCase();
  return TOTAL_KEYWORDS.some(keyword => label.includes(keyword));
}

function isLikelyDateString(value: string): boolean {
  const lower = value.toLowerCase();
  if (/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i.test(lower)) {
    return true;
  }

  if (/^\d{4}-\d{2}(?:-\d{2})?$/.test(lower)) return true;
  if (/^\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?$/.test(lower)) return true;
  return false;
}

function detectColumnType(header: string, values: Array<string | number | null>): DetectedColumnType {
  const cleaned = values.filter(value => value !== null);
  if (cleaned.length === 0) return 'text';

  const numericValues = cleaned
    .map(value => parseValue.toNumber(value))
    .filter((value): value is number => value !== null);
  const numericRatio = numericValues.length / cleaned.length;

  const headerLower = header.toLowerCase();
  if (numericRatio >= 0.7) {
    if (headerLower.includes('$') || /\$/.test(header)) {
      return 'currency';
    }
    if (headerLower.includes('%') || headerLower.includes('porcentaje')) {
      const isPercentage = numericValues.every(value => value >= 0 && value <= 100);
      if (isPercentage) return 'percentage';
    }
    return 'number';
  }

  const stringValues = cleaned.filter(value => typeof value === 'string') as string[];
  const dateMatches = stringValues.filter(value => isLikelyDateString(value) || parseValue.toDate(value) !== null);
  if (dateMatches.length / stringValues.length >= 0.5 && stringValues.length > 0) {
    return 'date';
  }

  if (headerLower.includes('%')) return 'percentage';
  if (headerLower.includes('fecha') || headerLower.includes('mes') || headerLower.includes('año') || headerLower.includes('periodo')) {
    return 'date';
  }
  return 'text';
}

function suggestMetricsForTable(table: DetectedTable): SuggestedMetric[] {
  const metrics: SuggestedMetric[] = [];
  const dataRows = table.rows;

  for (let index = 0; index < table.headers.length; index++) {
    const header = table.headers[index];
    const type = table.columnTypes[index];
    const values = getColumnValues(dataRows, index).map(value => parseValue.toNumber(value)).filter((value): value is number => value !== null);
    if (values.length === 0) continue;

    const sum = values.reduce((acc, value) => acc + value, 0);
    const avg = sum / values.length;

    if (type === 'currency') {
      metrics.push({
        label: `Total ${header}`,
        column: header,
        operation: 'sum',
        value: sum,
        formatted: formatValue(sum, 'currency'),
      });
    } else if (type === 'number') {
      if (/gu[ií]as|piezas|facturas|facturas?/i.test(header)) {
        metrics.push({
          label: `Total ${header}`,
          column: header,
          operation: 'sum',
          value: sum,
          formatted: formatValue(sum, 'number'),
        });
      }
    } else if (type === 'percentage') {
      metrics.push({
        label: `Promedio ${header}`,
        column: header,
        operation: 'avg',
        value: avg,
        formatted: formatValue(avg, 'percentage'),
      });
    }
  }

  return metrics;
}

function suggestChartsForTable(table: DetectedTable): SuggestedChart[] {
  const charts: SuggestedChart[] = [];
  const headerTypes = table.headers.map((header, index) => ({ header, type: table.columnTypes[index] }));
  const textColumns = headerTypes.filter(col => col.type === 'text');
  const dateColumns = headerTypes.filter(col => col.type === 'date');
  const numericColumns = headerTypes.filter(col => col.type === 'number' || col.type === 'currency');
  const percentColumns = headerTypes.filter(col => col.type === 'percentage');

  if (textColumns.length > 0 && percentColumns.length > 0) {
    charts.push({
      type: 'pie',
      xColumn: textColumns[0].header,
      yColumn: percentColumns[0].header,
      reason: `Distribución porcentual por ${textColumns[0].header}`,
    });
  }

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    charts.push({
      type: 'line',
      xColumn: dateColumns[0].header,
      yColumn: numericColumns[0].header,
      reason: `Tendencia temporal de ${numericColumns[0].header}`,
    });
  }

  if (textColumns.length > 0 && numericColumns.length > 0) {
    const categories = getColumnValues(table.rows, table.headers.indexOf(textColumns[0].header));
    const uniqueCategories = Array.from(new Set(categories.map(item => String(item))));
    if (uniqueCategories.length > 0 && uniqueCategories.length <= 10) {
      charts.push({
        type: 'bar',
        xColumn: textColumns[0].header,
        yColumn: numericColumns[0].header,
        reason: `Comparación por ${textColumns[0].header}`,
      });
    }
  }

  return charts;
}

function buildDetectedTable(
  headerRowIndex: number,
  titleRowIndex: number,
  startCol: number,
  endCol: number,
  aoa: any[][]
): DetectedTable {
  const headerRow = aoa[headerRowIndex] || [];
  const tableHeaders = headerRow.slice(startCol, endCol + 1).map(cleanCell).map(value => String(value ?? '')).map(value => value.trim());
  const titleSourceRow = titleRowIndex >= 0 ? aoa[titleRowIndex] : headerRow;
  const title = getSectionTitle(titleSourceRow);

  const rows: (string | number | null)[][] = [];
  let endRow = headerRowIndex;
  let hasTotalsRow = false;

  for (let rowIndex = headerRowIndex + 1; rowIndex < aoa.length; rowIndex += 1) {
    const row = aoa[rowIndex] || [];
    const sliceRow = row.slice(startCol, endCol + 1);

    if (isRowEmpty(sliceRow)) {
      break;
    }

    if (isColumnHeader(row, aoa[rowIndex + 1] || [])) {
      break;
    }

    const values = valuesFromRow(row, startCol, endCol);
    rows.push(values);
    endRow = rowIndex;
  }

  if (rows.length > 0 && detectTotalsRow(rows[rows.length - 1])) {
    hasTotalsRow = true;
    rows.pop();
    endRow -= 1;
  }

  const columnTypes = tableHeaders.map((header, colIndex) => detectColumnType(header, getColumnValues(rows, colIndex)));
  const suggestedMetrics = suggestMetricsForTable({
    id: `${titleRowIndex}-${startCol}-${endCol}`,
    title,
    startRow: titleRowIndex >= 0 ? titleRowIndex : headerRowIndex,
    endRow,
    startCol,
    endCol,
    headers: tableHeaders,
    rows,
    columnTypes,
    hasTotalsRow,
    suggestedMetrics: [],
    suggestedCharts: [],
  });
  const detectedTable: DetectedTable = {
    id: `${title.toLowerCase().replace(/\s+/g, '-')}-${headerRowIndex}-${startCol}`,
    title,
    startRow: titleRowIndex >= 0 ? titleRowIndex : headerRowIndex,
    endRow,
    startCol,
    endCol,
    headers: tableHeaders,
    rows,
    columnTypes,
    hasTotalsRow,
    suggestedMetrics,
    suggestedCharts: [],
  };
  detectedTable.suggestedCharts = suggestChartsForTable(detectedTable);
  return detectedTable;
}

function detectTablesInAoa(aoa: any[][]): { tables: DetectedTable[]; layout: DetectedSheetLayout } {
  const tables: DetectedTable[] = [];
  let layout: DetectedSheetLayout = 'single-column';

  for (let rowIndex = 0; rowIndex < aoa.length; rowIndex += 1) {
    const row = aoa[rowIndex] || [];
    const nextRow = aoa[rowIndex + 1] || [];

    if (!isColumnHeader(row, nextRow)) continue;

    const titleRowIndex = rowIndex > 0 && isSectionHeader(aoa[rowIndex - 1], aoa, rowIndex - 1) ? rowIndex - 1 : -1;
    const blocks = detectTwoColumnLayout(row);

    if (blocks) {
      layout = 'two-column';
      tables.push(buildDetectedTable(rowIndex, titleRowIndex, blocks.left[0], blocks.left[1], aoa));
      tables.push(buildDetectedTable(rowIndex, titleRowIndex, blocks.right[0], blocks.right[1], aoa));
      continue;
    }

    tables.push(buildDetectedTable(rowIndex, titleRowIndex, 0, row.length - 1, aoa));
  }

  return { tables, layout };
}

function resolveCellValue(worksheet: XLSX.WorkSheet, cellAddress: string): any {
  const cell = worksheet[cellAddress];
  if (!cell) return null;
  if (cell.v !== undefined && cell.v !== null) return cell.v;
  if (cell.w !== undefined && cell.w !== null) return cell.w;
  return null;
}

function buildAoaFromSheet(worksheet: XLSX.WorkSheet): any[][] {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const aoa: any[][] = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: any[] = [];
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      row.push(resolveCellValue(worksheet, address));
    }
    aoa.push(row);
  }

  return aoa;
}

function detectReportTitleInAoa(aoa: any[][]): string | null {
  for (let rowIndex = 0; rowIndex < Math.min(5, aoa.length); rowIndex += 1) {
    const row = aoa[rowIndex] || [];
    const cleaned = row.map(cleanCell);
    const nonEmpty = cleaned.filter(value => value !== null) as string[];
    if (nonEmpty.length === 0) continue;

    const text = nonEmpty.join(' ').trim();
    if (text.length > 20 && REPORT_TITLE_KEYWORDS.test(text)) {
      return text;
    }

    if (nonEmpty.length === 1 && text.length > 20) {
      return text;
    }
  }
  return null;
}

function detectReportPeriodInAoa(aoa: any[][]): string | null {
  for (let rowIndex = 0; rowIndex < Math.min(5, aoa.length); rowIndex += 1) {
    const row = aoa[rowIndex] || [];
    const cleaned = row.map(cleanCell).filter(value => typeof value === 'string') as string[];
    const text = cleaned.join(' ');
    const match = PERIOD_REGEX.exec(text);
    if (match) {
      return `${match[1]} al ${match[2]}`;
    }
  }
  return null;
}

export function analyzeExcel(workbook: XLSX.WorkBook): DetectedSheet[] {
  return workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const aoa = buildAoaFromSheet(worksheet);
    const reportTitle = detectReportTitleInAoa(aoa);
    const reportPeriod = detectReportPeriodInAoa(aoa);
    const { tables, layout } = detectTablesInAoa(aoa);

    return {
      sheetName,
      reportTitle,
      reportPeriod,
      tables,
      layout: tables.length > 1 ? layout : 'single-column',
    };
  });
}

export function mapDetectedColumnType(type: DetectedColumnType): 'string' | 'number' | 'boolean' | 'date' {
  switch (type) {
    case 'date':
      return 'date';
    case 'number':
    case 'currency':
    case 'percentage':
      return 'number';
    default:
      return 'string';
  }
}

function getBestDetectedTable(tables: DetectedTable[]): DetectedTable | null {
  const validTables = tables.filter(
    table => table.headers.some(header => header.trim().length > 0) && table.rows.length > 0
  );

  if (validTables.length === 0) return null;

  return validTables.sort((a, b) => {
    const rowDiff = b.rows.length - a.rows.length;
    if (rowDiff !== 0) return rowDiff;
    return b.headers.length - a.headers.length;
  })[0];
}

export function buildExcelSheetFromDetectedSheet(detected: DetectedSheet): ExcelSheet {
  const table = getBestDetectedTable(detected.tables);
  if (!table) {
    return {
      name: detected.sheetName,
      data: [],
      headers: [],
      isTabular: false,
      columnTypes: {},
    };
  }

  const headers = table.headers.map((header, index) => {
    const trimmed = header.trim();
    return trimmed || `Column ${index + 1}`;
  });

  const data = table.rows.map((row) => {
    const excelRow: ExcelRow = {};
    headers.forEach((header, index) => {
      excelRow[header] = row[index] ?? null;
    });
    return excelRow;
  });

  const columnTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'> = {};
  headers.forEach((header, index) => {
    columnTypes[header] = mapDetectedColumnType(table.columnTypes[index]);
  });

  return {
    name: detected.sheetName,
    data,
    headers,
    isTabular: true,
    columnTypes,
  };
}

export function detectTabularData(rows: ExcelRow[], headers: string[]): boolean {
  return rows.length >= 2 && headers.length >= 2 && rows.some(row => headers.some(header => row[header] !== null && row[header] !== undefined && row[header] !== ''));
}

export function detectColumnTypes(rows: ExcelRow[], headers: string[]): Record<string, 'string' | 'number' | 'boolean' | 'date'> {
  const types: Record<string, 'string' | 'number' | 'boolean' | 'date'> = {};

  for (const header of headers) {
    const values = rows.map(row => row[header]).filter(value => value !== null && value !== undefined && value !== '');
    if (values.length === 0) {
      types[header] = 'string';
      continue;
    }

    const counts = { number: 0, date: 0, boolean: 0, string: 0 };
    for (const value of values) {
      const type = parseValue.getType(value);
      counts[type as keyof typeof counts] += 1;
    }

    const total = values.length;
    if (counts.number / total >= 0.7) {
      types[header] = 'number';
    } else if (counts.date / total >= 0.7) {
      types[header] = 'date';
    } else if (counts.boolean / total >= 0.7) {
      types[header] = 'boolean';
    } else {
      types[header] = 'string';
    }
  }

  return types;
}

export function detectReportTitle(rows: ExcelRow[], headers: string[]): string {
  const title = detectReportTitleInAoa([headers, ...rows.map(row => headers.map(header => row[header]))]);
  return title || 'Reporte';
}

export function suggestMetrics(headers: string[], columnTypes: Record<string, string>): KpiMetric[] {
  const numericColumns = headers.filter(header => columnTypes[header] === 'number');
  const metrics: KpiMetric[] = [];

  numericColumns.forEach(header => {
    const lower = header.toLowerCase();
    if (lower.includes('facturas') || lower.includes('monto') || lower.includes('importe') || lower.includes('total') || lower.includes('flete')) {
      metrics.push({
        id: `${header}-sum`.replace(/\s+/g, '-').toLowerCase(),
        label: `Total ${header}`,
        field: header,
        aggregation: 'sum',
        decimals: 2,
      });
    }
    if (lower.includes('porcentaje') || lower.includes('%')) {
      metrics.push({
        id: `${header}-avg`.replace(/\s+/g, '-').toLowerCase(),
        label: `Promedio ${header}`,
        field: header,
        aggregation: 'avg',
        decimals: 2,
      });
    }
    if (lower.includes('guías') || lower.includes('guias') || lower.includes('piezas')) {
      metrics.push({
        id: `${header}-sum`.replace(/\s+/g, '-').toLowerCase(),
        label: `Total ${header}`,
        field: header,
        aggregation: 'sum',
        decimals: 0,
      });
    }
  });

  if (metrics.length === 0 && numericColumns.length > 0) {
    metrics.push({
      id: `${numericColumns[0]}-sum`.replace(/\s+/g, '-').toLowerCase(),
      label: `Total ${numericColumns[0]}`,
      field: numericColumns[0],
      aggregation: 'sum',
      decimals: 2,
    });
  }

  return metrics;
}

export function detectGroupableColumns(headers: string[], columnTypes: Record<string, string>): string[] {
  return headers.filter(header => columnTypes[header] === 'string' || columnTypes[header] === 'date');
}

export function detectCategoryColumns(headers: string[], columnTypes: Record<string, string>): string[] {
  return headers.filter(header => columnTypes[header] === 'string' || columnTypes[header] === 'date');
}

export function analyzeSheet(sheet: ExcelSheet): {
  isTabular: boolean;
  columnTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'>;
  suggestedTitle: string;
  suggestedMetrics: KpiMetric[];
  groupableColumns: string[];
  categoryColumns: string[];
  numericColumns: string[];
} {
  const headers = sheet.headers;
  const rows = sheet.data;
  const columnTypes = detectColumnTypes(rows, headers);
  const isTabular = detectTabularData(rows, headers);
  const suggestedTitle = detectReportTitle(rows, headers);
  const suggestedMetrics = suggestMetrics(headers, columnTypes);
  const groupableColumns = detectGroupableColumns(headers, columnTypes);
  const categoryColumns = detectCategoryColumns(headers, columnTypes);
  const numericColumns = headers.filter(header => columnTypes[header] === 'number');

  return {
    isTabular,
    columnTypes,
    suggestedTitle,
    suggestedMetrics,
    groupableColumns,
    categoryColumns,
    numericColumns,
  };
}

export const SECTION_KEYWORDS = {
  facturacion: ['facturación', 'facturacion', 'invoice', 'factura'],
  localidad: ['localidad', 'ciudad', 'provincia', 'departamento'],
  tipoFlete: ['tipo de flete', 'tipo flete', 'flete', 'servicio'],
  llamadas: ['llamadas', 'calls', 'telefon'],
  tipificaciones: ['tipificación', 'tipificacion', 'motivo', 'categoría', 'categoria'],
  distribucionPais: ['país', 'pais', 'country', 'destino'],
  pickups: ['pickup', 'pickups', 'recolección', 'recoleccion'],
  labels: ['labels', 'etiquetas', 'guías', 'guias'],
};

export function detectSectionType(headers: string[], sheetName: string): string | null {
  const allText = [...headers, sheetName].join(' ').toLowerCase();
  for (const [type, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return type;
    }
  }
  return null;
}
