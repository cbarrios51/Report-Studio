import React from 'react';
import {
  Eye, EyeOff, Table2, BarChart3, Layers, AlignLeft,
  ChevronUp, ChevronDown, Trash2, List
} from 'lucide-react';
import type { ReportSection } from '@/types/sections';

interface SectionPanelProps {
  sections: ReportSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  table:  <Table2   className="w-3.5 h-3.5" />,
  kpi:    <Layers   className="w-3.5 h-3.5" />,
  chart:  <BarChart3 className="w-3.5 h-3.5" />,
  text:   <AlignLeft className="w-3.5 h-3.5" />,
  detail: <List     className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  table:  'Tabla',
  kpi:    'KPIs',
  chart:  'Gráfico',
  text:   'Texto',
  detail: 'Detalle',
};

// Nothing-style: monochrome labels with thin left border accent per type
const TYPE_ACCENT: Record<string, string> = {
  table:  '#4488ff',
  kpi:    '#22c55e',
  chart:  '#aa88ff',
  text:   '#f59e0b',
  detail: '#06b6d4',
};

export function SectionPanel({
  sections,
  selectedId,
  onSelect,
  onToggle,
  onMove,
  onRemove,
}: SectionPanelProps) {
  const visibleCount = sections.filter(s => s.visible).length;

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
        <p className="text-white text-xs font-semibold uppercase tracking-widest font-mono">Secciones</p>
        <p className="text-dark-600 text-[10px] mt-0.5 font-mono">
          {visibleCount}/{sections.length} visibles
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.length === 0 ? (
          <div className="px-4 py-8 text-center text-dark-600 text-xs font-mono">
            Sin secciones
          </div>
        ) : (
          <div className="space-y-px px-2">
            {sections.map((section, index) => {
              const isSelected = section.id === selectedId;
              const accent = TYPE_ACCENT[section.type] || '#666';

              return (
                <div
                  key={section.id}
                  className="group relative cursor-pointer transition-colors"
                  style={{
                    borderLeft: `2px solid ${isSelected ? accent : 'transparent'}`,
                    background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                    opacity: section.visible ? 1 : 0.35,
                  }}
                  onClick={() => onSelect(section.id)}
                >
                  <div className="flex items-center gap-2 px-2 py-2">

                    {/* Type icon */}
                    <span style={{ color: accent, flexShrink: 0 }}>
                      {TYPE_ICONS[section.type]}
                    </span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate font-medium">
                        {section.title || 'Sin título'}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: '#444' }}>
                        {TYPE_LABELS[section.type]}
                        {'sourceSheet' in section ? ` · ${(section as any).sourceSheet}` : ''}
                      </p>
                    </div>

                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMove(index, index - 1); }}
                        disabled={index === 0}
                        className="p-1 text-dark-600 hover:text-white disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMove(index, index + 1); }}
                        disabled={index === sections.length - 1}
                        className="p-1 text-dark-600 hover:text-white disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(section.id); }}
                        className="p-1 text-dark-600 hover:text-primary transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Eye toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(section.id); }}
                      className="p-1 flex-shrink-0 transition-colors"
                      style={{ color: section.visible ? '#444' : '#2a2a2a' }}
                    >
                      {section.visible
                        ? <Eye className="w-3.5 h-3.5" />
                        : <EyeOff className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span style={{ color: TYPE_ACCENT[type], flexShrink: 0 }}>{TYPE_ICONS[type]}</span>
              <span className="text-[10px] font-mono" style={{ color: '#444' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
