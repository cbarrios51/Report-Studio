/**
 * Tipos para configuración del reporte
 */

import type { ReportSection } from './sections';

export interface ReportContext {
  title: string;
  period: string;
  department: string;
  description: string;
  recipient: string;
}

export interface ReportTheme {
  headerColor: string;
  sectionBackgroundColor: string;
  tableHeaderColor: string;
  tableAlternateRowColor: string;
  textColor: string;
  accentColor: string;
}

export interface ReportConfig {
  context: ReportContext;
  sections: ReportSection[];
  theme: ReportTheme;
  analysisMode: 'auto' | 'raw';
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  config: ReportConfig;
  createdAt: Date;
}

export type ColorPalette = 'blue' | 'green' | 'orange' | 'cyan' | 'custom';

export const DEFAULT_THEMES: Record<ColorPalette, ReportTheme> = {
  blue: {
    headerColor: '#0070C0',
    sectionBackgroundColor: 'rgba(0, 112, 192, 0.05)',
    tableHeaderColor: '#0070C0',
    tableAlternateRowColor: 'rgba(0, 112, 192, 0.02)',
    textColor: '#1e293b',
    accentColor: '#0099ff',
  },
  green: {
    headerColor: '#059669',
    sectionBackgroundColor: 'rgba(5, 150, 105, 0.05)',
    tableHeaderColor: '#059669',
    tableAlternateRowColor: 'rgba(5, 150, 105, 0.02)',
    textColor: '#1e293b',
    accentColor: '#10b981',
  },
  orange: {
    headerColor: '#ea580c',
    sectionBackgroundColor: 'rgba(234, 88, 12, 0.05)',
    tableHeaderColor: '#ea580c',
    tableAlternateRowColor: 'rgba(234, 88, 12, 0.02)',
    textColor: '#1e293b',
    accentColor: '#f59e0b',
  },
  cyan: {
    headerColor: '#0891b2',
    sectionBackgroundColor: 'rgba(8, 145, 178, 0.05)',
    tableHeaderColor: '#0891b2',
    tableAlternateRowColor: 'rgba(8, 145, 178, 0.02)',
    textColor: '#1e293b',
    accentColor: '#06b6d4',
  },
  custom: {
    headerColor: '#0070C0',
    sectionBackgroundColor: 'rgba(0, 112, 192, 0.05)',
    tableHeaderColor: '#0070C0',
    tableAlternateRowColor: 'rgba(0, 112, 192, 0.02)',
    textColor: '#1e293b',
    accentColor: '#0099ff',
  },
};
