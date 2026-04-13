/**
 * Hook para lectura de archivos Excel con SheetJS
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { ExcelFile, ExcelSheet } from '@/types/excel';
import { parseSheet } from '@/utils/excelParser';

interface UseExcelReaderReturn {
  excelFile: ExcelFile | null;
  isLoading: boolean;
  error: string | null;
  selectedSheet: string | null;
  selectedSheetData: ExcelSheet | null;
  loadFile: (file: File) => Promise<void>;
  selectSheet: (sheetName: string) => void;
  resetFile: () => void;
}

/**
 * Hook personalizado para leer archivos Excel
 */
export function useExcelReader(): UseExcelReaderReturn {
  const [excelFile, setExcelFile] = useState<ExcelFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

  /**
   * Lee un archivo Excel y extrae todas sus hojas
   */
  const loadFile = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellText: true,
      });

      const sheets: ExcelSheet[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const normalized = parseSheet(worksheet);

        const columnTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'> = {};
        normalized.headers.forEach((header) => {
          const sampleValue = normalized.rows.find(
            (row) => row[header] !== null && row[header] !== undefined
          )?.[header];
          columnTypes[header] = typeof sampleValue === 'number' ? 'number' : 'string';
        });

        sheets.push({
          name: sheetName,
          data: normalized.rows,
          headers: normalized.headers,
          isTabular: normalized.rows.length >= 2 && normalized.headers.length >= 2,
          columnTypes,
          metadata: {
            title: normalized.metadata.title,
            subtitle: null,
            period: normalized.metadata.period,
          },
          parsedSheet: normalized,
        });
      }

      setExcelFile({
        name: file.name,
        sheets,
        uploadedAt: new Date(),
      });

      // Seleccionar automáticamente la primera hoja tabular
      const firstTabularSheet = sheets.find(s => s.isTabular);
      if (firstTabularSheet) {
        setSelectedSheet(firstTabularSheet.name);
      } else if (sheets.length > 0) {
        setSelectedSheet(sheets[0].name);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error leyendo el archivo Excel';
      setError(errorMessage);
      console.error('Error reading Excel file:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Selecciona una hoja específica
   */
  const selectSheet = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
  }, []);

  /**
   * Resetea el estado del archivo
   */
  const resetFile = useCallback(() => {
    setExcelFile(null);
    setSelectedSheet(null);
    setError(null);
  }, []);

  /**
   * Obtiene los datos de la hoja seleccionada
   */
  const selectedSheetData = excelFile && selectedSheet
    ? excelFile.sheets.find(s => s.name === selectedSheet) || null
    : null;

  return {
    excelFile,
    isLoading,
    error,
    selectedSheet,
    selectedSheetData,
    loadFile,
    selectSheet,
    resetFile,
  };
}
