/**
 * Tipos para secciones dinámicas del reporte
 */

export type SectionType = 'table' | 'kpi' | 'chart' | 'text' | 'detail';

export type ChartType = 'bar' | 'line' | 'pie' | 'donut';

export type AggregationType = 'sum' | 'avg' | 'count' | 'max' | 'min' | 'none';

export interface BaseSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
}

export interface TableSection extends BaseSection {
  type: 'table';
  sourceSheet: string;
  columns: string[];
  rows?: Record<string, unknown>[];
  groupBy?: string;
  showTotals: boolean;
  totalColumns: string[];
  highlightTotals: boolean;
  alternateRows: boolean;
  headerColor: string;
  hiddenColumns?: string[];
}

export interface KpiMetric {
  id: string;
  label: string;
  field: string;
  aggregation: AggregationType;
  prefix?: string;
  suffix?: string;
  decimals: number;
  format?: 'number' | 'raw' | 'percent' | 'currency';
  comparisonField?: string;
  comparisonValue?: number;
}

export interface KpiSection extends BaseSection {
  type: 'kpi';
  metrics: KpiMetric[];
  sourceSheet: string;
  layout: 'horizontal' | 'grid';
  hiddenMetricIds?: string[];
}

export interface ChartSection extends BaseSection {
  type: 'chart';
  chartType: ChartType;
  sourceSheet: string;
  xColumn: string;
  yColumns: string[];
  showLegend: boolean;
  showGridLines: boolean;
  colors: string[];
  chartData?: { label: string; value: number }[];
}

// Tabla detallada agrupada por categoría (ej: artículos entregados por Driver)
export interface DetailSection extends BaseSection {
  type: 'detail';
  sourceSheet: string;
  groupByColumn: string;       // columna de agrupación (ej: "Driver")
  displayColumns: string[];    // columnas a mostrar en el detalle
  headerColor: string;
  rows: Record<string, any>[];  // filas crudas del sheet
  hiddenColumns?: string[];
}

export interface TextSection extends BaseSection {
  type: 'text';
  content: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontWeight: 'normal' | 'medium' | 'bold';
}

export type ReportSection = TableSection | KpiSection | ChartSection | TextSection | DetailSection;

export interface SectionTemplate {
  type: SectionType;
  defaultConfig: Partial<ReportSection>;
}
