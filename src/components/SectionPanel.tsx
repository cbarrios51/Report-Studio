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
  table:  <Table2    className="w-3.5 h-3.5" />,
  kpi:    <Layers    className="w-3.5 h-3.5" />,
  chart:  <BarChart3 className="w-3.5 h-3.5" />,
  text:   <AlignLeft className="w-3.5 h-3.5" />,
  detail: <List      className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  table:  'Tabla',
  kpi:    'KPIs',
  chart:  'Gráfico',
  text:   'Texto',
  detail: 'Detalle',
};

const TYPE_ACCENT: Record<string, string> = {
  table:  '#4F8EF7',
  kpi:    '#34D399',
  chart:  '#A78BFA',
  text:   '#FBBF24',
  detail: '#22D3EE',
};

const TYPE_BG: Record<string, string> = {
  table:  'rgba(79,142,247,0.1)',
  kpi:    'rgba(52,211,153,0.1)',
  chart:  'rgba(167,139,250,0.1)',
  text:   'rgba(251,191,36,0.1)',
  detail: 'rgba(34,211,238,0.1)',
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
    <div className="flex flex-col h-full" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #1E2D47' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#A8BEDC' }}>
          Secciones
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-xs font-medium px-2 py-0.5"
            style={{
              background: 'rgba(79,142,247,0.12)',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 4,
              color: '#4F8EF7',
            }}
          >
            {visibleCount} visibles
          </span>
          <span className="text-xs" style={{ color: '#3E5470' }}>
            de {sections.length}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {sections.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs" style={{ color: '#3E5470' }}>
            Sin secciones
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section, index) => {
              const isSelected = section.id === selectedId;
              const accent = TYPE_ACCENT[section.type] || '#4F8EF7';
              const bg     = TYPE_BG[section.type]     || 'rgba(79,142,247,0.08)';

              return (
                <div
                  key={section.id}
                  className="group relative cursor-pointer transition-all duration-150"
                  style={{
                    borderRadius: 8,
                    background: isSelected ? bg : 'transparent',
                    border: `1px solid ${isSelected ? accent + '33' : 'transparent'}`,
                    opacity: section.visible ? 1 : 0.4,
                  }}
                  onClick={() => onSelect(section.id)}
                  onMouseEnter={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,45,71,0.6)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2">

                    {/* Type icon badge */}
                    <div
                      className="flex items-center justify-center w-6 h-6 flex-shrink-0"
                      style={{
                        background: isSelected ? bg : 'rgba(30,45,71,0.6)',
                        borderRadius: 6,
                        color: accent,
                      }}
                    >
                      {TYPE_ICONS[section.type]}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#EDF2FF' }}>
                        {section.title || 'Sin título'}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: '#3E5470' }}>
                        {TYPE_LABELS[section.type]}
                        {'sourceSheet' in section ? ` · ${(section as any).sourceSheet}` : ''}
                      </p>
                    </div>

                    {/* Actions (hover) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMove(index, index - 1); }}
                        disabled={index === 0}
                        className="p-1 rounded disabled:opacity-20 transition-colors"
                        style={{ color: '#6B85A8' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EDF2FF')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6B85A8')}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMove(index, index + 1); }}
                        disabled={index === sections.length - 1}
                        className="p-1 rounded disabled:opacity-20 transition-colors"
                        style={{ color: '#6B85A8' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EDF2FF')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6B85A8')}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(section.id); }}
                        className="p-1 rounded transition-colors"
                        style={{ color: '#6B85A8' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6B85A8')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Eye toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(section.id); }}
                      className="p-1 rounded flex-shrink-0 transition-colors"
                      style={{ color: section.visible ? '#4F8EF7' : '#3E5470' }}
                      onMouseEnter={e => (e.currentTarget.style.color = section.visible ? '#6BA3F9' : '#6B85A8')}
                      onMouseLeave={e => (e.currentTarget.style.color = section.visible ? '#4F8EF7' : '#3E5470')}
                    >
                      {section.visible
                        ? <Eye    className="w-3.5 h-3.5" />
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
      <div className="px-3 py-3" style={{ borderTop: '1px solid #1E2D47' }}>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span style={{ color: TYPE_ACCENT[type], flexShrink: 0 }}>{TYPE_ICONS[type]}</span>
              <span className="text-[10px]" style={{ color: '#3E5470' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
