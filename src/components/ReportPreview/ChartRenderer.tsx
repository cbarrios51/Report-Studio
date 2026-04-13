import React from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ExcelSheet } from '@/types/excel';
import type { ChartSection as ChartSectionType } from '@/types/sections';

interface ChartRendererProps {
  section: ChartSectionType;
  sheet: ExcelSheet | null;
}

const COLORS = ['#0070C0', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1e293b',
    fontSize: 12,
  },
};

// Máximo de puntos para evitar que el gráfico colapse con demasiadas categorías
const MAX_CHART_POINTS = 15;

export function ChartRenderer({ section, sheet }: ChartRendererProps) {
  const { data, truncated } = React.useMemo(() => {
    let raw: { name: string; value: number }[] = [];

    if (section.chartData && section.chartData.length > 0) {
      raw = section.chartData.map(d => ({ name: d.label, value: d.value }));
    } else if (sheet && sheet.data.length) {
      raw = sheet.data.map(row => {
        const point: Record<string, any> = { name: String(row[section.xColumn] ?? '') };
        section.yColumns.forEach(col => {
          point[col] = typeof row[col] === 'number' ? row[col] : parseFloat(String(row[col])) || 0;
        });
        return point as { name: string; value: number };
      });
    }

    if (raw.length > MAX_CHART_POINTS) {
      const top = raw.slice(0, MAX_CHART_POINTS);
      const othersValue = raw.slice(MAX_CHART_POINTS).reduce((s, d) => s + (d.value ?? 0), 0);
      if (othersValue > 0) top.push({ name: 'Otros', value: othersValue });
      return { data: top, truncated: true };
    }
    return { data: raw, truncated: false };
  }, [section.chartData, sheet, section.xColumn, section.yColumns]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  // Deshabilitar leyenda si hay muchos items para evitar que colapsen el gráfico
  const showLegend = section.showLegend && data.length <= 8;
  const colors = section.colors?.length ? section.colors : COLORS;
  const yKeys = section.chartData ? ['value'] : section.yColumns;

  const truncatedNote = truncated ? (
    <p className="text-xs text-gray-400 mb-1">Mostrando top {MAX_CHART_POINTS} categorías</p>
  ) : null;

  if (section.chartType === 'pie' || section.chartType === 'donut') {
    return (
      <>
        {truncatedNote}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={section.chartType === 'donut' ? 65 : 0}
              outerRadius={110}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              labelLine
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: number) => v.toLocaleString('en-US')} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </PieChart>
        </ResponsiveContainer>
      </>
    );
  }

  if (section.chartType === 'line') {
    return (
      <>
        {truncatedNote}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 50, left: 10 }}>
            {section.showGridLines && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => v.toLocaleString('en-US')} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: colors[i % colors.length] }}
                activeDot={{ r: 6 }}
                name={key === 'value' ? section.title : key}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </>
    );
  }

  // Bar (default)
  return (
    <>
      {truncatedNote}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 60, left: 10 }}>
          {section.showGridLines && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => v.toLocaleString('en-US')} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              name={key === 'value' ? section.title : key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
