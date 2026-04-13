import React from 'react';
import { Download, Printer, Maximize2, X, LayoutTemplate, Table2, BrainCircuit, Pencil } from 'lucide-react';
import type { ExcelSheet } from '@/types/excel';
import type { ReportSection } from '@/types/sections';
import type { ReportMeta } from '@/hooks/useReportStudio';
import { ReportSection as ReportSectionRenderer } from './ReportSection';
import { useExport } from '@/hooks/useExport';
import { DataViewer } from '@/components/DataViewer';
import { ReportAnalyzer } from '@/components/ReportAnalyzer';

interface ReportPreviewProps {
  sheets: ExcelSheet[];
  sections: ReportSection[];
  meta: ReportMeta;
  onToggleSection?: (id: string) => void;
  onUpdateSection?: (id: string, updates: Partial<ReportSection>) => void;
  onRemoveSection?: (id: string) => void;
}

type Tab = 'report' | 'data' | 'analysis';

// Nothing-style tab button
function TabBtn({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
      style={{
        padding: '6px 12px',
        borderBottom: `2px solid ${active ? '#ffffff' : 'transparent'}`,
        color: active ? '#ffffff' : '#555555',
        background: 'transparent',
      }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className="font-mono text-[10px]"
          style={{ color: active ? '#888' : '#333' }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function ReportPreview({ sheets, sections, meta, onToggleSection, onUpdateSection, onRemoveSection }: ReportPreviewProps) {
  const { exportToPdf, exportToHtml, print, isExporting } = useExport();
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>('report');
  const [editMode, setEditMode] = React.useState(false);

  const visibleSections = sections.filter(s => s.visible);
  const today = new Date().toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className={`flex flex-col h-full ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ background: '#000', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-4"
        style={{ height: 44, borderBottom: '1px solid #1f1f1f', background: '#000' }}
      >
        {/* Tabs */}
        <div className="flex items-center h-full">
          <TabBtn active={activeTab === 'report'} onClick={() => setActiveTab('report')}
            icon={<LayoutTemplate className="w-3.5 h-3.5" />} label="Reporte"
            badge={visibleSections.length} />
          <TabBtn active={activeTab === 'data'} onClick={() => setActiveTab('data')}
            icon={<Table2 className="w-3.5 h-3.5" />} label="Datos" />
          <TabBtn active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}
            icon={<BrainCircuit className="w-3.5 h-3.5" />} label="Análisis" />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Edit mode toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{
              padding: '4px 10px',
              border: `1px solid ${editMode ? '#f59e0b' : '#1f1f1f'}`,
              borderRadius: 0,
              background: editMode ? 'rgba(245,158,11,0.08)' : 'transparent',
              color: editMode ? '#f59e0b' : '#555',
            }}
          >
            <Pencil className="w-3 h-3" />
            {editMode ? 'Editando' : 'Editar'}
          </button>

          <div className="w-px h-4 mx-1" style={{ background: '#1f1f1f' }} />

          {/* PDF export — primary action */}
          <button
            onClick={() => exportToPdf('report-document', 'reporte.pdf')}
            disabled={isExporting || visibleSections.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-30"
            style={{
              padding: '4px 12px',
              border: '1px solid #ff3333',
              borderRadius: 0,
              background: 'rgba(255,51,51,0.12)',
              color: '#ff6666',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>

          {/* HTML */}
          <button
            onClick={() => exportToHtml('report-document', 'reporte.html')}
            disabled={isExporting || visibleSections.length === 0}
            className="flex items-center justify-center transition-colors disabled:opacity-30 text-dark-600 hover:text-white"
            style={{ width: 30, height: 30, border: '1px solid #1f1f1f', borderRadius: 0, background: 'transparent' }}
            title="Exportar HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Print */}
          <button
            onClick={() => print('report-document')}
            disabled={visibleSections.length === 0}
            className="flex items-center justify-center transition-colors disabled:opacity-30 text-dark-600 hover:text-white"
            style={{ width: 30, height: 30, border: '1px solid #1f1f1f', borderRadius: 0, background: 'transparent' }}
            title="Imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center justify-center transition-colors text-dark-600 hover:text-white"
            style={{ width: 30, height: 30, border: '1px solid #1f1f1f', borderRadius: 0, background: 'transparent' }}
            title="Pantalla completa"
          >
            {isFullScreen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Data tab */}
      {activeTab === 'data' && (
        <div className="flex-1 overflow-hidden">
          <DataViewer sheets={sheets} />
        </div>
      )}

      {/* Analysis tab */}
      {activeTab === 'analysis' && (
        <div className="flex-1 overflow-hidden">
          <ReportAnalyzer sections={sections} sheets={sheets} meta={meta} />
        </div>
      )}

      {/* Edit mode banner */}
      {activeTab === 'report' && editMode && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2"
          style={{ background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
        >
          <Pencil className="w-3 h-3" style={{ color: '#f59e0b' }} />
          <span className="text-xs font-medium" style={{ color: '#d4a017' }}>
            Modo edición — ocultá secciones, quitá columnas o eliminá bloques desde el reporte.
          </span>
          <button
            onClick={() => setEditMode(false)}
            className="ml-auto text-xs underline"
            style={{ color: '#f59e0b' }}
          >
            Salir
          </button>
        </div>
      )}

      {/* Report paper */}
      {activeTab === 'report' && (
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ background: '#0a0a0a' }}
        >
          <div
            id="report-document"
            className="bg-white mx-auto shadow-2xl"
            style={{ maxWidth: 900, minHeight: 800, borderRadius: 0 }}
          >
            {/* Report Header — professional blue gradient */}
            <div
              data-pdf-header
              className="px-10 py-8"
              style={{ background: 'linear-gradient(135deg, #0070C0 0%, #005999 100%)' }}
            >
              {meta.company && (
                <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-2">
                  {meta.company}
                </p>
              )}
              <h1 className="text-white text-2xl font-bold mb-1">{meta.title || 'Reporte'}</h1>
              {meta.subtitle && (
                <p className="text-blue-200 text-sm mb-2">{meta.subtitle}</p>
              )}
              {meta.period && (
                <p className="text-blue-100 text-sm">Período: {meta.period}</p>
              )}
              <p className="text-blue-300 text-xs mt-3">Generado el {today}</p>
            </div>

            {/* Content */}
            <div className="px-10 py-8">
              {visibleSections.length === 0 && !editMode ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg font-medium mb-2">Sin secciones visibles</p>
                  <p className="text-sm">Activá secciones en el panel izquierdo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(editMode ? sections : visibleSections).map((section) => (
                    <div key={section.id} data-pdf-section>
                      <ReportSectionRenderer
                        section={section}
                        sheets={sheets}
                        editMode={editMode}
                        onToggle={onToggleSection}
                        onUpdate={onUpdateSection}
                        onRemove={onRemoveSection}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {visibleSections.length > 0 && (
              <div data-pdf-footer className="px-10 py-5 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Generado con Report Studio · {today}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
