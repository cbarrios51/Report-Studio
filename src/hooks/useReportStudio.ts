/**
 * Hook central del Report Studio
 * Maneja: carga de archivo, análisis automático, gestión de secciones
 */

import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import type { ExcelFile, ExcelSheet } from '@/types/excel';
import type { ReportSection } from '@/types/sections';
import { parseSheet } from '@/utils/excelParser';
import { buildAutoReport } from '@/utils/autoReport';

export type AppPhase = 'upload' | 'analyzing' | 'studio';

export interface ReportMeta {
  title: string;
  subtitle: string;
  period: string;
  company: string;
}

// Mapea secciones del autoReport al formato interno
function mapSections(parsedSheet: ReturnType<typeof parseSheet>, sheetName: string): ReportSection[] {
  const autoSections = buildAutoReport(parsedSheet);
  return autoSections.map((section) => {
    switch (section.type) {
      case 'kpi':
        return {
          id: section.id,
          type: 'kpi' as const,
          title: section.title,
          visible: true,
          sourceSheet: sheetName,
          layout: 'horizontal' as const,
          metrics: (section.kpis ?? []).map((kpi, i) => {
            // Encontrar campo correspondiente en las columnas
            const numCols = parsedSheet.columns.filter(c => c.type === 'numeric');
            const field = numCols[i - 1]?.name ?? parsedSheet.columns[0]?.name ?? '';
            return {
              id: `${section.id}-m${i}`,
              label: kpi.label,
              field: i === 0 ? (parsedSheet.columns[0]?.name ?? '') : field,
              aggregation: (i === 0 ? 'count' : 'sum') as 'count' | 'sum',
              decimals: kpi.format === 'raw' || kpi.format === 'number' ? 0 : 2,
              format: kpi.format,
              prefix: kpi.format === 'currency' ? '$' : undefined,
            };
          }),
        };
      case 'table':
        return {
          id: section.id,
          type: 'table' as const,
          title: section.title,
          visible: true,
          sourceSheet: sheetName,
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
          type: 'chart' as const,
          title: section.title,
          visible: true,
          sourceSheet: sheetName,
          chartType: (section.chartType ?? 'bar') as 'bar' | 'pie' | 'line' | 'donut',
          xColumn: 'label',
          yColumns: ['value'],
          showLegend: true,
          showGridLines: true,
          colors: ['#0070C0', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
          chartData: section.chartData,
        };
      case 'detail':
        return {
          id: section.id,
          type: 'detail' as const,
          title: section.title,
          visible: false, // oculta por defecto — el usuario la activa si la quiere
          sourceSheet: sheetName,
          groupByColumn: section.groupByColumn ?? '',
          displayColumns: section.displayColumns ?? [],
          headerColor: '#0070C0',
          rows: section.detailRows ?? [],
        };
      default:
        return {
          id: section.id,
          type: 'text' as const,
          title: section.title,
          visible: true,
          content: '',
          textAlign: 'left' as const,
          fontSize: 'base' as const,
          fontWeight: 'normal' as const,
        };
    }
  });
}

export function useReportStudio() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [excelFile, setExcelFile] = useState<ExcelFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [meta, setMeta] = useState<ReportMeta>({
    title: 'Reporte',
    subtitle: '',
    period: '',
    company: '',
  });

  // Cargar archivo Excel
  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setPhase('analyzing');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellText: true,
      });

      const sheets: ExcelSheet[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const parsed = parseSheet(worksheet);

        const columnTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'> = {};
        parsed.headers.forEach((header) => {
          const col = parsed.columns.find(c => c.name === header);
          columnTypes[header] = col?.type === 'numeric' ? 'number' : 'string';
        });

        sheets.push({
          name: sheetName,
          data: parsed.rows,
          headers: parsed.headers,
          isTabular: parsed.rows.length >= 2 && parsed.headers.length >= 2,
          columnTypes,
          metadata: {
            title: parsed.metadata.title,
            subtitle: null,
            period: parsed.metadata.period,
          },
          parsedSheet: parsed,
        });
      }

      const excelFileData: ExcelFile = {
        name: file.name,
        sheets,
        uploadedAt: new Date(),
      };

      setExcelFile(excelFileData);

      // Auto-detectar título y período
      const firstSheet = sheets[0];
      const detectedTitle = firstSheet?.metadata?.title
        ? String(firstSheet.metadata.title)
        : file.name.replace(/\.(xlsx|xls)$/i, '');
      const detectedPeriod = firstSheet?.metadata?.period
        ? String(firstSheet.metadata.period)
        : '';

      setMeta({
        title: detectedTitle,
        subtitle: '',
        period: detectedPeriod,
        company: '',
      });

      // Generar secciones de TODAS las hojas (prefijo de hoja para IDs únicos)
      const allSections: ReportSection[] = [];
      for (const sheet of sheets) {
        if (!sheet.parsedSheet) continue;
        const sheetSections = mapSections(sheet.parsedSheet, sheet.name);
        // Hacer IDs únicos por hoja para evitar colisiones entre hojas
        const prefixed = sheetSections.map(s => {
          // Si hay más de una hoja, añadir el nombre de hoja al título del KPI para distinguirlos
          const title = sheets.length > 1 && s.type === 'kpi' && s.title === 'Resumen General'
            ? `Resumen General · ${sheet.name}`
            : s.title;
          return { ...s, id: `${sheet.name}__${s.id}`, title };
        });
        allSections.push(...prefixed);
      }

      setSections(allSections);
      setPhase('studio');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error leyendo el archivo';
      setError(msg);
      setPhase('upload');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle visibilidad de sección
  const toggleSection = useCallback((id: string) => {
    setSections(prev =>
      prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    );
  }, []);

  // Reordenar secciones
  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    setSections(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  // Actualizar una sección
  const updateSection = useCallback((id: string, updates: Partial<ReportSection>) => {
    setSections(prev =>
      prev.map(s => s.id === id ? { ...s, ...updates } as ReportSection : s)
    );
  }, []);

  // Eliminar sección
  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setSelectedSectionId(prev => prev === id ? null : prev);
  }, []);

  // Aplicar plantilla: reemplaza secciones y opcionalmente meta
  const applyTemplate = useCallback((newSections: ReportSection[], newMeta: ReportMeta) => {
    setSections(newSections);
    setMeta(newMeta);
  }, []);

  // Resetear todo
  const reset = useCallback(() => {
    setExcelFile(null);
    setSections([]);
    setSelectedSectionId(null);
    setError(null);
    setPhase('upload');
  }, []);

  const visibleSections = useMemo(() => sections.filter(s => s.visible), [sections]);

  return {
    phase,
    excelFile,
    isLoading,
    error,
    sections,
    visibleSections,
    selectedSectionId,
    meta,
    loadFile,
    toggleSection,
    moveSection,
    updateSection,
    removeSection,
    setSelectedSectionId,
    setMeta,
    applyTemplate,
    reset,
  };
}
