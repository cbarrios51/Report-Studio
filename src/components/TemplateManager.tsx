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
        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{
          padding: '4px 10px',
          border: `1px solid ${open ? '#ff3333' : '#1f1f1f'}`,
          borderRadius: 0,
          background: open ? 'rgba(255,51,51,0.08)' : 'transparent',
          color: open ? '#ff6666' : '#555555',
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
            className="absolute right-0 top-full mt-1 z-50 shadow-2xl"
            style={{
              width: 340,
              background: '#0f0f0f',
              border: '1px solid #2a2a2a',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1f1f1f' }}
            >
              <div className="flex items-center gap-2">
                <BookMarked className="w-3.5 h-3.5" style={{ color: '#ff3333' }} />
                <span className="text-white text-sm font-semibold">Plantillas</span>
              </div>
              <button onClick={() => { setOpen(false); setSaveMode(false); }} className="text-dark-600 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save section */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
              <p className="text-[10px] font-mono mb-2" style={{ color: '#444' }}>
                Configuración actual: {visibleCount} sección{visibleCount !== 1 ? 'es' : ''} visible{visibleCount !== 1 ? 's' : ''}
              </p>
              {!saveMode ? (
                <button
                  onClick={() => setSaveMode(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                  style={{ padding: '7px', border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#aaa' }}
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
                    className="flex-1 text-xs text-white placeholder-dark-600 focus:outline-none"
                    style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', padding: '6px 10px', borderRadius: 0 }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    className="flex items-center justify-center disabled:opacity-30 transition-colors"
                    style={{ width: 32, height: 32, border: '1px solid #ff3333', background: 'rgba(255,51,51,0.12)', color: '#ff6666', borderRadius: 0 }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setSaveMode(false); setSaveName(''); }}
                    className="flex items-center justify-center text-dark-600 hover:text-white"
                    style={{ width: 32, height: 32, border: '1px solid #1f1f1f', background: 'transparent', borderRadius: 0 }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Template list */}
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {templates.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ color: '#333' }}>
                  <p className="text-xs font-mono mb-1">Sin plantillas guardadas</p>
                  <p className="text-[10px]">Editá tu reporte y guardalo como plantilla para reutilizarlo.</p>
                </div>
              ) : (
                templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-2 px-4 py-2.5 group"
                    style={{ borderBottom: '1px solid #1a1a1a' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{tpl.name}</p>
                      <p className="text-[10px] font-mono" style={{ color: '#444' }}>
                        {formatDate(tpl.savedAt)} · {tpl.visibleIds.length} secciones visibles
                      </p>
                    </div>
                    <button
                      onClick={() => handleApply(tpl)}
                      className="flex items-center gap-1 text-[10px] font-semibold transition-colors flex-shrink-0"
                      style={{
                        padding: '3px 8px',
                        border: `1px solid ${applied === tpl.id ? '#22c55e' : '#2a2a2a'}`,
                        background: applied === tpl.id ? 'rgba(34,197,94,0.1)' : '#1a1a1a',
                        color: applied === tpl.id ? '#22c55e' : '#aaa',
                        borderRadius: 0,
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
                      style={{ color: '#333' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ff3333')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Hint */}
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid #1a1a1a' }}>
              <p className="text-[10px] font-mono" style={{ color: '#333' }}>
                Al aplicar: secciones que no estaban visibles al guardar quedan ocultas automáticamente.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
