import { Table, BarChart3, PieChart, Type, X } from 'lucide-react';
import type { SectionType } from '@/types/sections';

interface SectionTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: SectionType) => void;
}

const sectionTypes: Array<{
  type: SectionType;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}> = [
  {
    type: 'table',
    icon: <Table className="w-6 h-6" />,
    title: 'Tabla',
    description: 'Mostrar datos en formato tabular con opciones de agrupamiento y totales',
    color: 'blue',
  },
  {
    type: 'kpi',
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Métricas KPI',
    description: 'Tarjetas de resumen con hasta 4 KPIs por fila',
    color: 'green',
  },
  {
    type: 'chart',
    icon: <PieChart className="w-6 h-6" />,
    title: 'Gráfico',
    description: 'Visualización gráfica: barras, líneas, circular o donut',
    color: 'cyan',
  },
  {
    type: 'text',
    icon: <Type className="w-6 h-6" />,
    title: 'Texto Libre',
    description: 'Bloque de texto para introducciones u observaciones',
    color: 'orange',
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    hover: 'hover:bg-blue-500/30',
    border: 'hover:border-blue-500/50',
  },
  green: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    hover: 'hover:bg-green-500/30',
    border: 'hover:border-green-500/50',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    hover: 'hover:bg-cyan-500/30',
    border: 'hover:border-cyan-500/50',
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    hover: 'hover:bg-orange-500/30',
    border: 'hover:border-orange-500/50',
  },
};

export function SectionTypeSelector({
  isOpen,
  onClose,
  onSelectType,
}: SectionTypeSelectorProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <div>
              <h2 className="text-xl font-semibold text-white">Agregar Sección</h2>
              <p className="text-dark-400 text-sm mt-1">
                Seleccioná el tipo de sección que querés agregar
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tipos de sección */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionTypes.map((item) => {
                const colors = colorClasses[item.color as keyof typeof colorClasses];

                return (
                  <button
                    key={item.type}
                    onClick={() => {
                      onSelectType(item.type);
                      onClose();
                    }}
                    className={`
                      flex flex-col items-start gap-3 p-5 rounded-xl
                      border border-transparent text-left
                      transition-all duration-200
                      ${colors.bg} ${colors.text}
                      ${colors.hover} ${colors.border}
                      hover:shadow-lg hover:scale-[1.02]
                    `}
                  >
                    <div className={`${colors.text}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {item.title}
                      </h3>
                      <p className="text-dark-400 text-sm mt-1">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
