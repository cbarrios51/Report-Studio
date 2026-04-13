import { useMemo, useState } from 'react';
import { Eye, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExcelSheet } from '@/types/excel';
import type { ReportSection as ReportSectionType } from '@/types/sections';
import { ChartRenderer } from './ChartRenderer';

interface ReportSectionProps {
  section: ReportSectionType;
  sheets: ExcelSheet[];
  editMode?: boolean;
  onToggle?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<ReportSectionType>) => void;
  onRemove?: (id: string) => void;
}

export function ReportSection({ section, sheets, editMode, onToggle, onUpdate, onRemove }: ReportSectionProps) {
  if (!editMode && !section.visible) return null;

  const sheet = 'sourceSheet' in section
    ? sheets.find((s) => s.name === (section as any).sourceSheet) ?? null
    : null;

  const content = (() => {
    switch (section.type) {
      case 'table':  return <TableBlock section={section} sheet={sheet} editMode={editMode} onUpdate={onUpdate} />;
      case 'kpi':    return <KpiBlock section={section} sheet={sheet} editMode={editMode} onUpdate={onUpdate} />;
      case 'chart':  return <ChartBlock section={section} sheet={sheet} />;
      case 'text':   return <TextBlock section={section} />;
      case 'detail': return <DetailBlock section={section} editMode={editMode} onUpdate={onUpdate} />;
      default:       return null;
    }
  })();

  if (!editMode) return <>{content}</>;

  const isHidden = !section.visible;

  return (
    <div
      className={`rounded-lg mb-2 transition-all`}
      style={{
        border: isHidden ? '2px dashed #d1d5db' : '2px solid #fbbf24',
        background: isHidden ? '#f9fafb' : 'white',
      }}
    >
      {/* Edit toolbar — always visible in edit mode */}
      <div
        style={{ background: isHidden ? '#f3f4f6' : '#fffbeb', borderBottom: '1px solid', borderColor: isHidden ? '#e5e7eb' : '#fde68a' }}
        className="flex items-center justify-between px-3 py-2 rounded-t-md"
      >
        <span style={{ color: isHidden ? '#9ca3af' : '#92400e', textDecoration: isHidden ? 'line-through' : 'none' }}
          className="text-xs font-semibold truncate max-w-xs">
          {section.title || section.type}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle?.(section.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: isHidden ? '#dcfce7' : '#f9fafb',
              borderColor: isHidden ? '#86efac' : '#d1d5db',
              color: isHidden ? '#15803d' : '#374151',
            }}
          >
            {isHidden ? <Eye style={{ width: 12, height: 12 }} /> : <EyeOff style={{ width: 12, height: 12 }} />}
            {isHidden ? 'Mostrar' : 'Ocultar'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove?.(section.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c',
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} />
            Eliminar
          </button>
        </div>
      </div>

      {/* Section content */}
      <div style={{ opacity: isHidden ? 0.25 : 1, pointerEvents: isHidden ? 'none' : 'auto' }}>
        {content}
      </div>
    </div>
  );
}

// ─── TABLE BLOCK ─────────────────────────────────────────────────────────────

interface TableBlockProps {
  section: ReportSectionType & { type: 'table' };
  sheet: ExcelSheet | null;
  editMode?: boolean;
  onUpdate?: (id: string, updates: Partial<ReportSectionType>) => void;
}

