import type { ReportSection } from '@/types/sections';
import type { ExcelSheet } from '@/types/excel';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(value: number, isCurrency = false): string {
  if (isCurrency) {
    if (Math.abs(value) >= 1_000_000)
      return `$${(value / 1_000_000).toFixed(2)}M`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000)
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const CURRENCY_RE =
  /\$|€|monto|amount|importe|total|flete|freight|precio|price|costo|cost|valor|value|revenue|ingreso/i;

// ─── KPI computation ──────────────────────────────────────────────────────────

function computeKpiValue(
  metric: { field: string; aggregation: string },
  sheet: ExcelSheet | null
): number {
  if (!sheet) return 0;
  const values = sheet.data
    .map((row) => row[metric.field])
    .filter((v): v is number => typeof v === 'number');

  switch (metric.aggregation) {
    case 'sum': return values.reduce((s, v) => s + v, 0);
    case 'avg': return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    case 'count': return sheet.data.length;
    case 'max': return values.length ? Math.max(...values) : 0;
    case 'min': return values.length ? Math.min(...values) : 0;
    default: return values.reduce((s, v) => s + v, 0);
  }
}

// ─── Paragraph builders ───────────────────────────────────────────────────────

export interface Paragraph {
  heading: string;
  text: string;
}

function buildKpiParagraph(
  section: ReportSection & { type: 'kpi' },
  sheets: ExcelSheet[]
): Paragraph | null {
  const sheet = 'sourceSheet' in section
    ? sheets.find((s) => s.name === (section as any).sourceSheet) ?? null
    : null;

  const computed = section.metrics.map((metric) => {
    const val = computeKpiValue(metric, sheet);
    const isCurr = metric.format === 'currency' || CURRENCY_RE.test(metric.label);
    return { label: metric.label, val, isCurr, fmtVal: fmt(val, isCurr) };
  }).filter((m) => m.val !== 0 || m.label.toLowerCase().includes('registro'));

  if (computed.length === 0) return null;

  // Build narrative: list metrics naturally, then highlight notable ones
  const metricList = computed
    .map((m) => `**${m.fmtVal}** en ${m.label.toLowerCase()}`)
    .join(', ');

  const sentences: string[] = [];
  sentences.push(`El reporte contabiliza ${metricList}.`);

  // If there are currency metrics, note the biggest one
  const currMetrics = computed.filter((m) => m.isCurr).sort((a, b) => b.val - a.val);
  if (currMetrics.length > 0) {
    const top = currMetrics[0];
    sentences.push(
      `El rubro de mayor valor monetario es **${top.label}** con **${top.fmtVal}**.`
    );
  }

  return { heading: section.title, text: sentences.join(' ') };
}

function buildTableParagraph(
  section: ReportSection & { type: 'table' }
): Paragraph | null {
  const { rows, columns } = section as any;
  if (!rows || rows.length === 0 || !columns || columns.length === 0) return null;

  const dataRows: Record<string, any>[] = rows.filter((r: any) => !r._isTotal);
  if (dataRows.length === 0) return null;

  const labelCol = columns[0] as string;
  const numCols = (columns as string[]).filter((c) => {
    if (c === '%' || c === labelCol) return false;
    const vals = dataRows.map((r) => r[c]).filter((v) => v !== null && v !== undefined && v !== '');
    const numCount = vals.filter((v) => typeof v === 'number').length;
    return vals.length > 0 && numCount / vals.length > 0.5;
  });

  const sentences: string[] = [];

  if (numCols.length > 0) {
    const mainCol = numCols[0];
    const isCurr = CURRENCY_RE.test(mainCol);

    const totalRow = rows.find((r: any) => r._isTotal);
    const total = totalRow ? Number(totalRow[mainCol]) || 0 : null;

    const sorted = [...dataRows].sort(
      (a, b) => (Number(b[mainCol]) || 0) - (Number(a[mainCol]) || 0)
    );

    // Opening: total and count
    const countStr = `${dataRows.length} ${dataRows.length === 1 ? 'categoría' : 'categorías'}`;
    if (total && total > 0) {
      sentences.push(
        `La distribución comprende **${countStr}** con un total acumulado de **${fmt(total, isCurr)}**.`
      );
    } else {
      sentences.push(`La distribución comprende **${countStr}**.`);
    }

    // Leader
    const top = sorted[0];
    const topVal = Number(top[mainCol]) || 0;
    const topPct = total && total > 0 ? `${((topVal / total) * 100).toFixed(1)}%` : null;
    sentences.push(
      topPct
        ? `**${top[labelCol]}** es el valor dominante con **${fmt(topVal, isCurr)}**, representando el **${topPct}** del total.`
        : `**${top[labelCol]}** es el valor dominante con **${fmt(topVal, isCurr)}**.`
    );

    // Full ranking if ≤ 6 items
    if (sorted.length <= 6 && sorted.length > 1) {
      const ranking = sorted.map((r, i) => {
        const v = Number(r[mainCol]) || 0;
        const pct = total && total > 0 ? ` (${((v / total) * 100).toFixed(1)}%)` : '';
        return `${i + 1}. ${r[labelCol]}: **${fmt(v, isCurr)}**${pct}`;
      }).join('; ');
      sentences.push(`Ranking completo — ${ranking}.`);
    } else if (sorted.length > 6) {
      // Top 3 + tail
      const top3 = sorted.slice(0, 3);
      const top3Sum = top3.reduce((s, r) => s + (Number(r[mainCol]) || 0), 0);
      const top3Pct = total && total > 0 ? `${((top3Sum / total) * 100).toFixed(1)}%` : null;
      const names = top3.map((r) => `${r[labelCol]} (${fmt(Number(r[mainCol]) || 0, isCurr)})`).join(', ');
      if (top3Pct) {
        sentences.push(`Los 3 primeros — ${names} — concentran el **${top3Pct}** del total.`);
      }

      const bottom = sorted[sorted.length - 1];
      const bottomVal = Number(bottom[mainCol]) || 0;
      sentences.push(
        `El menor registro es **${bottom[labelCol]}** con **${fmt(bottomVal, isCurr)}**.`
      );
    }

    // Additional numeric columns
    for (const col of numCols.slice(1, 3)) {
      const colIsCurr = CURRENCY_RE.test(col);
      const colTotal = totalRow ? Number(totalRow[col]) || 0 : null;
      const colTop = [...dataRows].sort((a, b) => (Number(b[col]) || 0) - (Number(a[col]) || 0))[0];
      if (colTop) {
        const colTopVal = Number(colTop[col]) || 0;
        const note = colTotal && colTotal > 0
          ? ` (total: **${fmt(colTotal, colIsCurr)}**)`
          : '';
        sentences.push(
          `En cuanto a **${col}**, ${colTop[labelCol]} lidera con **${fmt(colTopVal, colIsCurr)}**${note}.`
        );
      }
    }
  }

  return { heading: section.title, text: sentences.join(' ') };
}

function buildDetailParagraph(
  section: ReportSection & { type: 'detail' }
): Paragraph | null {
  const { rows, groupByColumn, displayColumns } = section as any;
  if (!rows || rows.length === 0 || !groupByColumn) return null;

  const counts: Record<string, number> = {};
  (rows as Record<string, any>[]).forEach((r) => {
    const key = String(r[groupByColumn] ?? '').trim();
    if (!key) return;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const total = sorted.reduce((s, [, v]) => s + v, 0);
  const sentences: string[] = [];

  sentences.push(
    `Se registraron **${fmt(total)} elementos** en total agrupados por **${groupByColumn}**.`
  );

  // Full breakdown
  const breakdown = sorted
    .map(([k, v]) => `**${k}**: ${fmt(v)} registros (${((v / total) * 100).toFixed(1)}%)`)
    .join(', ');
  sentences.push(`Desglose: ${breakdown}.`);

  // Concentration note
  const top = sorted[0];
  const topPct = ((top[1] / total) * 100).toFixed(1);
  if (parseFloat(topPct) >= 50) {
    sentences.push(
      `**${top[0]}** concentra más de la mitad del total (**${topPct}%**), lo que indica una alta concentración en este grupo.`
    );
  } else {
    sentences.push(
      `**${top[0]}** es el grupo más frecuente representando el **${topPct}%** del total.`
    );
  }

  if (displayColumns && (displayColumns as string[]).length > 0) {
    sentences.push(
      `Cada registro detalla los campos: ${(displayColumns as string[]).join(', ')}.`
    );
  }

  return { heading: section.title, text: sentences.join(' ') };
}

function buildChartParagraph(
  section: ReportSection & { type: 'chart' }
): Paragraph | null {
  const chartData = (section as any).chartData as
    | { label: string; value: number }[]
    | undefined;
  if (!chartData || chartData.length < 2) return null;

  const sorted = [...chartData].sort((a, b) => b.value - a.value);
  const isCurr = CURRENCY_RE.test(section.title);
  const total = sorted.reduce((s, d) => s + d.value, 0);

  const sentences: string[] = [];

  // Skip chart paragraph if a table already covers the same data
  // (tables generate more detail; chart would be redundant)
  // We still generate for line/timeseries charts
  const chartType = (section as any).chartType as string | undefined;
  if (chartType === 'line') {
    const first = sorted[sorted.length - 1]; // lowest index ≈ first period
    const last = sorted[0];
    const change = total > 0 ? ((last.value - first.value) / (first.value || 1) * 100).toFixed(1) : null;
    sentences.push(
      `La serie temporal muestra que **${last.label}** es el período con mayor valor (**${fmt(last.value, isCurr)}**).`
    );
    if (change !== null && first.label !== last.label) {
      const dir = parseFloat(change) >= 0 ? 'un incremento' : 'una caída';
      sentences.push(
        `Comparado con **${first.label}** (**${fmt(first.value, isCurr)}**), la variación es ${dir} del **${Math.abs(parseFloat(change)).toFixed(1)}%**.`
      );
    }
  } else {
    const top = sorted[0];
    const topPct = total > 0 ? `${((top.value / total) * 100).toFixed(1)}%` : null;
    sentences.push(
      topPct
        ? `**${top.label}** lidera con **${fmt(top.value, isCurr)}** (**${topPct}** del total de **${fmt(total, isCurr)}**).`
        : `**${top.label}** lidera con **${fmt(top.value, isCurr)}**.`
    );

    const bottom = sorted[sorted.length - 1];
    sentences.push(
      `El menor valor corresponde a **${bottom.label}** con **${fmt(bottom.value, isCurr)}**.`
    );
  }

  return { heading: section.title, text: sentences.join(' ') };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function analyzeReport(
  sections: ReportSection[],
  sheets: ExcelSheet[] = []
): Paragraph[] {
  const visible = sections.filter((s) => s.visible);
  const paragraphs: Paragraph[] = [];

  // Track which section titles have been covered by a table so we skip redundant chart paragraphs
  const coveredByTable = new Set<string>();

  for (const section of visible) {
    if (section.type === 'table') {
      const p = buildTableParagraph(section);
      if (p) {
        paragraphs.push(p);
        // Mark chart with same subject as covered
        const subject = section.title.replace(/^distribución por /i, '').toLowerCase();
        coveredByTable.add(subject);
      }
    }
  }

  for (const section of visible) {
    if (section.type === 'kpi') {
      const p = buildKpiParagraph(section, sheets);
      if (p) paragraphs.unshift(p); // KPIs go first
    } else if (section.type === 'detail') {
      const p = buildDetailParagraph(section);
      if (p) paragraphs.push(p);
    } else if (section.type === 'chart') {
      const chartType = (section as any).chartType as string | undefined;
      const subject = section.title.replace(/^gráfico (por |de )?/i, '').toLowerCase();
      // Only add chart paragraph for line charts or if not covered by a table
      if (chartType === 'line' || !coveredByTable.has(subject)) {
        const p = buildChartParagraph(section);
        if (p) paragraphs.push(p);
      }
    }
  }

  return paragraphs;
}
