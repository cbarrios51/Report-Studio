/**
 * Hook para exportación de reportes
 */

import { useState, useCallback } from 'react';
import {
  copyToClipboard as copyImage,
  exportToHtml as exportHtmlFile,
  printReport,
} from '@/utils/pdfExport';

interface UseExportReturn {
  isExporting: boolean;
  error: string | null;
  exportToPdf: (elementId: string, filename?: string) => Promise<void>;
  exportToImage: (elementId: string, filename?: string) => Promise<void>;
  copyToClipboard: (elementId: string) => Promise<void>;
  exportToHtml: (elementId: string, filename?: string) => Promise<void>;
  print: (elementId: string) => void;
}

/**
 * Hook para manejar exportaciones
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName: string
    ): Promise<T> => {
      setIsExporting(true);
      setError(null);

      try {
        const result = await operation();
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Error en ${operationName}`;
        setError(errorMessage);
        console.error(`${operationName}:`, err);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportPdf = useCallback(
    async (elementId: string, filename?: string): Promise<void> => {
      return handleExport(
        () => import('@/utils/pdfExport').then(({ exportToPdf }) => exportToPdf(elementId, filename)),
        'exportar a PDF'
      );
    },
    [handleExport]
  );

  const exportImage = useCallback(
    async (elementId: string, filename?: string): Promise<void> => {
      return handleExport(
        () => import('@/utils/pdfExport').then(({ exportToImage }) => exportToImage(elementId, filename)),
        'exportar a imagen'
      );
    },
    [handleExport]
  );

  const copyImageToClipboard = useCallback(
    async (elementId: string): Promise<void> => {
      return handleExport(
        () => copyImage(elementId),
        'copiar al portapapeles'
      );
    },
    [handleExport]
  );

  const exportHtmlToFile = useCallback(
    async (elementId: string, filename?: string): Promise<void> => {
      return handleExport(
        () => exportHtmlFile(elementId, filename),
        'exportar a HTML'
      );
    },
    [handleExport]
  );

  const print = useCallback((elementId: string): void => {
    try {
      printReport(elementId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al imprimir';
      setError(errorMessage);
      console.error('print:', err);
    }
  }, []);

  return {
    isExporting,
    error,
    exportToPdf: exportPdf,
    exportToImage: exportImage,
    copyToClipboard: copyImageToClipboard,
    exportToHtml: exportHtmlToFile,
    print,
  };
}
