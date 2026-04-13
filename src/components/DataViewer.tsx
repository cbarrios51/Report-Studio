import React from 'react';
import type { ExcelSheet } from '@/types/excel';

interface DataViewerProps {
  sheets: ExcelSheet[];
}

export function DataViewer({ sheets }: DataViewerProps) {
  const [activeSheet, setActiveSheet] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 50;

  const sheet = sheets[activeSheet];

  const filteredRows = React.useMemo(() => {
    if (!sheet) return [];
    if (!search.trim()) return sheet.data;
    const q = search.toLowerCase();
    return sheet.data.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [sheet, search]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when sheet or search changes
  React.useEffect(() => { setPage(0); }, [activeSheet, search]);

  if (!sheets.length) return null;

  return (
    <div className="flex flex-col h-full bg-dark-950">
      {/* Sheet tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-dark-700 flex-shrink-0 overflow-x-auto">
        {sheets.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActiveSheet(i)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeSheet === i
                ? 'bg-white text-gray-800 border border-b-white border-gray-200 -mb-px'
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            {s.name}
            <span className="ml-1.5 text-dark-500 text-[10px]">
              ({s.data.length})
            </span>
          </button>
        ))}
      </div>

      {/* Search + stats bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar en los datos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-white placeholder-dark-500 focus:border-primary focus:outline-none w-56"
          />
          {search && (
            <span className="text-xs text-dark-400">
              {filteredRows.length} resultado{filteredRows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-dark-400">
          <span>{sheet?.headers.length ?? 0} columnas</span>
          <span>·</span>
          <span>{sheet?.data.length ?? 0} filas</span>
          {totalPages > 1 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2 py-0.5 bg-dark-700 rounded hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                <span>{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-0.5 bg-dark-700 rounded hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {!sheet || sheet.headers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-dark-500 text-sm">
            Sin datos en esta hoja
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left text-dark-500 bg-dark-800 border-b border-dark-700 font-medium w-10 min-w-[2.5rem]">
                  #
                </th>
                {sheet.headers.map(h => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-dark-300 bg-dark-800 border-b border-dark-700 font-semibold whitespace-nowrap"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span>{h}</span>
                      <span className="text-[10px] text-dark-600 font-normal">
                        {sheet.columnTypes?.[h] === 'number' ? '123' : 'Abc'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, rowIdx) => {
                const globalIdx = page * PAGE_SIZE + rowIdx;
                return (
                  <tr
                    key={globalIdx}
                    className="border-b border-dark-800 hover:bg-dark-800/60 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-dark-600 text-right tabular-nums select-none">
                      {globalIdx + 1}
                    </td>
                    {sheet.headers.map(h => {
                      const val = row[h];
                      const isNum = typeof val === 'number';
                      const isEmpty = val === null || val === undefined || val === '';
                      return (
                        <td
                          key={h}
                          className={`px-3 py-1.5 whitespace-nowrap tabular-nums ${
                            isEmpty
                              ? 'text-dark-600 italic'
                              : isNum
                              ? 'text-right text-emerald-400'
                              : 'text-dark-200'
                          }`}
                        >
                          {isEmpty
                          ? '—'
                          : isNum
                          ? Number.isInteger(val)
                            ? String(val)
                            : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={sheet.headers.length + 1}
                    className="px-4 py-12 text-center text-dark-500"
                  >
                    No se encontraron resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
