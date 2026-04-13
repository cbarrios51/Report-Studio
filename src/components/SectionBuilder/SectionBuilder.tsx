import React from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { useReportConfig } from '@/hooks/useReportConfig';
import type { SectionType, ReportSection } from '@/types/sections';
import type { ExcelSheet } from '@/types/excel';
import { SectionList } from './SectionList';
import { SectionTypeSelector } from './SectionTypeSelector';
import { TableSection } from '../sections/TableSection';
import { KpiSection } from '../sections/KpiSection';
import { ChartSection } from '../sections/ChartSection';
import { TextSection } from '../sections/TextSection';
import {
  createTableSection,
  createKpiSection,
  createChartSection,
  createTextSection,
} from '@/utils/templates';

interface SectionBuilderProps {
  sheets: ExcelSheet[];
  selectedSheet: string | null;
}

export function SectionBuilder({ sheets, selectedSheet }: SectionBuilderProps) {
  const {
    sections,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
  } = useReportConfig();

  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = React.useState(false);

  // Usar la hoja seleccionada o la primera disponible
  const currentSheet = sheets.find(s => s.name === selectedSheet) || sheets[0];

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const handleSelectType = (type: SectionType) => {
    if (!currentSheet || sheets.length === 0) {
      alert('Primero debés cargar un archivo Excel');
      return;
    }

    let newSection: ReportSection;

    switch (type) {
      case 'table':
        newSection = createTableSection(currentSheet.name, currentSheet.headers);
        break;
      case 'kpi':
        // Obtener columnas numéricas para sugerir métricas
        const numericCols = currentSheet.headers.filter(h => currentSheet.columnTypes[h] === 'number');
        const suggestedMetrics = numericCols.slice(0, 3).map(col => ({
          label: `Total ${col}`,
          field: col,
          aggregation: 'sum' as const,
        }));
        newSection = createKpiSection(currentSheet.name, suggestedMetrics);
        break;
      case 'chart':
        const catCol = currentSheet.headers.find(
          (h) => currentSheet.columnTypes[h] === 'string'
        );
        const numCol = currentSheet.headers.find(
          (h) => currentSheet.columnTypes[h] === 'number'
        );
        newSection = createChartSection(
          currentSheet.name,
          catCol || currentSheet.headers[0],
          numCol ? [numCol] : [],
          'Nuevo Gráfico'
        );
        break;
      case 'text':
        newSection = createTextSection();
        break;
      default:
        return;
    }

    addSection(newSection);
    setSelectedSectionId(newSection.id);
  };

  const handleToggleVisibility = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      updateSection(id, { visible: !section.visible });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Secciones del Reporte
        </h2>
        <button
          onClick={() => setIsTypeSelectorOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {/* Lista de secciones (sidebar) */}
      <div className="flex-1 overflow-y-auto mb-4">
        <SectionList
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          onToggleVisibility={handleToggleVisibility}
          onDeleteSection={removeSection}
          onReorder={reorderSections}
        />
      </div>

      {/* Panel de configuración de sección */}
      {selectedSection && (
        <div className="border-t border-dark-700 pt-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-dark-400">
              Configurando: {selectedSection.title}
            </h3>
            <button
              onClick={() => setSelectedSectionId(null)}
              className="text-xs text-dark-500 hover:text-dark-300"
            >
              Cerrar
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto pr-2">
            {selectedSection.type === 'table' && (
              <TableSection
                section={selectedSection}
                sheets={sheets}
                onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                onDelete={() => {
                  removeSection(selectedSection.id);
                  setSelectedSectionId(null);
                }}
              />
            )}
            {selectedSection.type === 'kpi' && (
              <KpiSection
                section={selectedSection}
                sheets={sheets}
                onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                onDelete={() => {
                  removeSection(selectedSection.id);
                  setSelectedSectionId(null);
                }}
              />
            )}
            {selectedSection.type === 'chart' && (
              <ChartSection
                section={selectedSection}
                sheets={sheets}
                onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                onDelete={() => {
                  removeSection(selectedSection.id);
                  setSelectedSectionId(null);
                }}
              />
            )}
            {selectedSection.type === 'text' && (
              <TextSection
                section={selectedSection}
                onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                onDelete={() => {
                  removeSection(selectedSection.id);
                  setSelectedSectionId(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Selector de tipo de sección */}
      <SectionTypeSelector
        isOpen={isTypeSelectorOpen}
        onClose={() => setIsTypeSelectorOpen(false)}
        onSelectType={handleSelectType}
      />
    </div>
  );
}
