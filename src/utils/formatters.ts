/**
 * Utilidades para formateo de valores
 */

export const formatters = {
  /**
   * Formatea un número como moneda
   */
  currency: (value: number | string, currency = 'USD', locale = 'es-AR'): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  },

  /**
   * Formatea un número como porcentaje
   */
  percentage: (value: number | string, decimals = 2, locale = 'es-AR'): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue / 100);
  },

  /**
   * Formatea un número con separadores de miles
   */
  number: (value: number | string, decimals = 0, locale = 'es-AR'): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  },

  /**
   * Formatea una fecha
   */
  date: (value: Date | string | number, locale = 'es-AR', options?: Intl.DateTimeFormatOptions): string => {
    if (!value) return '';

    const dateValue = typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : value;

    if (isNaN(dateValue.getTime())) return String(value);

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateValue);
  },

  /**
   * Formatea un número compacto (ej: 1.5K, 2.3M)
   */
  compact: (value: number | string, locale = 'es-AR'): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(numValue);
  },

  /**
   * Capitaliza la primera letra de cada palabra
   */
  capitalize: (value: string): string => {
    if (!value) return '';
    return value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  /**
   * Trunca un texto con ellipsis
   */
  truncate: (value: string, maxLength = 50): string => {
    if (!value || value.length <= maxLength) return value;
    return value.slice(0, maxLength) + '...';
  },
};

export const parseValue = {
  /**
   * Intenta convertir un valor a número
   */
  toNumber: (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remover símbolo de moneda y comas para parsear
      const cleaned = value.replace(/[$,]/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  },

  /**
   * Intenta convertir un valor a fecha
   */
  toDate: (value: unknown): Date | null => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  },

  /**
   * Detecta el tipo de un valor
   * Reglas:
   * - Strings con $ son números (moneda)
   * - Strings alfanuméricos (ej: SV-25042) son texto
   * - Strings solo numéricos son números
   */
  getType: (value: unknown): 'string' | 'number' | 'boolean' | 'date' | 'empty' => {
    if (value === null || value === undefined || value === '') return 'empty';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // Si tiene símbolo de moneda, es número
      if (trimmed.includes('$')) return 'number';

      // Si parece fecha ISO, es fecha
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return 'date';

      // Si es solo numérico (con posible signo decimal y negativo), es número
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) return 'number';

      // Si tiene letras y números mezclados (ej: SV-25042), es texto
      if (/[a-zA-Z]/.test(trimmed)) return 'string';

      // Por defecto, string
      return 'string';
    }
    return 'string';
  },
};
