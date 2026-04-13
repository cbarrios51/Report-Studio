import { useState } from 'react';
import { Save, FolderOpen, Trash2, Check, X } from 'lucide-react';
import { useReportConfig } from '@/hooks/useReportConfig';
import {
  saveTemplate,
  getSavedTemplates,
  deleteTemplate,
  loadTemplate,
} from '@/utils/templates';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export function TemplateManager() {
  const { config, loadTemplate: loadConfig } = useReportConfig();
  const [templates, setTemplates] = useState(getSavedTemplates());
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Ingresá un nombre para la plantilla');
      return;
    }

    const id = crypto.randomUUID();
    saveTemplate(id, templateName, config);
    setTemplates(getSavedTemplates());
    setTemplateName('');
    setIsSaving(false);
  };

  const handleLoad = (id: string) => {
    const templateConfig = loadTemplate(id);
    if (templateConfig) {
      loadConfig(templateConfig);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que querés eliminar esta plantilla?')) {
      deleteTemplate(id);
      setTemplates(getSavedTemplates());
    }
  };

  if (templates.length === 0 && !isSaving) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          Plantillas
        </h2>
        <div className="text-center py-8 text-dark-400 bg-dark-700/30 rounded-lg">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay plantillas guardadas</p>
          <button
            onClick={() => setIsSaving(true)}
            className="mt-3 text-primary hover:text-primary-light transition-colors text-sm"
          >
            + Guardar plantilla actual
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-primary" />
        Plantillas Guardadas
      </h2>

      {isSaving ? (
        <div className="bg-dark-700/30 rounded-lg p-4 space-y-3">
          <p className="text-sm text-dark-400">
            Guardar configuración actual como plantilla:
          </p>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nombre de la plantilla"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" icon={Save}>
              Guardar
            </Button>
            <Button
              onClick={() => setIsSaving(false)}
              variant="secondary"
              size="sm"
              icon={X}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsSaving(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-dark-600 rounded-lg text-dark-400 hover:text-white hover:border-dark-500 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar configuración actual
          </button>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg group"
              >
                <div>
                  <p className="text-white font-medium">{template.name}</p>
                  <p className="text-dark-500 text-xs">
                    {new Date(template.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleLoad(template.id)}
                    className="p-1.5 text-dark-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                    title="Cargar plantilla"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Eliminar plantilla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
