/**
 * Hook para gestión del estado global del reporte
 * Usa React Context + useReducer
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import type { ReportSection } from '@/types/sections';
import type { ReportConfig, ReportContext, ReportTheme } from '@/types/report';
import { createDefaultTemplate } from '@/utils/templates';

// ============ TYPES ============

type ReportAction =
  | { type: 'SET_CONFIG'; payload: ReportConfig }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<ReportContext> }
  | { type: 'UPDATE_THEME'; payload: Partial<ReportTheme> }
  | { type: 'ADD_SECTION'; payload: ReportSection }
  | { type: 'UPDATE_SECTION'; payload: { id: string; updates: Partial<ReportSection> } }
  | { type: 'REMOVE_SECTION'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'LOAD_TEMPLATE'; payload: ReportConfig }
  | { type: 'RESET' };

interface ReportState {
  config: ReportConfig;
  isDirty: boolean;
}

interface ReportContextType {
  config: ReportConfig;
  context: ReportContext;
  theme: ReportTheme;
  sections: ReportSection[];
  isDirty: boolean;
  setConfig: (config: ReportConfig) => void;
  updateContext: (context: Partial<ReportContext>) => void;
  updateTheme: (theme: Partial<ReportTheme>) => void;
  addSection: (section: ReportSection) => void;
  updateSection: (id: string, updates: Partial<ReportSection>) => void;
  removeSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  loadTemplate: (template: ReportConfig) => void;
  reset: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

// ============ REDUCER ============

const initialState: ReportState = {
  config: createDefaultTemplate(),
  isDirty: false,
};

function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
        isDirty: true,
      };

    case 'UPDATE_CONTEXT':
      return {
        ...state,
        config: {
          ...state.config,
          context: {
            ...state.config.context,
            ...action.payload,
          },
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'UPDATE_THEME':
      return {
        ...state,
        config: {
          ...state.config,
          theme: {
            ...state.config.theme,
            ...action.payload,
          },
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'ADD_SECTION':
      return {
        ...state,
        config: {
          ...state.config,
          sections: [...state.config.sections, action.payload],
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'UPDATE_SECTION':
      return {
        ...state,
        config: {
          ...state.config,
          sections: state.config.sections.map((section) => {
            if (section.id === action.payload.id) {
              return { ...section, ...action.payload.updates } as ReportSection;
            }
            return section;
          }),
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'REMOVE_SECTION':
      return {
        ...state,
        config: {
          ...state.config,
          sections: state.config.sections.filter(s => s.id !== action.payload),
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'REORDER_SECTIONS':
      const newSections = [...state.config.sections];
      const [removed] = newSections.splice(action.payload.fromIndex, 1);
      newSections.splice(action.payload.toIndex, 0, removed);
      return {
        ...state,
        config: {
          ...state.config,
          sections: newSections,
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'LOAD_TEMPLATE':
      return {
        ...state,
        config: action.payload,
        isDirty: true,
      };

    case 'RESET':
      return {
        ...state,
        config: createDefaultTemplate(),
        isDirty: false,
      };

    default:
      return state;
  }
}

// ============ CONTEXT ============

const ReportConfigContext = createContext<ReportContextType | undefined>(undefined);

interface ReportConfigProviderProps {
  children: ReactNode;
}

export function ReportConfigProvider({ children }: ReportConfigProviderProps) {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  // Cargar desde localStorage al montar
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('currentReportConfig');
      if (stored) {
        const parsed = JSON.parse(stored) as ReportConfig;
        // Convertir fechas
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        dispatch({ type: 'LOAD_TEMPLATE', payload: parsed });
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  const setConfig = useCallback((config: ReportConfig) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const updateContext = useCallback((context: Partial<ReportContext>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: context });
  }, []);

  const updateTheme = useCallback((theme: Partial<ReportTheme>) => {
    dispatch({ type: 'UPDATE_THEME', payload: theme });
  }, []);

  const addSection = useCallback((section: ReportSection) => {
    dispatch({ type: 'ADD_SECTION', payload: section });
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<ReportSection>) => {
    dispatch({ type: 'UPDATE_SECTION', payload: { id, updates } });
  }, []);

  const removeSection = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_SECTION', payload: id });
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_SECTIONS', payload: { fromIndex, toIndex } });
  }, []);

  const loadTemplate = useCallback((template: ReportConfig) => {
    dispatch({ type: 'LOAD_TEMPLATE', payload: template });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('currentReportConfig', JSON.stringify(state.config));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state.config]);

  const value = useMemo(
    () => ({
      config: state.config,
      context: state.config.context,
      theme: state.config.theme,
      sections: state.config.sections,
      isDirty: state.isDirty,
      setConfig,
      updateContext,
      updateTheme,
      addSection,
      updateSection,
      removeSection,
      reorderSections,
      loadTemplate,
      reset,
      saveToLocalStorage,
      loadFromLocalStorage,
    }),
    [
      state.config,
      state.isDirty,
      setConfig,
      updateContext,
      updateTheme,
      addSection,
      updateSection,
      removeSection,
      reorderSections,
      loadTemplate,
      reset,
      saveToLocalStorage,
      loadFromLocalStorage,
    ]
  );

  return (
    <ReportConfigContext.Provider value={value}>
      {children}
    </ReportConfigContext.Provider>
  );
}

// ============ HOOK ============

export function useReportConfig(): ReportContextType {
  const context = useContext(ReportConfigContext);
  if (context === undefined) {
    throw new Error('useReportConfig must be used within a ReportConfigProvider');
  }
  return context;
}
