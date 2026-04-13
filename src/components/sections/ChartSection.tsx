import { BarChart3, Trash2 } from 'lucide-react';
import type { ChartSection as ChartSectionType, ReportSection, ChartType } from '@/types/sections';
import type { ExcelSheet } from '@/types/excel';

interface ChartSectionProps {
  section: ChartSectionType;
  sheets: ExcelSheet[];
  onUpdate: (updates: Partial<ReportSection>) => void;
  onDelete: () => void;
}

export function ChartSection({
  section,
  sheets,
  onUpdate,
  onDelete,
}: ChartSectionProps) {
  const currentSheet = sheets.find(s => s.name === section.sourceSheet);
  const categoryColumns = currentSheet?.headers.filter(
    h => ['string', 'date'].includes(currentSheet.columnTypes[h])
  ) || [];
  const numericColumns = currentSheet?.headers.filter(
    h => currentSheet.columnTypes[h] === 'number'
  ) || [];

  const chartTypes: { value: ChartType; label: string; icon: string }[] = [
    { value: 'bar', label: 'Barras', icon: '📊' },
    { value: 'line', label: 'Líneas', icon: '📈' },
    { value: 'pie', label: 'Circular', icon: '🥧' },
    { value: 'donut', label: 'Donut', icon: '🍩' },
  ];

  const presetColors = [
    ['#0070C0', '#0099ff', '#00ccff', '#00ffff', '#66e5ff'],
    ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
    ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  ];

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
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

        {/* Tipo de gráfico */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Tipo de gráfico</label>
          <div className="grid grid-cols-4 gap-2">
            {chartTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => onUpdate({ chartType: type.value } as Partial<ReportSection>)}
                className={`
                  flex flex-col items-center gap-1 py-3 px-2 rounded-lg font-medium transition-all
                  ${section.chartType === type.value
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                  }
                `}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-xs">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Columna X (categorías) */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Eje X (Categorías)</label>
          <select
            value={section.xColumn}
            onChange={(e) => onUpdate({ xColumn: e.target.value } as Partial<ReportSection>)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
          >
            <option value="">Seleccionar columna...</option>
            {categoryColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Columnas Y (valores) */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Eje Y (Valores)</label>
          <div className="bg-dark-700/30 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {numericColumns.map((column) => (
              <label
                key={column}
                className="flex items-center gap-3 cursor-pointer hover:bg-dark-700/50 rounded px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={section.yColumns.includes(column)}
                  onChange={(e) => {
                    const newYColumns = e.target.checked
                      ? [...section.yColumns, column]
                      : section.yColumns.filter(c => c !== column);
                    onUpdate({ yColumns: newYColumns } as Partial<ReportSection>);
                  }}
                  className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-dark-300 text-sm">{column}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Opciones de visualización */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showLegend}
              onChange={(e) => onUpdate({ showLegend: e.target.checked } as Partial<ReportSection>)}
              className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-dark-300 text-sm">Mostrar leyenda</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showGridLines}
              onChange={(e) => onUpdate({ showGridLines: e.target.checked } as Partial<ReportSection>)}
              className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-dark-300 text-sm">Líneas de grilla</span>
          </label>
        </div>

        {/* Colores */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Paleta de colores</label>
          <div className="space-y-2">
            {presetColors.map((colors, index) => (
              <button
                key={index}
                onClick={() => onUpdate({ colors } as Partial<ReportSection>)}
                className={`
                  w-full h-8 rounded-lg flex overflow-hidden transition-all
                  ${JSON.stringify(section.colors) === JSON.stringify(colors) ? 'ring-2 ring-primary ring-offset-2 ring-offset-dark-800' : ''}
                `}
              >
                {colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
