import React from 'react';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ReportSection } from '@/types/sections';

interface SectionListProps {
  sections: ReportSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const sectionIcons: Record<string, string> = {
  table: '📊',
  kpi: '📈',
  chart: '📉',
  text: '📝',
};

const sectionLabels: Record<string, string> = {
  table: 'Tabla',
  kpi: 'KPIs',
  chart: 'Gráfico',
  text: 'Texto',
};

export function SectionList({
  sections,
  selectedSectionId,
  onSelectSection,
  onToggleVisibility,
  onDeleteSection,
  onReorder,
}: SectionListProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-dark-400">
        <p className="text-sm">No hay secciones agregadas</p>
        <p className="text-xs mt-1">Usá el botón "+ Agregar Sección" para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          onClick={() => onSelectSection(section.id)}
          className={`
            group flex items-center gap-3 p-3 rounded-lg cursor-pointer
            transition-all duration-200 border
            ${
              selectedSectionId === section.id
                ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/10'
                : 'bg-dark-700/30 border-dark-700 hover:bg-dark-700/50 hover:border-dark-600'
            }
            ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
          `}
        >
          {/* Drag handle */}
          <div className="cursor-grab active:cursor-grabbing text-dark-500 hover:text-dark-300">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Icono del tipo */}
          <div className="text-xl">{sectionIcons[section.type]}</div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{section.title}</p>
            <p className="text-dark-400 text-xs">
              {sectionLabels[section.type]}
              {!section.visible && ' • Oculta'}
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(section.id);
              }}
              className={`p-1.5 rounded transition-colors ${
                section.visible
                  ? 'text-dark-400 hover:text-white hover:bg-dark-600'
                  : 'text-dark-500 hover:text-white hover:bg-dark-600'
              }`}
              title={section.visible ? 'Ocultar sección' : 'Mostrar sección'}
            >
              {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection(section.id);
              }}
              className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Eliminar sección"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
