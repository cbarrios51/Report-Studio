import { Type, Trash2 } from 'lucide-react';
import type { TextSection as TextSectionType, ReportSection } from '@/types/sections';

interface TextSectionProps {
  section: TextSectionType;
  onUpdate: (updates: Partial<ReportSection>) => void;
  onDelete: () => void;
}

export function TextSection({
  section,
  onUpdate,
  onDelete,
}: TextSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Type className="w-5 h-5 text-orange-500" />
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
        {/* Contenido de texto */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Contenido</label>
          <textarea
            value={section.content}
            onChange={(e) => onUpdate({ content: e.target.value } as Partial<ReportSection>)}
            rows={6}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"
            placeholder="Escribí el texto de esta sección..."
          />
        </div>

        {/* Alineación */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Alineación</label>
          <div className="flex gap-2">
            {[
              { value: 'left', label: 'Izquierda', icon: '⫷' },
              { value: 'center', label: 'Centro', icon: '≡' },
              { value: 'right', label: 'Derecha', icon: '⫸' },
              { value: 'justify', label: 'Justificado', icon: '☰' },
            ].map((align) => (
              <button
                key={align.value}
                onClick={() => onUpdate({ textAlign: align.value as TextSectionType['textAlign'] } as Partial<ReportSection>)}
                className={`
                  flex-1 py-2.5 px-3 rounded-lg font-medium transition-all
                  ${section.textAlign === align.value
                    ? 'bg-primary text-white'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                  }
                `}
              >
                <span className="text-lg">{align.icon}</span>
                <span className="ml-2 text-sm">{align.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tamaño de fuente */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Tamaño de fuente</label>
          <div className="flex gap-2">
            {[
              { value: 'sm', label: 'Pequeño', preview: 'Aa' },
              { value: 'base', label: 'Normal', preview: 'Aa' },
              { value: 'lg', label: 'Grande', preview: 'Aa' },
              { value: 'xl', label: 'Extra Grande', preview: 'Aa' },
            ].map((size) => (
              <button
                key={size.value}
                onClick={() => onUpdate({ fontSize: size.value as TextSectionType['fontSize'] } as Partial<ReportSection>)}
                className={`
                  flex-1 py-2.5 px-3 rounded-lg font-medium transition-all
                  ${section.fontSize === size.value
                    ? 'bg-primary text-white'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                  }
                `}
              >
                <span className={size.value === 'sm' ? 'text-sm' : size.value === 'lg' ? 'text-lg' : size.value === 'xl' ? 'text-xl' : ''}>
                  {size.preview}
                </span>
                <span className="ml-2 text-sm">{size.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Peso de fuente */}
        <div>
          <label className="block text-sm text-dark-400 mb-2">Peso de fuente</label>
          <div className="flex gap-2">
            {[
              { value: 'normal', label: 'Normal' },
              { value: 'medium', label: 'Medio' },
              { value: 'bold', label: 'Negrita' },
            ].map((weight) => (
              <button
                key={weight.value}
                onClick={() => onUpdate({ fontWeight: weight.value as TextSectionType['fontWeight'] } as Partial<ReportSection>)}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg font-medium transition-all
                  ${section.fontWeight === weight.value
                    ? 'bg-primary text-white'
                    : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                  }
                  ${weight.value === 'bold' ? 'font-bold' : weight.value === 'medium' ? 'font-medium' : 'font-normal'}
                `}
              >
                {weight.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
