/**
 * Hook para generación automática de reportes
 */

import { useMemo } from 'react';
import type { ExcelFile } from '@/types/excel';
import type { ReportSection } from '@/types/sections';
import type { ReportSection as AutoReportSection } from '@/utils/autoReport';
import { buildAutoReport } from '@/utils/autoReport';

interface UseAutoDetectReturn {
  generatedSections: ReportSection[];
  hasTabularData: boolean;
  suggestedTitle: string;
}

function deriveMetricField(label: string, headers: string[]) {
  if (label.toLowerCase() === 'total registros') {
    return headers[0] ?? ''
  }

  const match = label.match(/Total\s+(.+)$/i)
  if (match) {
    const fieldName = match[1].trim()
    if (headers.includes(fieldName)) return fieldName
  }

  return headers[0] ?? ''
}

function mapAutoSectionToInternal(section: AutoReportSection, sheet: any): ReportSection {
  switch (section.type) {
    case 'kpi':
      return {
        id: section.id,
        type: 'kpi',
        title: section.title,
        visible: true,
        sourceSheet: sheet.name,
        layout: 'horizontal',
        metrics: section.kpis?.map((kpi, index) => ({
          id: `${section.id}-metric-${index}`,
          label: kpi.label,
          field: deriveMetricField(kpi.label, sheet.headers),
          aggregation: kpi.format === 'number' ? 'sum' : 'count',
          decimals: kpi.format === 'raw' ? 0 : 2,
        })) ?? [],
      };

    case 'table':
      return {
        id: section.id,
        type: 'table',
        title: section.title,
        visible: true,
        sourceSheet: sheet.name,
        columns: section.tableHeaders ?? [],
        rows: section.tableRows ?? [],
        showTotals: false,
        totalColumns: [],
        highlightTotals: true,
        alternateRows: true,
        headerColor: '#0070C0',
      };

    case 'chart':
      return {
        id: section.id,
        type: 'chart',
        title: section.title,
        visible: true,
        sourceSheet: sheet.name,
        chartType: section.chartType ?? 'bar',
        xColumn: 'label',
        yColumns: ['value'],
        showLegend: true,
        showGridLines: true,
        colors: ['#0070C0', '#0099ff', '#00ccff', '#00ffff'],
        chartData: section.chartData,
      };

    default:
      return {
        id: section.id,
        type: 'text',
        title: section.title,
        visible: true,
        content: '',
        textAlign: 'left',
        fontSize: 'base',
        fontWeight: 'normal',
      };
  }
}

export function useAutoDetect(excelFile: ExcelFile | null): UseAutoDetectReturn {
  const generatedSections = useMemo(() => {
    if (!excelFile) return [];
    return excelFile.sheets.flatMap((sheet) => {
      if (!sheet.parsedSheet) return [];
      return buildAutoReport(sheet.parsedSheet).map((section) => mapAutoSectionToInternal(section, sheet));
    });
  }, [excelFile]);

  const hasTabularData = useMemo(() => {
    if (!excelFile) return false;
    return excelFile.sheets.some(sheet => sheet.isTabular);
  }, [excelFile]);

  const suggestedTitle = useMemo(() => {
    if (!excelFile || excelFile.sheets.length === 0) return 'Reporte';
    const firstSheet = excelFile.sheets[0];
    if (firstSheet.metadata?.title) return String(firstSheet.metadata.title);
    return `Reporte ${excelFile.name.replace(/\.(xlsx|xls)$/i, '')}`;
  }, [excelFile]);

  return {
    generatedSections,
    hasTabularData,
    suggestedTitle,
  };
}
