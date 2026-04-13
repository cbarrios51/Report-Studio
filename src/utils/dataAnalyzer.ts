import type { ReportSection, TableSection } from '@/types/sections';
import { createTableSection, createKpiSection } from '@/utils/templates';
import { parseValue } from './formatters';

const VALUE_CANDIDATES = ['sv', 'monto', 'valor', 'factura', 'total', 'importe', 'precio', 'amount'];
const QTY_CANDIDATES = ['cant', 'piezas', 'cantidad', 'qty', 'units'];
const WEIGHT_CANDIDATES = ['peso', 'libras', 'pesos', 'weight', 'lbs', 'kg'];
const GROUP_CANDIDATES = ['servicio', 'tipo', 'categoria', 'localidad', 'destino', 'driver', 'transportista', 'operador', 'carrier'];
const DATE_CANDIDATES = ['fecha', 'date', 'periodo', 'period'];
const TOTAL_ROW_PATTERNS = [/^total/i, /total general/i, /subtotal/i, /^totales?/i];

function normalizeHeader(header: string): string {
  return String(header || '').trim().toLowerCase();
}

function parseNumericCell(value: unknown): number | null {
  if (typeof value === 'number') return Number(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/\s|\$|US\$|,/gi, '').trim();
    const numeric = parseFloat(cleaned);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return null;
}

export function detectValueColumn(headers: string[]): number {
  const normalized = headers.map(normalizeHeader);

  for (const candidate of VALUE_CANDIDATES) {
    const exactIndex = normalized.findIndex((header) => header === candidate);
    if (exactIndex >= 0) return exactIndex;
  }

  for (const candidate of VALUE_CANDIDATES) {
    const partialIndex = normalized.findIndex((header) => header.includes(candidate));
    if (partialIndex >= 0) return partialIndex;
  }

  return -1;
}

export function detectQuantityColumn(headers: string[]): number {
  const normalized = headers.map(normalizeHeader);

  for (const candidate of QTY_CANDIDATES) {
    const exactIndex = normalized.findIndex((header) => header === candidate);
    if (exactIndex >= 0) return exactIndex;
  }

  for (const candidate of QTY_CANDIDATES) {
    const partialIndex = normalized.findIndex((header) => header.includes(candidate));
    if (partialIndex >= 0) return partialIndex;
  }

  return -1;
}

export function detectWeightColumn(headers: string[]): number | null {
  const normalized = headers.map(normalizeHeader);

  for (const candidate of WEIGHT_CANDIDATES) {
    const exactIndex = normalized.findIndex((header) => header === candidate);
    if (exactIndex >= 0) return exactIndex;
  }

  for (const candidate of WEIGHT_CANDIDATES) {
    const partialIndex = normalized.findIndex((header) => header.includes(candidate));
    if (partialIndex >= 0) return partialIndex;
  }

  return null;
}

function detectDateColumn(headers: string[]): number | null {
  const normalized = headers.map(normalizeHeader);

  for (const candidate of DATE_CANDIDATES) {
    const exactIndex = normalized.findIndex((header) => header === candidate);
    if (exactIndex >= 0) return exactIndex;
  }

  for (const candidate of DATE_CANDIDATES) {
    const partialIndex = normalized.findIndex((header) => header.includes(candidate));
    if (partialIndex >= 0) return partialIndex;
  }

  return null;
}

export function detectGroupColumns(headers: string[], data: any[][]): string[] {
  const normalized = headers.map(normalizeHeader);
  const groups: Array<{ header: string; index: number; priority: number }> = [];

  headers.forEach((header, index) => {
    const values = data
      .map((row) => normalizeHeader(String(row[index] ?? '')))
      .filter((value) => value !== '');

    const uniqueValues = Array.from(new Set(values));
    const numericCount = values.filter((value) => parseNumericCell(value) !== null).length;

    if (values.length === 0 || uniqueValues.length <= 1 || uniqueValues.length > 20) return;
    if (numericCount / values.length > 0.5) return;

    const priority = GROUP_CANDIDATES.findIndex((candidate) => normalized[index].includes(candidate));
    groups.push({ header, index, priority: priority === -1 ? 999 : priority });
  });

  return groups.sort((a, b) => a.priority - b.priority).map((group) => group.header);
}

