import React from 'react';
import { FileSpreadsheet, ChevronLeft, Settings } from 'lucide-react';
import { useReportStudio } from '@/hooks/useReportStudio';
import { UploadScreen } from '@/components/UploadScreen';
import { SectionPanel } from '@/components/SectionPanel';
import { ReportPreview } from '@/components/ReportPreview/ReportPreview';
import { TemplateManager } from '@/components/TemplateManager';

function App() {
  const {
    phase,
    excelFile,
    isLoading,
    error,
    sections,
    selectedSectionId,
    meta,
    loadFile,
    toggleSection,
    moveSection,
    updateSection,
    removeSection,
    setSelectedSectionId,
    setMeta,
    applyTemplate,
    reset,
  } = useReportStudio();

  const [showMeta, setShowMeta] = React.useState(false);

  if (phase === 'upload' || phase === 'analyzing') {
    return (
      <UploadScreen
        onFileLoaded={loadFile}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-dark-950 overflow-hidden" style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>

      {/* Top bar — Nothing style: pure black, hairline border */}
      <header
        className="flex items-center justify-between px-5 py-0 flex-shrink-0"
        style={{ height: 48, background: '#000', borderBottom: '1px solid #1f1f1f' }}
      >
        {/* Left: back + file info */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center transition-colors text-dark-500 hover:text-white"
            style={{ width: 28, height: 28, border: '1px solid #1f1f1f', borderRadius: 0, background: 'transparent' }}
            title="Cargar otro archivo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dot separator */}
          <div className="w-1 h-1 rounded-full bg-dark-700" />

          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-dark-500" />
            <span className="text-white text-sm font-medium">{meta.title || 'Reporte'}</span>
            <span className="text-dark-600 text-xs font-mono">·</span>
            <span className="text-dark-500 text-xs font-mono">{excelFile?.name}</span>
            <span className="text-dark-700 text-xs font-mono">
              {excelFile?.sheets.length} hoja{excelFile?.sheets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <TemplateManager
            sections={sections}
            meta={meta}
            onApply={applyTemplate}
          />

          <div className="w-px h-4 bg-dark-800 mx-1" />

          <button
            onClick={() => setShowMeta(!showMeta)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{
              padding: '4px 10px',
              border: `1px solid ${showMeta ? '#ff3333' : '#1f1f1f'}`,
              borderRadius: 0,
              background: showMeta ? 'rgba(255,51,51,0.08)' : 'transparent',
              color: showMeta ? '#ff6666' : '#888888',
            }}
          >
            <Settings className="w-3 h-3" />
            Configurar
          </button>
        </div>
      </header>

      {/* Meta editor */}
      {showMeta && (
        <div
          className="flex-shrink-0 px-6 py-4"
          style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f' }}
        >
          <div className="max-w-3xl mx-auto grid grid-cols-4 gap-3">
            {[
              { key: 'title',    label: 'Título' },
              { key: 'subtitle', label: 'Subtítulo' },
              { key: 'period',   label: 'Período' },
              { key: 'company',  label: 'Empresa' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[10px] text-dark-500 mb-1 uppercase tracking-wider font-mono">{label}</label>
                <input
                  type="text"
                  value={(meta as any)[key]}
                  onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                  className="w-full text-sm text-white placeholder-dark-600 focus:outline-none"
                  style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 0, padding: '6px 10px' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main: sidebar + preview */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside
          className="flex-shrink-0 overflow-hidden flex flex-col"
          style={{ width: 240, background: '#000', borderRight: '1px solid #1f1f1f' }}
        >
          <SectionPanel
            sections={sections}
            selectedId={selectedSectionId}
            onSelect={setSelectedSectionId}
            onToggle={toggleSection}
            onMove={moveSection}
            onRemove={removeSection}
          />
        </aside>

        {/* Preview */}
        <main className="flex-1 overflow-hidden">
          <ReportPreview
            sheets={excelFile?.sheets ?? []}
            sections={sections}
            meta={meta}
            onToggleSection={toggleSection}
            onUpdateSection={updateSection}
            onRemoveSection={removeSection}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
