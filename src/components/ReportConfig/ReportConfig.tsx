import { FileText, Calendar, Building2, Users, BookOpen } from 'lucide-react';
import { useReportConfig } from '@/hooks/useReportConfig';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';

export function ReportConfig() {
  const { context, updateContext } = useReportConfig();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        Configuración del Reporte
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {/* Título */}
        <Input
          label={
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Título del Reporte</span>
            </div>
          }
          value={context.title}
          onChange={(e) => updateContext({ title: e.target.value })}
          placeholder="Mi Reporte"
        />

        {/* Período */}
        <Input
          label={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Período</span>
            </div>
          }
          value={context.period}
          onChange={(e) => updateContext({ period: e.target.value })}
          placeholder="ej: 16-03 al 31-03"
        />

        {/* Departamento */}
        <Input
          label={
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Área / Departamento</span>
            </div>
          }
          value={context.department}
          onChange={(e) => updateContext({ department: e.target.value })}
          placeholder="ej: Call Center US"
        />

        {/* Destinatario */}
        <Input
          label={
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Destinatario</span>
            </div>
          }
          value={context.recipient}
          onChange={(e) => updateContext({ recipient: e.target.value })}
          placeholder="ej: Gerencia de Operaciones"
        />

        {/* Descripción */}
        <Textarea
          label={
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Descripción / Contexto</span>
            </div>
          }
          value={context.description}
          onChange={(e) => updateContext({ description: e.target.value })}
          placeholder="Describí qué representa este reporte..."
          rows={3}
        />
      </div>
    </div>
  );
}
