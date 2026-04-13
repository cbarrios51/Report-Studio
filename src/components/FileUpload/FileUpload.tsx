import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  fileName?: string;
  onRemove?: () => void;
}

export function FileUpload({
  onFileLoaded,
  isLoading,
  error,
  fileName,
  onRemove,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file) return;

      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      const isExcel =
        validTypes.includes(file.type) ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');

      if (!isExcel) {
        alert('Por favor sube un archivo Excel válido (.xlsx o .xls)');
        return;
      }

      onFileLoaded(file);
    },
    [onFileLoaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFile]
  );

  // Si ya hay un archivo cargado, mostrar estado
  if (fileName) {
    return (
      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white font-medium">{fileName}</p>
              <p className="text-dark-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Archivo cargado exitosamente
              </p>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-400 hover:text-white"
              title="Eliminar archivo"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zona de Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-12
          transition-all duration-300 cursor-pointer
          ${
            isDragOver
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-dark-600 bg-dark-800/30 hover:border-dark-500 hover:bg-dark-800/50'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="text-center space-y-4">
          <div
            className={`
              w-16 h-16 mx-auto rounded-2xl flex items-center justify-center
              transition-all duration-300
              ${
                isDragOver
                  ? 'bg-primary text-white scale-110'
                  : 'bg-dark-700 text-dark-300'
              }
            `}
          >
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <p className="text-lg font-medium text-white">
              {isDragOver ? 'Soltá el archivo aquí' : 'Arrastrá tu archivo Excel'}
            </p>
            <p className="text-dark-400 mt-1">
              o hacé clic para seleccionar
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-dark-500">
            <FileSpreadsheet className="w-4 h-4" />
            <span>.xlsx o .xls</span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-dark-900/80 rounded-xl flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white">Procesando archivo...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
