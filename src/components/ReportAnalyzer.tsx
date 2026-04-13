import React from 'react';
import { FileText, AlertCircle, Copy, Check } from 'lucide-react';
import type { ReportSection } from '@/types/sections';
import type { ExcelSheet } from '@/types/excel';
import { analyzeReport } from '@/utils/reportAnalyzer';

interface ReportAnalyzerProps {
  sections: ReportSection[];
  sheets: ExcelSheet[];
  meta: { title: string; subtitle?: string; period?: string; company?: string };
}

/** Renders inline **bold** markdown */
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="text-gray-900 font-semibold">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export function ReportAnalyzer({ sections, sheets, meta }: ReportAnalyzerProps) {
  const paragraphs = React.useMemo(() => analyzeReport(sections, sheets), [sections, sheets]);
  const [copied, setCopied] = React.useState(false);

  const today = new Date().toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleCopy = () => {
    const plain = paragraphs
      .map((p) => `${p.heading}\n\n${p.text.replace(/\*\*/g, '')}`)
      .join('\n\n---\n\n');

    const header = [
      meta.company,
      meta.title,
      meta.subtitle,
      meta.period ? `Período: ${meta.period}` : '',
      `Generado el ${today}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(`${header}\n\n${plain}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (sections.filter((s) => s.visible).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-dark-500 gap-3">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm">No hay secciones visibles para analizar</p>
      </div>
    );
  }

  if (paragraphs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-dark-500 gap-3">
        <FileText className="w-10 h-10" />
        <p className="text-sm">No se encontraron datos suficientes para generar análisis</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-white">Análisis del Reporte</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
        >
          {copied
            ? <Check className="w-3.5 h-3.5 text-green-400" />
            : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar texto'}
        </button>
      </div>

      {/* White paper */}
      <div className="flex-1 overflow-y-auto bg-dark-950 p-6">
        <div
          className="bg-white mx-auto rounded-xl shadow-2xl"
          style={{ maxWidth: '860px', minHeight: '600px' }}
        >
          {/* Report-style header */}
          <div
            className="px-10 py-8 rounded-t-xl"
            style={{ background: 'linear-gradient(135deg, #0070C0 0%, #005999 100%)' }}
          >
            {meta.company && (
              <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-2">
                {meta.company}
              </p>
            )}
            <h1 className="text-white text-2xl font-bold mb-1">{meta.title || 'Reporte'}</h1>
            {meta.subtitle && (
              <p className="text-blue-200 text-sm mb-1">{meta.subtitle}</p>
            )}
            {meta.period && (
              <p className="text-blue-100 text-sm">Período: {meta.period}</p>
            )}
            <p className="text-blue-300 text-xs mt-3">Análisis generado el {today}</p>
          </div>

          {/* Body */}
          <div className="px-10 py-8 space-y-8">
            {paragraphs.map((p, i) => (
              <div key={i} className="border-l-4 border-blue-100 pl-5">
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                  {p.heading}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <RichText text={p.text} />
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-10 py-5 border-t border-gray-100 text-center rounded-b-xl">
            <p className="text-xs text-gray-400">
              Análisis automático · Report Studio · {today}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
