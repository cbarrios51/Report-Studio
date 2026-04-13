/**
 * TemplateManager — Guardar y cargar plantillas de reporte
 */

import React from 'react';
import { BookMarked, Save, Trash2, FolderOpen, X, Check } from 'lucide-react';
import type { ReportSection } from '@/types/sections';
import type { ReportMeta } from '@/hooks/useReportStudio';
import {
  loadTemplates,
  persistTemplate,
  removeTemplate,
  buildTemplate,
  applyTemplateToSections,
  generateTemplateId,
  type ReportTemplate,
} from '@/utils/templates';

interface TemplateManagerProps {
  /** TODAS las secciones (incluyendo ocultas), para guardar correctamente qué se quiere mostrar */
  sections: ReportSection[];
  meta: ReportMeta;
  onApply: (sections: ReportSection[], meta: ReportMeta) => void;
}

export function TemplateManager({ sections, meta, onApply }: TemplateManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<ReportTemplate[]>([]);
  const [saveName, setSaveName] = React.useState('');
  const [saveMode, setSaveMode] = React.useState(false);
  const [applied, setApplied] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setTemplates(loadTemplates());
  }, [open]);

  function handleSave() {
    if (!saveName.trim()) return;
    const tpl = buildTemplate(generateTemplateId(), saveName.trim(), sections, meta);
    persistTemplate(tpl);
    setTemplates(loadTemplates());
    setSaveName('');
    setSaveMode(false);
  }

  function handleApply(tpl: ReportTemplate) {
    const newSections = applyTemplateToSections(sections, tpl);
    // Mantener el meta actual (título/período del archivo cargado), solo restaurar empresa/subtítulo si estaban definidos
    const mergedMeta = {
      ...meta,
      company: tpl.meta.company || meta.company,
      subtitle: tpl.meta.subtitle || meta.subtitle,
    };
    onApply(newSections, mergedMeta);
    setApplied(tpl.id);
    setOpen(false);
    setTimeout(() => setApplied(null), 2000);
  }

  function handleDelete(id: string) {
    removeTemplate(id);
    setTemplates(loadTemplates());
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  const visibleCount = sections.filter(s => s.visible).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium transition-all"
        style={{
          padding: '5px 12px',
          border: `1px solid ${open ? 'rgba(167,139,250,0.5)' : '#1E2D47'}`,
          borderRadius: 6,
          background: open ? 'rgba(167,139,250,0.1)' : 'transparent',
          color: open ? '#A78BFA' : '#6B85A8',
        }}
        title="Plantillas de reporte"
      >
        <BookMarked className="w-3.5 h-3.5" />
        Plantillas
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setOpen(false); setSaveMode(false); }}
          />

          {/* Panel */}
          <div
            className="absolute right-0 top-full mt-2 z-50"
            style={{
              width: 340,
              background: '#0F1629',
              border: '1px solid #1E2D47',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1E2D47' }}
            >
              <div className="flex items-center gap-2">
                <BookMarked className="w-3.5 h-3.5" style={{ color: '#A78BFA' }} />
                <span className="text-sm font-semibold" style={{ color: '#EDF2FF' }}>Plantillas</span>
              </div>
              <button
                onClick={() => { setOpen(false); setSaveMode(false); }}
                style={{ color: '#6B85A8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#EDF2FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6B85A8')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save section */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2D47' }}>
              <p className="text-[11px] mb-2" style={{ color: '#3E5470' }}>
                {visibleCount} sección{visibleCount !== 1 ? 'es' : ''} visible{visibleCount !== 1 ? 's' : ''} en la configuración actual
              </p>
              {!saveMode ? (
                <button
                  onClick={() => setSaveMode(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium transition-all"
                  style={{
                    padding: '8px',
                    border: '1px solid #1E2D47',
                    borderRadius: 8,
                    background: '#162035',
                    color: '#A8BEDC',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D4267')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1E2D47')}
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar configuración actual como plantilla
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaveMode(false); }}
                    placeholder="Nombre de la plantilla…"
                    className="flex-1 text-xs focus:outline-none"
                    style={{
                      background: '#0A1020',
                      border: '1px solid #1E2D47',
                      borderRadius: 6,
                      padding: '7px 10px',
                      color: '#EDF2FF',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#A78BFA')}
                    onBlur={e  => (e.target.style.borderColor = '#1E2D47')}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    className="flex items-center justify-center disabled:opacity-30 transition-all"
                    style={{
                      width: 34, height: 34,
                      border: '1px solid rgba(167,139,250,0.5)',
                      background: 'rgba(167,139,250,0.12)',
                      color: '#A78BFA',
                      borderRadius: 6,
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setSaveMode(false); setSaveName(''); }}
                    className="flex items-center justify-center transition-all"
                    style={{
                      width: 34, height: 34,
                      border: '1px solid #1E2D47',
                      background: 'transparent',
                      borderRadius: 6,
                      color: '#6B85A8',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EDF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6B85A8')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Template list */}
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {templates.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ color: '#3E5470' }}>
                  <p className="text-xs mb-1">Sin plantillas guardadas</p>
                  <p className="text-[11px]">Editá tu reporte y guardalo como plantilla para reutilizarlo.</p>
                </div>
              ) : (
                templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-2 px-4 py-2.5 group transition-colors"
                    style={{ borderBottom: '1px solid #162035' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,45,71,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#EDF2FF' }}>{tpl.name}</p>
                      <p className="text-[11px]" style={{ color: '#3E5470' }}>
                        {formatDate(tpl.savedAt)} · {tpl.visibleIds.length} secciones
                      </p>
                    </div>
                    <button
                      onClick={() => handleApply(tpl)}
                      className="flex items-center gap-1 text-[11px] font-semibold transition-all flex-shrink-0"
                      style={{
                        padding: '4px 9px',
                        border: `1px solid ${applied === tpl.id ? 'rgba(52,211,153,0.4)' : '#1E2D47'}`,
                        background: applied === tpl.id ? 'rgba(52,211,153,0.1)' : '#162035',
                        color: applied === tpl.id ? '#34D399' : '#A8BEDC',
                        borderRadius: 6,
                      }}
                    >
                      {applied === tpl.id
                        ? <><Check className="w-3 h-3" /> Aplicado</>
                        : <><FolderOpen className="w-3 h-3" /> Aplicar</>
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      style={{ color: '#3E5470', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#3E5470')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Hint */}
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid #162035' }}>
              <p className="text-[11px]" style={{ color: '#3E5470' }}>
                Al aplicar: secciones no visibles al guardar quedan ocultas automáticamente.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
