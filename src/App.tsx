import React from 'react';
import { BarChart3, ChevronLeft, Settings, FileSpreadsheet } from 'lucide-react';
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
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#070C1A', fontFamily: '"Inter", "Space Grotesk", system-ui, sans-serif' }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: 52,
          background: '#0A1020',
          borderBottom: '1px solid #1E2D47',
        }}
      >
        {/* Left: logo + file info */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-1">
            <div
              className="flex items-center justify-center w-7 h-7"
              style={{ background: 'linear-gradient(135deg,#4F8EF7,#2563EB)', borderRadius: 7 }}
            >
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: '#EDF2FF' }}>Report Studio</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5" style={{ background: '#1E2D47' }} />

          {/* Back button */}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs font-medium transition-all"
            style={{
              padding: '4px 8px',
              border: '1px solid #1E2D47',
              borderRadius: 6,
              background: 'transparent',
              color: '#6B85A8',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#2D4267';
              (e.currentTarget as HTMLButtonElement).style.color = '#A8BEDC';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1E2D47';
              (e.currentTarget as HTMLButtonElement).style.color = '#6B85A8';
            }}
            title="Cargar otro archivo"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Inicio
          </button>

          {/* File info */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: '#4F8EF7' }} />
            <span className="text-sm font-medium" style={{ color: '#EDF2FF' }}>
              {meta.title || 'Reporte'}
            </span>
            <span
              className="text-xs px-2 py-0.5 font-mono"
              style={{
                background: 'rgba(79,142,247,0.1)',
                border: '1px solid rgba(79,142,247,0.2)',
                borderRadius: 4,
                color: '#4F8EF7',
              }}
            >
              {excelFile?.sheets.length} hoja{excelFile?.sheets.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs hidden sm:block" style={{ color: '#3E5470' }}>
              {excelFile?.name}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <TemplateManager
            sections={sections}
            meta={meta}
            onApply={applyTemplate}
          />

          <div className="w-px h-5" style={{ background: '#1E2D47' }} />

          <button
            onClick={() => setShowMeta(!showMeta)}
            className="flex items-center gap-1.5 text-xs font-medium transition-all"
            style={{
              padding: '5px 12px',
              border: `1px solid ${showMeta ? 'rgba(79,142,247,0.5)' : '#1E2D47'}`,
              borderRadius: 6,
              background: showMeta ? 'rgba(79,142,247,0.12)' : 'transparent',
              color: showMeta ? '#4F8EF7' : '#6B85A8',
            }}
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar
          </button>
        </div>
      </header>

      {/* Meta editor */}
      {showMeta && (
        <div
          className="flex-shrink-0 px-6 py-4 animate-fade-in"
          style={{ background: '#0A1020', borderBottom: '1px solid #1E2D47' }}
        >
          <div className="max-w-3xl mx-auto grid grid-cols-4 gap-3">
            {[
              { key: 'title',    label: 'Título' },
              { key: 'subtitle', label: 'Subtítulo' },
              { key: 'period',   label: 'Período' },
              { key: 'company',  label: 'Empresa' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label
                  className="block text-[11px] mb-1.5 font-medium uppercase tracking-wider"
                  style={{ color: '#6B85A8' }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  value={(meta as any)[key]}
                  onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                  className="w-full text-sm focus:outline-none transition-colors"
                  style={{
                    background: '#0F1629',
                    border: '1px solid #1E2D47',
                    borderRadius: 6,
                    padding: '7px 10px',
                    color: '#EDF2FF',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4F8EF7')}
                  onBlur={e  => (e.target.style.borderColor = '#1E2D47')}
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
          style={{ width: 248, background: '#0A1020', borderRight: '1px solid #1E2D47' }}
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
