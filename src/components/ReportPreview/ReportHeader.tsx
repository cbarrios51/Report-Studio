import type { ReportContext } from '@/types/report';

interface ReportHeaderProps {
  context: ReportContext;
  theme: { headerColor: string };
}

export function ReportHeader({ context, theme }: ReportHeaderProps) {
  return (
    <header
      className="text-center py-8 px-4 mb-8"
      style={{
        borderBottom: `3px solid ${theme.headerColor}`,
      }}
    >
      <h1
        className="text-3xl font-bold mb-2"
        style={{ color: theme.headerColor }}
      >
        {context.title || 'Reporte'}
      </h1>

      {(context.period || context.department) && (
        <div className="flex items-center justify-center gap-4 text-dark-500 mt-3">
          {context.period && (
            <span className="text-sm">
              <strong>Período:</strong> {context.period}
            </span>
          )}
          {context.department && (
            <>
              <span className="text-dark-600">•</span>
              <span className="text-sm">
                <strong>Departamento:</strong> {context.department}
              </span>
            </>
          )}
        </div>
      )}

      {context.recipient && (
        <p className="text-dark-500 mt-4 text-sm">
          Preparado para: <strong>{context.recipient}</strong>
        </p>
      )}

      {context.description && (
        <p className="text-dark-400 mt-3 text-sm max-w-2xl mx-auto">
          {context.description}
        </p>
      )}
    </header>
  );
}