function TableBlock({ section, editMode, onUpdate }: TableBlockProps) {
  const [showColPicker, setShowColPicker] = useState(false);

  const hiddenCols = section.hiddenColumns ?? [];
  const allColumns = section.columns ?? [];

  const { headers, rows } = useMemo(() => {
    if (section.rows && section.rows.length > 0) {
      const visibleCols = allColumns.filter(c => !hiddenCols.includes(c));
      const filteredRows = section.rows.map(r => {
        const filtered: Record<string, unknown> = {};
        visibleCols.forEach(c => { filtered[c] = r[c]; });
        if ('_isTotal' in r) filtered['_isTotal'] = r['_isTotal'];
        return filtered;
      });
      return { headers: visibleCols, rows: filteredRows };
    }
    return { headers: [], rows: [] };
  }, [section, hiddenCols, allColumns]);

  const colAlign = useMemo(() => {
    const result: Record<string, 'left' | 'right'> = {};
    headers.forEach(col => {
      const vals = rows.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      const numCount = vals.filter(v => typeof v === 'number' || /^[\d.,%$-]+$/.test(String(v))).length;
      result[col] = vals.length > 0 && numCount / vals.length > 0.6 ? 'right' : 'left';
    });
    return result;
  }, [headers, rows]);

  const toggleColumn = (col: string) => {
    const current = section.hiddenColumns ?? [];
    const next = current.includes(col) ? current.filter(c => c !== col) : [...current, col];
    onUpdate?.(section.id, { hiddenColumns: next } as any);
  };

  if (allColumns.length === 0) {
    return (
      <div className="mb-8 text-center py-6 text-gray-400 text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Título de sección */}
      <div
        className="px-4 py-2.5 rounded-t-lg flex items-center justify-between"
        style={{ backgroundColor: section.headerColor || '#0070C0' }}
      >
        <h3 className="text-white font-semibold text-sm">{section.title}</h3>
        {editMode && (
          <button
            onClick={() => setShowColPicker(!showColPicker)}
            className="flex items-center gap-1 text-white/80 hover:text-white text-[11px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
          >
            Columnas {hiddenCols.length > 0 && <span className="bg-amber-400 text-white rounded-full px-1.5 text-[10px]">{hiddenCols.length} ocultas</span>}
            {showColPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Column picker */}
      {editMode && showColPicker && (
        <div className="border-x border-gray-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-700 font-medium mb-2">Seleccioná las columnas que querés mostrar:</p>
          <div className="flex flex-wrap gap-2">
            {allColumns.map(col => {
              const visible = !hiddenCols.includes(col);
              return (
                <label key={col} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumn(col)}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <span className={`text-xs ${visible ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>
                    {col}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-b-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: section.headerColor || '#0070C0' }}>
              {headers.map((header) => (
                <th
                  key={header}
                  className={`px-4 py-2.5 text-white font-semibold whitespace-nowrap border-r border-white/20 last:border-r-0 text-xs text-${colAlign[header]}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isTotal = row._isTotal === true ||
                String(row[headers[0]] ?? '').toLowerCase().includes('total');
              return (
                <tr
                  key={rowIndex}
                  className={`border-t border-gray-100 ${
                    isTotal
                      ? 'font-bold bg-gray-100'
                      : section.alternateRows && rowIndex % 2 === 1
                      ? 'bg-blue-50/40'
                      : 'bg-white'
                  }`}
                >
                  {headers.map((header) => {
                    const value = row[header];
                    const isEmpty = value === null || value === undefined || value === '';
                    return (
                      <td
                        key={header}
                        className={`px-4 py-2 whitespace-nowrap text-xs border-r border-gray-100 last:border-r-0 text-${colAlign[header]} ${
                          isTotal ? 'text-gray-900' : isEmpty ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {isEmpty ? '—' : formatCell(value, header)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── KPI BLOCK ───────────────────────────────────────────────────────────────

interface KpiBlockProps {
  section: ReportSectionType & { type: 'kpi' };
  sheet: ExcelSheet | null;
  editMode?: boolean;
  onUpdate?: (id: string, updates: Partial<ReportSectionType>) => void;
}

function KpiBlock({ section, sheet, editMode, onUpdate }: KpiBlockProps) {
  const hiddenMetrics = section.hiddenMetricIds ?? [];

  const computedMetrics = useMemo(() => {
    return section.metrics.map((metric) => {
      if (!sheet) return { ...metric, computed: 0 };
      const values = sheet.data
        .map((row) => {
          const v = row[metric.field];
          return typeof v === 'number' ? v : null;
        })
        .filter((v): v is number => v !== null);

      let computed = 0;
      switch (metric.aggregation) {
        case 'sum': computed = values.reduce((s, v) => s + v, 0); break;
        case 'avg': computed = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0; break;
        case 'count': computed = sheet.data.length; break;
        case 'max': computed = values.length ? Math.max(...values) : 0; break;
        case 'min': computed = values.length ? Math.min(...values) : 0; break;
        default: computed = values.reduce((s, v) => s + v, 0);
      }
      return { ...metric, computed };
    });
  }, [section.metrics, sheet]);

  const visibleMetrics = computedMetrics.filter(m => !hiddenMetrics.includes(m.id));

  const toggleMetric = (id: string) => {
    const current = section.hiddenMetricIds ?? [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onUpdate?.(section.id, { hiddenMetricIds: next } as any);
  };

  const kpiColors = [
    { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' },
    { bg: '#F0FDF4', border: '#22C55E', text: '#15803D' },
    { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
    { bg: '#F5F3FF', border: '#8B5CF6', text: '#6D28D9' },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{section.title}</h3>

      {/* Metric picker in edit mode */}
      {editMode && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-700 font-medium mb-2">KPIs visibles:</p>
          <div className="flex flex-wrap gap-3">
            {computedMetrics.map(m => {
              const visible = !hiddenMetrics.includes(m.id);
              return (
                <label key={m.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleMetric(m.id)}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <span className={`text-xs ${visible ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>
                    {m.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${visibleMetrics.length <= 2 ? 'grid-cols-2' : visibleMetrics.length <= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {visibleMetrics.map((metric, i) => {
          const color = kpiColors[i % kpiColors.length];
          return (
            <div
              key={metric.id}
              className="rounded-xl p-4 border-l-4"
              style={{ backgroundColor: color.bg, borderLeftColor: color.border }}
            >
              <p className="text-xs font-medium text-gray-500 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold" style={{ color: color.text }}>
                {metric.prefix || ''}
                {formatKpi(metric.computed, metric.decimals, metric.format)}
                {metric.suffix || ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CHART BLOCK ─────────────────────────────────────────────────────────────

interface ChartBlockProps {
  section: ReportSectionType & { type: 'chart' };
  sheet: ExcelSheet | null;
}

function ChartBlock({ section, sheet }: ChartBlockProps) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{section.title}</h3>
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <ChartRenderer section={section} sheet={sheet} />
      </div>
    </div>
  );
}

// ─── TEXT BLOCK ──────────────────────────────────────────────────────────────

interface TextBlockProps {
  section: ReportSectionType & { type: 'text' };
}

function TextBlock({ section }: TextBlockProps) {
  return (
    <div className="mb-6">
      {section.title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{section.title}</h3>
      )}
      <p className="text-gray-600 text-sm whitespace-pre-wrap">{section.content}</p>
    </div>
  );
}

// ─── DETAIL BLOCK ────────────────────────────────────────────────────────────

interface DetailBlockProps {
  section: ReportSectionType & { type: 'detail' };
  editMode?: boolean;
  onUpdate?: (id: string, updates: Partial<ReportSectionType>) => void;
}

function DetailBlock({ section, editMode, onUpdate }: DetailBlockProps) {
  const [showColPicker, setShowColPicker] = useState(false);
  const hiddenCols = section.hiddenColumns ?? [];
  const allCols = section.displayColumns;
  const { groupByColumn, rows, headerColor } = section;

  const visibleCols = allCols.filter(c => !hiddenCols.includes(c));

  const colAlign = useMemo(() => {
    const result: Record<string, 'left' | 'right'> = {};
    visibleCols.forEach(col => {
      const vals = rows.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      const numCount = vals.filter(v => typeof v === 'number').length;
      result[col] = vals.length > 0 && numCount / vals.length > 0.6 ? 'right' : 'left';
    });
    return result;
  }, [rows, visibleCols]);

  const groups = useMemo(() => {
    const map = new Map<string, Record<string, any>[]>();
    rows.forEach(row => {
      const key = String(row[groupByColumn] ?? '').trim();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows, groupByColumn]);

  const toggleColumn = (col: string) => {
    const current = section.hiddenColumns ?? [];
    const next = current.includes(col) ? current.filter(c => c !== col) : [...current, col];
    onUpdate?.(section.id, { hiddenColumns: next } as any);
  };

  if (groups.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="px-4 py-2.5 rounded-t-lg flex items-center justify-between" style={{ backgroundColor: headerColor }}>
        <h3 className="text-white font-semibold text-sm">{section.title}</h3>
        {editMode && (
          <button
            onClick={() => setShowColPicker(!showColPicker)}
            className="flex items-center gap-1 text-white/80 hover:text-white text-[11px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
          >
            Columnas {hiddenCols.length > 0 && <span className="bg-amber-400 text-white rounded-full px-1.5 text-[10px]">{hiddenCols.length} ocultas</span>}
            {showColPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {editMode && showColPicker && (
        <div className="border-x border-gray-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-700 font-medium mb-2">Seleccioná las columnas que querés mostrar:</p>
          <div className="flex flex-wrap gap-2">
            {allCols.map(col => {
              const visible = !hiddenCols.includes(col);
              return (
                <label key={col} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumn(col)}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <span className={`text-xs ${visible ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>
                    {col}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-b-lg overflow-hidden divide-y divide-gray-100">
        {groups.map(([groupValue, groupRows]) => (
          <div key={groupValue}>
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ backgroundColor: `${headerColor}18` }}
            >
              <span className="text-sm font-semibold" style={{ color: headerColor }}>
                {groupValue}
              </span>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                {groupRows.length} registro{groupRows.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {visibleCols.map(col => (
                      <th
                        key={col}
                        className={`px-4 py-2 text-gray-500 font-semibold border-b border-gray-100 whitespace-nowrap text-${colAlign[col]}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-blue-50/30' : 'bg-white'}>
                      {visibleCols.map(col => {
                        const val = row[col];
                        const isEmpty = val === null || val === undefined || val === '';
                        return (
                          <td
                            key={col}
                            className={`px-4 py-1.5 border-b border-gray-50 whitespace-nowrap text-${colAlign[col]} ${
                              isEmpty ? 'text-gray-300' : 'text-gray-800'
                            }`}
                          >
                            {isEmpty ? '—' : formatCell(val, col)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ID_COLUMN_PATTERN = /^(sv|nro|num|numero|n[°º]|id|cod|codigo|ref|referencia|orden|order|folio|ticket|factura\s*n|guia)/i;

function formatCell(value: unknown, header: string): string {
  if (value === null || value === undefined || value === '') return '-';

  // Fechas: formatear legiblemente (los Date que hayan escapado el parser)
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? '-' : value.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const h = String(header).toLowerCase();

  if (typeof value === 'number') {
    if (ID_COLUMN_PATTERN.test(h.trim())) {
      return String(Math.round(value));
    }
    if (h.includes('%') || h.includes('porcentaje')) {
      return `${value.toFixed(2)}%`;
    }
    if (h.includes('$') || h.includes('€') || /\bmonto\b|\bimporte\b|\bflete\b|\bprecio\b|\bcosto\b/.test(h)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value);
    }
    if (Number.isInteger(value)) {
      return String(value);
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (typeof value === 'string' && value.includes('%')) return value;

  return String(value);
}

function formatKpi(value: number, decimals: number, format?: string): string {
  if (format === 'currency') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  return value.toFixed(decimals);
}
