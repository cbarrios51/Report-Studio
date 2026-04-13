import { Palette } from 'lucide-react';
import { useReportConfig } from '@/hooks/useReportConfig';
import type { ColorPalette } from '@/types/report';
import { DEFAULT_THEMES } from '@/types/report';

export function ThemeSelector() {
  const { theme, updateTheme } = useReportConfig();

  const palettes: Array<{
    id: ColorPalette;
    name: string;
    color: string;
  }> = [
    { id: 'blue', name: 'Azul', color: '#0070C0' },
    { id: 'green', name: 'Verde', color: '#059669' },
    { id: 'orange', name: 'Naranja', color: '#ea580c' },
    { id: 'cyan', name: 'Cyan', color: '#0891b2' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Palette className="w-5 h-5 text-primary" />
        Tema de Color
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {palettes.map((palette) => (
          <button
            key={palette.id}
            onClick={() => {
              const newTheme = DEFAULT_THEMES[palette.id];
              updateTheme(newTheme);
            }}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all
              ${theme.headerColor === palette.color
                ? 'border-primary bg-primary/10'
                : 'border-dark-600 bg-dark-700/30 hover:bg-dark-700/50'
              }
            `}
          >
            <div
              className="w-8 h-8 rounded-lg shadow-sm"
              style={{ backgroundColor: palette.color }}
            />
            <span className="text-white font-medium">{palette.name}</span>
          </button>
        ))}
      </div>

      {/* Color personalizado */}
      <div>
        <label className="block text-sm text-dark-400 mb-2">
          Color personalizado
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={theme.headerColor}
            onChange={(e) => updateTheme({ headerColor: e.target.value })}
            className="w-12 h-10 rounded-lg bg-dark-700 border border-dark-600 cursor-pointer"
          />
          <input
            type="text"
            value={theme.headerColor}
            onChange={(e) => updateTheme({ headerColor: e.target.value })}
            className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
