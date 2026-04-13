/**
 * Sistema de plantillas de reporte (save/load en localStorage)
 *
 * Estrategia de matching (v4):
 *   - Cada sección tiene un ID con formato "NombreHoja__base-id" (ej: "Hoja1__kpi-summary")
 *   - La plantilla guarda los IDs COMPLETOS que estaban VISIBLES al guardar.
 *     Usar IDs completos (con prefijo de hoja) permite distinguir correctamente secciones
 *     homónimas de distintas hojas (ej: "Export__kpi-summary" vs "Import VE COL__kpi-summary").
 *   - Al aplicar: match exacto por ID completo → si no hay match exacto, fallback a base ID.
 *   - Secciones sin match en ninguno de los dos → ocultas (no estaban visibles al guardar).
 */

import type { ReportSection } from '@/types/sections';
import type { ReportMeta } from '@/hooks/useReportStudio';

export interface SectionOverride {
  hiddenColumns?: string[];
  hiddenMetricIds?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  savedAt: string;
  meta: ReportMeta;
  /**
   * IDs completos (SheetName__base-id) de las secciones que estaban visibles al guardar.
   * Reemplaza al campo visibleBaseIds de v3 para soportar múltiples hojas correctamente.
   */
  visibleIds: string[];
  /** Configuración de columnas/métricas ocultas, indexada por ID completo */
  overrides: Record<string, SectionOverride>;
}

const STORAGE_KEY = 'report-studio-templates-v4';

/** Extrae el base ID de un section.id (quita el prefijo "Hoja__") */
function baseId(id: string): string {
  const sep = id.indexOf('__');
  return sep >= 0 ? id.slice(sep + 2) : id;
}

export function loadTemplates(): ReportTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistTemplate(template: ReportTemplate): void {
  const templates = loadTemplates();
  const idx = templates.findIndex(t => t.id === template.id);
  if (idx >= 0) templates[idx] = template;
  else templates.push(template);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function removeTemplate(id: string): void {
  const updated = loadTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Crea una plantilla a partir del estado actual de las secciones.
 * Guarda los IDs completos visibles + configuración de columnas/métricas ocultas.
 *
 * IMPORTANTE: Se deben pasar TODAS las secciones del reporte (incluyendo las ocultas),
 * no solo las visibles. Así la plantilla tiene contexto completo de qué se quiere mostrar.
 */
export function buildTemplate(
  id: string,
  name: string,
  sections: ReportSection[],
  meta: ReportMeta
): ReportTemplate {
  const visibleIds: string[] = [];
  const overrides: Record<string, SectionOverride> = {};

  for (const s of sections) {
    if (s.visible) visibleIds.push(s.id);

    const override: SectionOverride = {};
    if ('hiddenColumns' in s && (s as any).hiddenColumns?.length) {
      override.hiddenColumns = (s as any).hiddenColumns;
    }
    if ('hiddenMetricIds' in s && (s as any).hiddenMetricIds?.length) {
      override.hiddenMetricIds = (s as any).hiddenMetricIds;
    }
    if (Object.keys(override).length) overrides[s.id] = override;
  }

  return { id, name, savedAt: new Date().toISOString(), meta, visibleIds, overrides };
}

/**
 * Aplica la plantilla a las secciones de un nuevo reporte.
 *
 * Matching por prioridad:
 *   1. Coincidencia exacta de ID completo (SheetName__base-id) → para mismo archivo mes siguiente
 *   2. Coincidencia por base ID (sin prefijo de hoja) → fallback para archivos con hojas renombradas
 *   3. Sin coincidencia → visible: false
 */
export function applyTemplateToSections(
  sections: ReportSection[],
  template: ReportTemplate
): ReportSection[] {
  // Conjunto de IDs completos visibles (para match exacto O(1))
  const visibleIdSet = new Set(template.visibleIds);
  // Conjunto de base IDs visibles (para fallback)
  const visibleBaseIdSet = new Set(template.visibleIds.map(id => baseId(id)));

  return sections.map(s => {
    // 1. Match exacto por ID completo
    if (visibleIdSet.has(s.id)) {
      const override = template.overrides[s.id];
      const updated: any = { ...s, visible: true };
      if (override?.hiddenColumns !== undefined) updated.hiddenColumns = override.hiddenColumns;
      if (override?.hiddenMetricIds !== undefined) updated.hiddenMetricIds = override.hiddenMetricIds;
      return updated as ReportSection;
    }

    // 2. Fallback: match por base ID (útil si el nombre de hoja cambió)
    const bid = baseId(s.id);
    // Solo usar fallback si hay UNA sola sección con ese base ID en el template
    // (evitar aplicar visibilidad incorrecta cuando múltiples hojas tienen el mismo tipo de sección)
    const matchingFull = template.visibleIds.filter(vid => baseId(vid) === bid);
    if (matchingFull.length === 1 && visibleBaseIdSet.has(bid)) {
      const override = template.overrides[matchingFull[0]] ?? template.overrides[bid];
      const updated: any = { ...s, visible: true };
      if (override?.hiddenColumns !== undefined) updated.hiddenColumns = override.hiddenColumns;
      if (override?.hiddenMetricIds !== undefined) updated.hiddenMetricIds = override.hiddenMetricIds;
      return updated as ReportSection;
    }

    // 3. Sin match → ocultar (no estaba visible cuando se guardó la plantilla)
    return { ...s, visible: false } as ReportSection;
  });
}

export function generateTemplateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Legacy compat exports ────────────────────────────────────────────────────
import type { ReportSection as RSType } from '@/types/sections';
export type { ReportTemplate as TemplateSlot };

export const saveTemplate = persistTemplate;
export const getSavedTemplates = loadTemplates;
export const deleteTemplate = removeTemplate;
export const loadTemplate = (id: string): ReportTemplate | null =>
  loadTemplates().find(t => t.id === id) ?? null;

export const createDefaultTemplate = () => ({ context: {}, theme: {}, sections: [], analysisMode: 'auto', createdAt: new Date(), updatedAt: new Date() });
export const createTableSection  = (sheetName: string, headers: string[], title?: string): RSType => ({ id: crypto.randomUUID(), type: 'table', title: title ?? `Tabla de ${sheetName}`, visible: true, sourceSheet: sheetName, columns: headers, showTotals: false, totalColumns: [], highlightTotals: true, alternateRows: true, headerColor: '#0070C0' });
export const createKpiSection    = (sheetName: string): RSType => ({ id: crypto.randomUUID(), type: 'kpi', title: 'KPIs', visible: true, sourceSheet: sheetName, layout: 'horizontal', metrics: [] });
export const createChartSection  = (sheetName: string, xColumn: string, yColumns: string[], title?: string): RSType => ({ id: crypto.randomUUID(), type: 'chart', title: title ?? `Gráfico de ${xColumn}`, visible: true, sourceSheet: sheetName, chartType: 'bar', xColumn, yColumns, showLegend: true, showGridLines: true, colors: ['#0070C0'] });
export const createTextSection   = (content = '', title = 'Texto'): RSType => ({ id: crypto.randomUUID(), type: 'text', title, visible: true, content, textAlign: 'left', fontSize: 'base', fontWeight: 'normal' });
