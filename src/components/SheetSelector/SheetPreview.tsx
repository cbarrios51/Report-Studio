import React, { useMemo } from 'react';
import { Table as TableIcon, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExcelSheet } from '@/types/excel';
import { formatters } from '@/utils/formatters';

interface SheetPreviewProps {
  sheet: ExcelSheet | null;
  maxRows?: number;
}

export function SheetPreview({ sheet, maxRows = 10 }: SheetPreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const displayRows = useMemo(() => {
    if (!sheet) return [];
    if (isExpanded) return sheet.data;
    return sheet.data.slice(0, maxRows);
  }, [sheet, isExpanded, maxRows]);

  if (!sheet) {
    return (
      <div className="text-center py-12 text-dark-400">
        <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Seleccioná una hoja para ver la vista previa</p>
      </div>
    );
  }

  const hasMoreRows = sheet.data.length > maxRows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Vista Previa: {sheet.name}
        </h3>
        <span className="text-sm text-dark-400">
          {sheet.data.length} filas × {sheet.headers.length} columnas
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-dark-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-700/50">
                {sheet.headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left font-medium text-dark-300 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {displayRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-dark-700/30 transition-colors"
                >
                  {sheet.headers.map((header, colIndex) => {
                    const value = row[header];
                    const columnType = sheet.columnTypes[header];
                    const formattedValue = formatCellValue(value, columnType);

                    return (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-dark-300 whitespace-nowrap"
                      >
                        {formattedValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMoreRows && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-dark-400 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Mostrar {sheet.data.length - maxRows} filas más
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Formatea un valor de celda según su tipo
 */
function formatCellValue(
  value: unknown,
  columnType?: 'string' | 'number' | 'boolean' | 'date'
): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (columnType === 'number' && typeof value === 'number') {
    // Intentar detectar si es moneda o porcentaje
    if (value < 1 && value > -1 && value !== 0) {
      return formatters.percentage(value * 100, 2);
    }
    if (value > 1000) {
      return formatters.number(value, 2);
    }
    return String(value);
  }

  if (columnType === 'date' && value instanceof Date) {
    return formatters.date(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  return String(value);
}
