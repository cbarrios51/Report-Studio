import { FileSpreadsheet, Table, AlertCircle } from 'lucide-react';
import type { ExcelFile } from '@/types/excel';

interface SheetSelectorProps {
  excelFile: ExcelFile | null;
  selectedSheet: string | null;
  onSelectSheet: (sheetName: string) => void;
}

export function SheetSelector({
  excelFile,
  selectedSheet,
  onSelectSheet,
}: SheetSelectorProps) {
  if (!excelFile) {
    return null;
  }

  const hasMultipleSheets = excelFile.sheets.length > 1;
  const tabularSheets = excelFile.sheets.filter(s => s.isTabular);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Hojas del Excel
        </h3>
        <span className="text-sm text-dark-400">
          {excelFile.sheets.length} {excelFile.sheets.length === 1 ? 'hoja' : 'hojas'}
        </span>
      </div>

      {/* Tabs de hojas */}
      <div className={`flex gap-2 ${hasMultipleSheets ? 'flex-wrap' : ''}`}>
        {excelFile.sheets.map((sheet) => (
          <button
            key={sheet.name}
            onClick={() => onSelectSheet(sheet.name)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium
              transition-all duration-200
              ${
                selectedSheet === sheet.name
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
              }
            `}
          >
            <Table className="w-4 h-4" />
            {sheet.name}
            {sheet.isTabular && (
              <span
                className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${
                    selectedSheet === sheet.name
                      ? 'bg-white/20 text-white'
                      : 'bg-green-500/20 text-green-400'
                  }
                `}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Información de hojas tabulares */}
      {tabularSheets.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 text-sm font-medium">
              {tabularSheets.length} {tabularSheets.length === 1 ? 'hoja con' : 'hojas con'} datos tabulares detectados
            </p>
            <p className="text-dark-400 text-sm mt-1">
              {tabularSheets.map(s => s.name).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