function isTotalsRow(row: any[]): boolean {
  const firstValue = normalizeHeader(String(row[0] ?? ''));
  return TOTAL_ROW_PATTERNS.some((pattern) => pattern.test(firstValue));
}

export function isTransactionalData(headers: string[], data: any[][]): boolean {
  if (data.length <= 50) return false;
  if (isTotalsRow(data[data.length - 1] || [])) return false;
  return detectValueColumn(headers) >= 0;
}

function getDateRangeLabel(data: any[][], dateCol: number | null): string {
  if (dateCol === null) return 'Período';
  const dates = data
    .map((row) => parseValue.toDate(row[dateCol]))
    .filter((value): value is Date => value instanceof Date && !isNaN(value.getTime()));

  if (dates.length === 0) return 'Período';
  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return `${first.toLocaleDateString('es-AR')} al ${last.toLocaleDateString('es-AR')}`;
}

function sumColumn(data: any[][], colIndex: number): number {
  return data.reduce((sum, row) => {
    const value = parseNumericCell(row[colIndex]);
    return sum + (value ?? 0);
  }, 0);
}

export function generateGroupedTable(
  data: any[][],
  headers: string[],
  groupByCol: number,
  valueCol: number,
  label: string,
  sheetName: string,
  qtyCol: number = -1,
  weightCol: number | null = null,
  percentBy: 'value' | 'count' | 'weight' = 'value'
): TableSection {
  const groupHeader = headers[groupByCol] || 'Categoría';
  const groups = new Map<string, { count: number; qty: number; value: number; weight: number }>();
  const validValue = valueCol >= 0;
  const validQty = qtyCol >= 0;
  const validWeight = weightCol !== null;

  data.forEach((row) => {
    const key = String(row[groupByCol] ?? 'Sin valor').trim() || 'Sin valor';
    const current = groups.get(key) ?? { count: 0, qty: 0, value: 0, weight: 0 };
    current.count += 1;
    if (validQty) current.qty += sumColumn([row], qtyCol);
    if (validValue) current.value += sumColumn([row], valueCol);
    if (validWeight && weightCol !== null) current.weight += sumColumn([row], weightCol);
    groups.set(key, current);
  });

  const totalCount = Array.from(groups.values()).reduce((sum, item) => sum + item.count, 0);
  const totalValue = Array.from(groups.values()).reduce((sum, item) => sum + item.value, 0);
  const totalQty = Array.from(groups.values()).reduce((sum, item) => sum + item.qty, 0);
  const totalWeight = Array.from(groups.values()).reduce((sum, item) => sum + item.weight, 0);
  const baseValue = percentBy === 'count' ? totalCount : percentBy === 'weight' ? totalWeight : totalValue;

  const rows = Array.from(groups.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .map(([key, item]) => {
      const percent = baseValue > 0 ? (percentBy === 'count' ? item.count / baseValue : percentBy === 'weight' ? item.weight / baseValue : item.value / baseValue) * 100 : 0;
      const row: Record<string, unknown> = {
        [groupHeader]: key,
        Guías: item.count,
      };
      if (validQty) row.Piezas = item.qty;
      if (validValue) row.Facturado = item.value;
      if (validWeight) row['Peso Total'] = item.weight;
      row['%'] = percent;
      return row;
    });

  rows.push({
    [groupHeader]: 'Total general',
    Guías: totalCount,
    ...(validQty ? { Piezas: totalQty } : {}),
    ...(validValue ? { Facturado: totalValue } : {}),
    ...(validWeight ? { 'Peso Total': totalWeight } : {}),
    '%': 100,
  });

  const columns = [groupHeader, 'Guías'];
  if (validQty) columns.push('Piezas');
  if (validValue) columns.push('Facturado');
  if (validWeight) columns.push('Peso Total');
  columns.push('%');

  const section = createTableSection(sheetName, columns, label) as TableSection;
  section.rows = rows;
  section.showTotals = false;
  section.totalColumns = [];
  section.highlightTotals = true;
  section.alternateRows = true;
  section.headerColor = '#0070C0';
  return section;
}

function buildSummaryTable(
  data: any[][],
  sheetName: string,
  title: string,
  valueCol: number,
  qtyCol: number,
  dateCol: number | null
): TableSection {
  const totalCount = data.length;
  const totalValue = valueCol >= 0 ? sumColumn(data, valueCol) : 0;
  const totalQty = qtyCol >= 0 ? sumColumn(data, qtyCol) : 0;
  const periodLabel = getDateRangeLabel(data, dateCol);
  const section = createTableSection(sheetName, ['Fecha', 'Guías', 'Piezas', 'Facturado'], title) as TableSection;
  section.rows = [
    {
      Fecha: periodLabel,
      Guías: totalCount,
      Piezas: totalQty,
      Facturado: totalValue,
    },
    {
      Fecha: 'Total general',
      Guías: totalCount,
      Piezas: totalQty,
      Facturado: totalValue,
    },
  ];
  section.showTotals = false;
  section.totalColumns = [];
  section.highlightTotals = true;
  section.alternateRows = true;
  section.headerColor = '#0070C0';
  return section;
}

export function analyzeTransactionalData(
  rawData: any[][],
  headers: string[],
  sheetName: string
): ReportSection[] {
  if (!isTransactionalData(headers, rawData)) return [];

  const valueCol = detectValueColumn(headers);
  const qtyCol = detectQuantityColumn(headers);
  const weightCol = detectWeightColumn(headers);
  const dateCol = detectDateColumn(headers);
  const groupColumns = detectGroupColumns(headers, rawData);

  const sections: ReportSection[] = [];

  const kpiMetrics = [
    {
      label: 'Total Guías',
      field: headers[0] || 'Nro',
      aggregation: 'count',
    },
  ];

  if (valueCol >= 0) {
    kpiMetrics.push({
      label: 'Total Facturado',
      field: headers[valueCol],
      aggregation: 'sum',
    });
  }

  if (qtyCol >= 0) {
    kpiMetrics.push({
      label: 'Total Piezas',
      field: headers[qtyCol],
      aggregation: 'sum',
    });
  }

  if (weightCol !== null) {
    kpiMetrics.push({
      label: 'Peso Total',
      field: headers[weightCol],
      aggregation: 'sum',
    });
  }

  if (kpiMetrics.length > 0) {
    sections.push(createKpiSection(sheetName, kpiMetrics));
  }

  sections.push(buildSummaryTable(rawData, sheetName, 'Facturación Total', valueCol, qtyCol, dateCol));

  const primaryGroupIndex = groupColumns.findIndex((header) => {
    const normalized = normalizeHeader(header);
    return ['servicio', 'tipo', 'categoria', 'localidad', 'destino'].some((candidate) => normalized.includes(candidate));
  });

  if (primaryGroupIndex >= 0) {
    const primaryHeader = groupColumns[primaryGroupIndex];
    const groupByCol = headers.findIndex((header) => header === primaryHeader);
    if (groupByCol >= 0) {
      sections.push(generateGroupedTable(rawData, headers, groupByCol, valueCol, `Distribución por ${primaryHeader}`, sheetName, qtyCol, weightCol, 'value'));
      if (weightCol !== null) {
        sections.push(generateGroupedTable(rawData, headers, groupByCol, valueCol, `Pesos por ${primaryHeader}`, sheetName, qtyCol, weightCol, 'weight'));
      }
    }
  }

  const secondaryGroupIndex = groupColumns.findIndex((header) => {
    const normalized = normalizeHeader(header);
    return ['driver', 'transportista', 'operador', 'carrier'].some((candidate) => normalized.includes(candidate));
  });

  if (secondaryGroupIndex >= 0) {
    const secondaryHeader = groupColumns[secondaryGroupIndex];
    const groupByCol = headers.findIndex((header) => header === secondaryHeader);
    if (groupByCol >= 0) {
      sections.push(generateGroupedTable(rawData, headers, groupByCol, valueCol, `Distribución por ${secondaryHeader}`, sheetName, qtyCol, weightCol, 'count'));
    }
  }

  return sections;
}
