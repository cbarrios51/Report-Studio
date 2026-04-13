import { BarChart3, Trash2, Plus, X } from 'lucide-react';
import type { KpiSection as KpiSectionType, KpiMetric, ReportSection } from '@/types/sections';
import type { ExcelSheet } from '@/types/excel';

interface KpiSectionProps {
  section: KpiSectionType;
  sheets: ExcelSheet[];
  onUpdate: (updates: Partial<ReportSection>) => void;
  onDelete: () => void;
}

export function KpiSection({
  section,
  sheets,
  onUpdate,
  onDelete,
}: KpiSectionProps) {
  const currentSheet = sheets.find(s => s.name === section.sourceSheet);
  const numericColumns = currentSheet?.headers.filter(
    h => currentSheet.columnTypes[h] === 'number'
  ) || [];

  const handleAddMetric = () => {
    const newMetric: KpiMetric = {
      id: crypto.randomUUID(),
      label: 'Nueva Métrica',
      field: numericColumns[0] || '',
      aggregation: 'sum',
      decimals: 2,
    };
    onUpdate({ metrics: [...section.metrics, newMetric] } as Partial<ReportSection>);
  };

  const handleUpdateMetric = (metricId: string, updates: Partial<KpiMetric>) => {
    const newMetrics = section.metrics.map(m =>
      m.id === metricId ? { ...m, ...updates } : m
    );
    onUpdate({ metrics: newMetrics } as Partial<ReportSection>);
  };

  const handleRemoveMetric = (metricId: string) => {
    const newMetrics = section.metrics.filter(m => m.id !== metricId);
    onUpdate({ metrics: newMetrics } as Partial<ReportSection>);
  };

  const handleMoveMetric = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= section.metrics.length) return;

    const newMetrics = [...section.metrics];
    const [removed] = newMetrics.splice(index, 1);
    newMetrics.splice(newIndex, 0, removed);
    onUpdate({ metrics: newMetrics } as Partial<ReportSection>);
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value } as Partial<ReportSection>)}
            className="bg-transparent text-white font-medium text-lg border-b border-transparent hover:border-dark-600 focus:border-primary focus:outline-none px-2 py-1"
          />
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Eliminar sección"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Configuración */}
      <div className="space-y-4">
        {/* Hoja fuente */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Hoja de datos</label>
          <select
            value={section.sourceSheet}
            onChange={(e) => onUpdate({ sourceSheet: e.target.value } as Partial<ReportSection>)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
          >
            {sheets.map((sheet) => (
              <option key={sheet.name} value={sheet.name}>
                {sheet.name}
              </option>
            ))}
          </select>
        </div>

        {/* Layout */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Layout</label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ layout: 'horizontal' } as Partial<ReportSection>)}
              className={`
                flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors
                ${section.layout === 'horizontal'
                  ? 'bg-primary text-white'
                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                }
              `}
            >
              Horizontal (4 por fila)
            </button>
            <button
              onClick={() => onUpdate({ layout: 'grid' } as Partial<ReportSection>)}
              className={`
                flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors
                ${section.layout === 'grid'
                  ? 'bg-primary text-white'
                  : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                }
              `}
            >
              Grid (2x2)
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-dark-400">Métricas KPI</label>
            <button
              onClick={handleAddMetric}
              className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          <div className="space-y-3">
            {section.metrics.map((metric, index) => (
              <div
                key={metric.id}
                className="bg-dark-700/30 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">KPI #{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveMetric(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveMetric(index, 'down')}
                      disabled={index === section.metrics.length - 1}
                      className="p-1 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveMetric(metric.id)}
                      className="p-1 text-dark-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Etiqueta</label>
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => handleUpdateMetric(metric.id, { label: e.target.value })}
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Campo</label>
                    <select
                      value={metric.field}
                      onChange={(e) => handleUpdateMetric(metric.id, { field: e.target.value })}
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">Seleccionar...</option>
                      {numericColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Agregación</label>
                    <select
                      value={metric.aggregation}
                      onChange={(e) =>
                        handleUpdateMetric(metric.id, { aggregation: e.target.value as KpiMetric['aggregation'] })
                      }
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="sum">Suma</option>
                      <option value="avg">Promedio</option>
                      <option value="count">Conteo</option>
                      <option value="max">Máximo</option>
                      <option value="min">Mínimo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Decimales</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={metric.decimals}
                      onChange={(e) => handleUpdateMetric(metric.id, { decimals: parseInt(e.target.value) || 0 })}
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Prefijo (opcional)</label>
                    <input
                      type="text"
                      value={metric.prefix || ''}
                      onChange={(e) => handleUpdateMetric(metric.id, { prefix: e.target.value })}
                      placeholder="$"
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">Sufijo (opcional)</label>
                    <input
                      type="text"
                      value={metric.suffix || ''}
                      onChange={(e) => handleUpdateMetric(metric.id, { suffix: e.target.value })}
                      placeholder="%"
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {section.metrics.length === 0 && (
            <div className="text-center py-8 text-dark-400 bg-dark-700/30 rounded-lg">
              <p>No hay métricas configuradas</p>
              <button
                onClick={handleAddMetric}
                className="mt-2 text-primary hover:text-primary-light transition-colors"
              >
                + Agregar primera métrica
              </button>
            </div>
          )}

          {section.metrics.length >= 4 && (
            <p className="text-sm text-orange-400">
              Máximo recomendado: 4 KPIs por fila para mejor visualización
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
