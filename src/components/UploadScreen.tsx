import React, { useCallback, useState } from 'react';
import { FileSpreadsheet, Upload, AlertCircle, Loader2, BarChart3, Table2, Layers } from 'lucide-react';

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
    <div
      className="min-h-screen studio-grid flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ background: '#070C1A' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(79,142,247,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Top-left brand */}
      <div className="absolute top-7 left-7 flex items-center gap-2.5">
        <div
          className="flex items-center justify-center w-7 h-7"
          style={{ background: 'linear-gradient(135deg,#4F8EF7,#2563EB)', borderRadius: 7 }}
        >
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold" style={{ color: '#EDF2FF' }}>Report Studio</span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-lg animate-fade-in relative z-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(37,99,235,0.1))',
              border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: 16,
            }}
          >
            <FileSpreadsheet className="w-7 h-7" style={{ color: '#4F8EF7' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2 gradient-text tracking-tight">
            Report Studio
          </h1>
          <p style={{ color: '#6B85A8', fontSize: 14 }}>
            Cargá tu Excel y generamos el reporte automáticamente
          </p>
        </div>

        {/* Drop zone */}
        <label
          htmlFor="file-input"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`block w-full cursor-pointer transition-all duration-200 ${isLoading ? 'pointer-events-none' : ''}`}
          style={{
            border: `2px dashed ${isDragging ? '#4F8EF7' : '#1E2D47'}`,
            borderRadius: 12,
            background: isDragging
              ? 'rgba(79,142,247,0.06)'
              : 'rgba(15,22,41,0.6)',
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

          <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
            {isLoading ? (
              <>
                <Loader2 className="w-9 h-9 mb-4 animate-spin" style={{ color: '#4F8EF7' }} />
                <p className="font-semibold mb-1" style={{ color: '#EDF2FF' }}>Analizando archivo…</p>
                <p className="text-sm" style={{ color: '#6B85A8' }}>Detectando tablas, métricas y generando secciones</p>
              </>
            ) : (
              <>
                <div
                  className="flex items-center justify-center w-12 h-12 mb-4 transition-all"
                  style={{
                    background: isDragging ? 'rgba(79,142,247,0.15)' : 'rgba(30,45,71,0.6)',
                    border: `1px solid ${isDragging ? 'rgba(79,142,247,0.4)' : '#2D4267'}`,
                    borderRadius: 10,
                  }}
                >
                  <Upload className="w-5 h-5 transition-colors" style={{ color: isDragging ? '#4F8EF7' : '#6B85A8' }} />
                </div>
                <p className="font-semibold mb-1.5" style={{ color: '#EDF2FF' }}>
                  {isDragging ? 'Soltá el archivo aquí' : 'Arrastrá tu archivo Excel'}
                </p>
                <p className="text-sm mb-6" style={{ color: '#6B85A8' }}>
                  o hacé click para seleccionar desde tu computadora
                </p>
                <div className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  Seleccionar archivo .xlsx
                </div>
              </>
            )}
          </div>
        </label>

        {/* Error */}
        {error && (
          <div
            className="mt-4 flex items-start gap-3 p-4"
            style={{
              border: '1px solid rgba(248,113,113,0.3)',
              background: 'rgba(248,113,113,0.06)',
              borderRadius: 8,
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F87171' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#F87171' }}>Error al cargar el archivo</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B85A8' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Feature cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: <Table2 className="w-4 h-4" />, label: 'Tablas', desc: 'Pivot automático', color: '#4F8EF7' },
            { icon: <BarChart3 className="w-4 h-4" />, label: 'Gráficos', desc: 'Bar, pie y línea', color: '#A78BFA' },
            { icon: <Layers className="w-4 h-4" />, label: 'KPIs', desc: 'Métricas clave', color: '#34D399' },
          ].map((f) => (
            <div
              key={f.label}
              className="p-4 text-center"
              style={{
                background: 'rgba(15,22,41,0.6)',
                border: '1px solid #1E2D47',
                borderRadius: 10,
              }}
            >
              <div className="flex justify-center mb-2" style={{ color: f.color }}>{f.icon}</div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#EDF2FF' }}>{f.label}</p>
              <p className="text-[11px]" style={{ color: '#6B85A8' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom version */}
      <div className="absolute bottom-7 right-7">
        <span className="text-xs font-mono" style={{ color: '#3E5470' }}>v2.0</span>
      </div>
    </div>
  );
}
