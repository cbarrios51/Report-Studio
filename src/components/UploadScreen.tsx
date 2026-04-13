import React, { useCallback, useState } from 'react';
import { FileSpreadsheet, Upload, AlertCircle, Loader2 } from 'lucide-react';

interface UploadScreenProps {
  onFileLoaded: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export function UploadScreen({ onFileLoaded, isLoading, error }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) return;
    onFileLoaded(file);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-screen bg-dark-950 nothing-dot-grid flex flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Top-left brand mark */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-dark-400 text-xs font-mono tracking-widest uppercase">Report Studio</span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-xl animate-fade-in">

        {/* Brand */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 mb-6"
            style={{ border: '1px solid #2a2a2a', borderRadius: 0 }}
          >
            <FileSpreadsheet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Report Studio
          </h1>
          <p className="text-dark-400 text-sm font-light">
            Cargá tu Excel y generamos el reporte automáticamente
          </p>
        </div>

        {/* Drop zone */}
        <label
          htmlFor="file-input"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`block w-full cursor-pointer transition-all duration-150 ${isLoading ? 'pointer-events-none' : ''}`}
          style={{
            border: `1px solid ${isDragging ? '#ff3333' : '#2a2a2a'}`,
            borderRadius: 0,
            background: isDragging ? 'rgba(255,51,51,0.04)' : '#0a0a0a',
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={handleInputChange}
            disabled={isLoading}
          />

          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            {isLoading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-5" />
                <p className="text-white font-medium mb-1">Analizando archivo…</p>
                <p className="text-dark-500 text-sm font-light">Detectando tablas, métricas y generando secciones</p>
              </>
            ) : (
              <>
                <Upload className={`w-8 h-8 mb-5 transition-colors ${isDragging ? 'text-primary' : 'text-dark-500'}`} />
                <p className="text-white font-medium mb-1">
                  {isDragging ? 'Soltá el archivo aquí' : 'Arrastrá tu archivo Excel'}
                </p>
                <p className="text-dark-500 text-sm font-light mb-6">
                  o hacé click para seleccionar desde tu computadora
                </p>
                <div
                  className="inline-flex items-center gap-2 text-white text-xs font-medium px-6 py-2.5 transition-colors"
                  style={{ border: '1px solid #2a2a2a', borderRadius: 0, background: '#1a1a1a' }}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Seleccionar .xlsx / .xls
                </div>
              </>
            )}
          </div>
        </label>

        {/* Error */}
        {error && (
          <div
            className="mt-4 flex items-start gap-3 p-4"
            style={{ border: '1px solid rgba(255,51,51,0.3)', background: 'rgba(255,51,51,0.05)' }}
          >
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-primary text-sm font-medium">Error al cargar el archivo</p>
              <p className="text-dark-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Feature pills */}
        <div className="mt-8 grid grid-cols-3 gap-px" style={{ background: '#1a1a1a' }}>
          {[
            { label: 'Tablas', desc: 'Pivot automático por categoría' },
            { label: 'Gráficos', desc: 'Bar, pie y line charts' },
            { label: 'KPIs', desc: 'Totales y métricas clave' },
          ].map((f) => (
            <div key={f.label} className="p-5 text-center" style={{ background: '#0a0a0a' }}>
              <p className="text-white text-xs font-semibold mb-1">{f.label}</p>
              <p className="text-dark-500 text-xs font-light">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom version mark */}
      <div className="absolute bottom-8 right-8">
        <span className="text-dark-700 text-[10px] font-mono">v2.0</span>
      </div>
    </div>
  );
}
