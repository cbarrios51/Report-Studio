import { Table, Trash2 } from 'lucide-react';
import type { TableSection as TableSectionType, ReportSection } from '@/types/sections';
import type { ExcelSheet } from '@/types/excel';

interface TableSectionProps {
  section: TableSectionType;
  sheets: ExcelSheet[];
  onUpdate: (updates: Partial<ReportSection>) => void;
  onDelete: () => void;
}

export function TableSection({
  section,
  sheets,
  onUpdate,
  onDelete,
}: TableSectionProps) {
  const currentSheet = sheets.find(s => s.name === section.sourceSheet);
  const availableColumns = currentSheet?.headers || [];

  const handleToggleColumn = (column: string) => {
    const newColumns = section.columns.includes(column)
      ? section.columns.filter(c => c !== column)
      : [...section.columns, column];
    onUpdate({ columns: newColumns } as Partial<ReportSection>);
  };

  const handleToggleTotalColumn = (column: string) => {
    const newTotalColumns = section.totalColumns.includes(column)
      ? section.totalColumns.filter(c => c !== column)
      : [...section.totalColumns, column];
    onUpdate({ totalColumns: newTotalColumns } as Partial<ReportSection>);
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Table className="w-5 h-5 text-primary" />
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

        {/* Columnas a mostrar */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Columnas visibles</label>
          <div className="bg-dark-700/30 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {availableColumns.map((column) => (
              <label
                key={column}
                className="flex items-center gap-3 cursor-pointer hover:bg-dark-700/50 rounded px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={section.columns.includes(column)}
                  onChange={() => handleToggleColumn(column)}
                  className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-dark-300 text-sm">{column}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Agrupar por */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Agrupar por (opcional)</label>
          <select
            value={section.groupBy || ''}
            onChange={(e) => onUpdate({ groupBy: e.target.value || undefined } as Partial<ReportSection>)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none"
          >
            <option value="">Sin agrupamiento</option>
            {availableColumns
              .filter(col => currentSheet?.columnTypes[col] === 'string')
              .map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
          </select>
        </div>

        {/* Columnas para totales */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Columnas con totales</label>
          <div className="bg-dark-700/30 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
            {availableColumns
              .filter(col => currentSheet?.columnTypes[col] === 'number')
              .map((column) => (
                <label
                  key={column}
                  className="flex items-center gap-3 cursor-pointer hover:bg-dark-700/50 rounded px-2 py-1.5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={section.totalColumns.includes(column)}
                    onChange={() => handleToggleTotalColumn(column)}
                    className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-dark-300 text-sm">{column}</span>
                </label>
              ))}
          </div>
        </div>

        {/* Opciones de estilo */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showTotals}
              onChange={(e) => onUpdate({ showTotals: e.target.checked } as Partial<ReportSection>)}
              className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-dark-300 text-sm">Mostrar totales</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={section.highlightTotals}
              onChange={(e) => onUpdate({ highlightTotals: e.target.checked } as Partial<ReportSection>)}
              className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-dark-300 text-sm">Resaltar totales</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={section.alternateRows}
              onChange={(e) => onUpdate({ alternateRows: e.target.checked } as Partial<ReportSection>)}
              className="w-4 h-4 rounded border-dark-600 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-dark-300 text-sm">Filas alternadas</span>
          </label>
        </div>

        {/* Color de encabezado */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Color de encabezado</label>
          <div className="flex gap-2">
            {['#0070C0', '#059669', '#ea580c', '#0891b2'].map((color) => (
              <button
                key={color}
                onClick={() => onUpdate({ headerColor: color } as Partial<ReportSection>)}
                className={`
                  w-10 h-10 rounded-lg transition-all
                  ${section.headerColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800 scale-110' : ''}
                `}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={section.headerColor}
              onChange={(e) => onUpdate({ headerColor: e.target.value } as Partial<ReportSection>)}
              className="w-10 h-10 rounded-lg bg-dark-700 border border-dark-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
