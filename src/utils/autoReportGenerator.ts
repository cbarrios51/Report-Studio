import type { ExcelSheet } from '@/types/excel';
import type { ReportSection } from '@/types/sections';
import { createKpiSection, createTableSection } from '@/utils/templates';
import { parseValue } from './formatters';

import type { TableSection } from '@/types/sections';

interface ColumnAnalysis {
  numeric: string[];
  currency: string[];
  category: string[];
  identifier: string[];
  mainValueCol: string | null;
  mainCountCol: string | null;
}

function classifyHeader(header: string): { isIdentifier: boolean; isCurrency: boolean; isCount: boolean } {
  const normalized = header.toLowerCase().trim();
  const identifierWords = ['nro', 'sv', 'id', '#', 'codigo', 'código', 'orden', 'guía', 'guia'];
  const moneyWords = ['monto', 'importe', 'valor', 'total', 'flete', 'precio', 'costo'];
  const countWords = ['cant', 'piezas', 'cantidad', 'qty', 'units', 'guías', 'guias', 'kg', 'peso'];

  return {
    isIdentifier: identifierWords.some(word => normalized === word || normalized.startsWith(word)),
    isCurrency: moneyWords.some(word => normalized.includes(word)),
    isCount: countWords.some(word => normalized.includes(word)),
  };
}

function analyzeColumns(headers: string[], rows: Record<string, unknown>[]): ColumnAnalysis {
  const numeric: string[] = [];
  const currency: string[] = [];
  const category: string[] = [];
  const identifier: string[] = [];

  headers.forEach((header) => {
    const values = rows
      .map(row => row[header])
      .filter(value => value !== null && value !== undefined && value !== '') as unknown[];

    const normalizedHeader = classifyHeader(header);
    const numericVals = values
      .map(value => parseValue.toNumber(value))
      .filter((value): value is number => value !== null);

    const numericRatio = values.length === 0 ? 0 : numericVals.length / values.length;

    if (normalizedHeader.isIdentifier || (numericRatio > 0.95 && numericVals.length > 0 && numericVals.every(v => v > 1000))) {
      identifier.push(header);
      return;
    }

    if (numericRatio > 0.8) {
      const avg = numericVals.reduce((sum, value) => sum + value, 0) / Math.max(numericVals.length, 1);
      if (normalizedHeader.isCurrency || avg > 1000) {
        currency.push(header);
      } else {
        numeric.push(header);
      }
      return;
    }

    const unique = Array.from(new Set(values.map(String).map(value => value.trim()))).filter(value => value !== '');
    if (unique.length <= 30) {
      category.push(header);
      return;
    }

    category.push(header);
  });

  const mainValueCol = currency[0] || numeric[0] || null;
  const mainCountCol = numeric.find(col => classifyHeader(col).isCount) || null;

  return { numeric, currency, category, identifier, mainValueCol, mainCountCol };
}

function generateKPIs(colAnalysis: ColumnAnalysis, sheetName: string): ReportSection | null {
  const metrics = [] as Array<{ label: string; field: string; aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min'; decimals: number }>;
  const firstField = colAnalysis.identifier[0] || colAnalysis.category[0] || colAnalysis.numeric[0] || colAnalysis.currency[0] || 'Nro';

  metrics.push({
    label: 'Total Guías',
    field: firstField,
    aggregation: 'count',
    decimals: 0,
  });

  if (colAnalysis.mainValueCol) {
    metrics.push({
      label: `Total ${colAnalysis.mainValueCol}`,
      field: colAnalysis.mainValueCol,
      aggregation: 'sum',
      decimals: 2,
    });
  }

  if (colAnalysis.mainCountCol) {
    metrics.push({
      label: `Total ${colAnalysis.mainCountCol}`,
      field: colAnalysis.mainCountCol,
      aggregation: 'sum',
      decimals: 0,
    });
  }

  if (metrics.length === 0) return null;
  return createKpiSection(sheetName, metrics);
}

function generateGroupedTable(
  rows: Record<string, unknown>[],
  groupCol: string,
  colAnalysis: ColumnAnalysis,
  sheetName: string
): ReportSection | null {
  const groups = new Map<string, Record<string, unknown>>();

  rows.forEach((row) => {
    const key = String(row[groupCol] ?? 'Sin dato').trim() || 'Sin dato';
    const current = groups.get(key) ?? { [groupCol]: key, Guías: 0 } as Record<string, unknown>;
    current.Guías = Number(current.Guías ?? 0) + 1;

    [...colAnalysis.numeric, ...colAnalysis.currency].forEach((col) => {
      const currentValue = parseValue.toNumber(current[col]);
      const rowValue = parseValue.toNumber(row[col]);
      current[col] = (currentValue ?? 0) + (rowValue ?? 0);
    });

    groups.set(key, current);
  });

  if (groups.size === 0) return null;

  const tableRows = Array.from(groups.values());
  const columns = [groupCol, 'Guías', ...Array.from(new Set([...colAnalysis.numeric, ...colAnalysis.currency]))];

  const mainValueCol = colAnalysis.mainValueCol;
  const grandTotal = mainValueCol ? tableRows.reduce((sum, row) => sum + (parseValue.toNumber(row[mainValueCol]) ?? 0), 0) : 0;

  tableRows.forEach((row) => {
    if (mainValueCol) {
      const value = parseValue.toNumber(row[mainValueCol]) ?? 0;
      row['%'] = grandTotal > 0 ? `${((value / grandTotal) * 100).toFixed(2)}%` : '0.00%';
    }
  });

  if (mainValueCol) {
    columns.push('%');
  }

  const section = createTableSection(sheetName, columns, `Distribución por ${groupCol}`) as TableSection;
  section.rows = tableRows;
  section.showTotals = false;
  section.totalColumns = [];
  section.highlightTotals = true;
  section.alternateRows = true;
  section.headerColor = '#0070C0';

  return section;
}

export function generateFullReport(sheet: ExcelSheet): ReportSection[] {
  if (!sheet.isTabular || sheet.data.length === 0 || sheet.headers.length === 0) {
    return [];
  }

  const analysis = analyzeColumns(sheet.headers, sheet.data);

  const sections: ReportSection[] = [];
  const kpiSection = generateKPIs(analysis, sheet.name);
  if (kpiSection) {
    sections.push(kpiSection);
  }

  const categoryColumns = analysis.category.filter(col => !analysis.identifier.includes(col));
  categoryColumns.forEach((categoryCol) => {
    const tableSection = generateGroupedTable(sheet.data, categoryCol, analysis, sheet.name);
    if (tableSection) {
      sections.push(tableSection);
    }
  });

  return sections;
}
