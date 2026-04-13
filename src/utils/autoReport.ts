import { ParsedSheet, ColumnInfo } from './excelParser'

export interface KPI {
  label: string
  value: number | string
  format: 'number' | 'raw' | 'percent' | 'currency'
}

export interface TableRow {
  [key: string]: any
  _isTotal?: boolean
}

export interface ReportSection {
  id: string
  type: 'kpi' | 'table' | 'chart' | 'detail'
  title: string
  kpis?: KPI[]
  tableHeaders?: string[]
  tableRows?: TableRow[]
  chartType?: 'bar' | 'pie' | 'line' | 'donut'
  chartData?: { label: string; value: number }[]
  // Para secciones de detalle agrupado
  groupByColumn?: string
  displayColumns?: string[]
  detailRows?: Record<string, any>[]
}

// ─── Detección de tipo de hoja ───────────────────────────────────────────────

type SheetProfile =
  | 'transactional'   // Registros individuales (entregas, órdenes)
  | 'timeseries'      // Datos por período (mes, semana, ciclo)
  | 'summary'         // Ya viene resumida/pivot (pocas filas, muchos números)
  | 'catalog'         // Lista de productos/items con precios

function detectProfile(data: ParsedSheet): SheetProfile {
  const { rows, columns } = data
  const numCols = columns.filter(c => c.type === 'numeric')
  const catCols = columns.filter(c => c.type === 'category')

  // ¿Tiene columna de tiempo/período?
  const hasTimeCol = columns.some(c =>
    /mes|month|semana|week|ciclo|cycle|periodo|period|fecha|date|año|year|trimestre|quarter/i.test(c.name)
  )
  if (hasTimeCol) return 'timeseries'

  // ¿Pocas filas con muchos números? → ya viene resumida
  // Umbral bajo (≤8) para evitar clasificar datos transaccionales de poco volumen como 'summary'
  if (rows.length <= 8 && numCols.length >= 3 && catCols.length >= 1) return 'summary'

  // ¿Columna de precio/costo sin categorías claras? → catálogo
  const hasPriceCols = columns.some(c =>
    /precio|price|costo|cost|tarifa|rate|valor|value/i.test(c.name) && c.type === 'numeric'
  )
  if (hasPriceCols && catCols.length === 0 && rows.length <= 50) return 'catalog'

  return 'transactional'
}

// ─── Detección de formato de columna ────────────────────────────────────────

function isCurrencyCol(col: ColumnInfo): boolean {
  return /\$|factura|invoice|monto|amount|importe|total|flete|freight|precio|price|costo|cost|valor|value|revenue|ingreso/i.test(col.name)
}

function isTimeCol(col: ColumnInfo): boolean {
  return /mes|month|semana|week|ciclo|cycle|periodo|period|fecha|date|año|year|trimestre|quarter/i.test(col.name)
}

// ─── Builder principal ───────────────────────────────────────────────────────

export function buildAutoReport(data: ParsedSheet): ReportSection[] {
  const { rows, columns } = data
  if (!rows.length) return []

  const profile = detectProfile(data)
  const numCols = columns.filter(c => c.type === 'numeric')
  const catCols = columns.filter(c => c.type === 'category')
  const sections: ReportSection[] = []

  // ── KPIs siempre presentes ──
  sections.push(buildKpiSection(rows, numCols))

  switch (profile) {
    case 'timeseries':
      sections.push(...buildTimeseriesSections(data, numCols, catCols))
      break
    case 'summary':
      sections.push(...buildSummarySections(data, numCols, catCols))
      break
    case 'catalog':
      sections.push(...buildCatalogSections(data, numCols, catCols))
      break
    default:
      sections.push(...buildTransactionalSections(data, numCols, catCols))
  }

  return sections
}

// ─── KPI Section ─────────────────────────────────────────────────────────────

function buildKpiSection(rows: Record<string, any>[], numCols: ColumnInfo[]): ReportSection {
  const kpis: KPI[] = [{ label: 'Total Registros', value: rows.length, format: 'number' }]

  numCols.slice(0, 4).forEach(col => {
    kpis.push({
      label: `Total ${col.name}`,
      value: col.sum,
      format: isCurrencyCol(col) ? 'currency' : 'raw',
    })
  })

  return { id: 'kpi-summary', type: 'kpi', title: 'Resumen General', kpis }
}

// ─── Transactional (entregas, órdenes, envíos) ───────────────────────────────

function buildTransactionalSections(
  data: ParsedSheet,
  numCols: ColumnInfo[],
  catCols: ColumnInfo[]
): ReportSection[] {
  const { rows } = data
  const sections: ReportSection[] = []

  catCols.forEach((catCol, idx) => {
    const grouped: Record<string, { count: number; [k: string]: number }> = {}

    rows.forEach(row => {
      const rawKey = row[catCol.name]
      // Ignorar filas sin valor en la columna categórica
      if (rawKey === null || rawKey === undefined || String(rawKey).trim() === '') return
      const key = String(rawKey).trim()
      if (!grouped[key]) {
        grouped[key] = { count: 0 }
        numCols.forEach(nc => { grouped[key][nc.name] = 0 })
      }
      grouped[key].count++
      numCols.forEach(nc => {
        grouped[key][nc.name] += typeof row[nc.name] === 'number' ? row[nc.name] : 0
      })
    })

    const sorted = Object.entries(grouped).sort((a, b) => b[1].count - a[1].count)

    const tableRows: TableRow[] = sorted.map(([key, vals]) => {
      const r: TableRow = {
        [catCol.name]: key,
        'Cantidad': vals.count,
        '%': ((vals.count / rows.length) * 100).toFixed(1) + '%',
      }
      numCols.forEach(nc => { r[nc.name] = vals[nc.name] })
      return r
    })

    const total: TableRow = {
      [catCol.name]: 'TOTAL',
      'Cantidad': rows.length,
      '%': '100%',
      _isTotal: true,
    }
    numCols.forEach(nc => { total[nc.name] = nc.sum })
    tableRows.push(total)

    const tableHeaders = [catCol.name, 'Cantidad', '%', ...numCols.map(c => c.name)]

    sections.push({
      id: `table-${catCol.name}-${idx}`,
      type: 'table',
      title: `Distribución por ${catCol.name}`,
      tableHeaders,
      tableRows,
    })

    // Gráfico de torta si pocas categorías, barra si muchas
    const chartData = sorted.map(([label, vals]) => ({ label, value: vals.count }))
    sections.push({
      id: `chart-${catCol.name}-${idx}`,
      type: 'chart',
      title: `Gráfico por ${catCol.name}`,
      chartType: sorted.length <= 6 ? 'pie' : 'bar',
      chartData,
    })

    // Sección de detalle: artículos/registros por cada valor de la categoría
    // Columnas a mostrar: id + text columns (excluir la columna de agrupación y otras categorías)
    const displayCols = data.columns
      .filter(c => c.name !== catCol.name && (c.type === 'id' || c.type === 'text' || c.type === 'numeric'))
      .map(c => c.name)

    if (displayCols.length > 0) {
      sections.push({
        id: `detail-${catCol.name}-${idx}`,
        type: 'detail',
        title: `Detalle de registros por ${catCol.name}`,
        groupByColumn: catCol.name,
        displayColumns: displayCols,
        detailRows: rows.filter(r => {
          const v = r[catCol.name]
          return v !== null && v !== undefined && String(v).trim() !== ''
        }),
      })
    }
  })

  return sections
}

// ─── Time series (ventas por mes, facturación por ciclo) ─────────────────────

function buildTimeseriesSections(
  data: ParsedSheet,
  numCols: ColumnInfo[],
  catCols: ColumnInfo[]
): ReportSection[] {
  const { rows, columns } = data
  const sections: ReportSection[] = []

  // Columna de tiempo
  const timeCol = columns.find(isTimeCol)
  if (!timeCol) return buildTransactionalSections(data, numCols, catCols)

  // Tabla resumen por período
  const grouped: Record<string, Record<string, number>> = {}
  rows.forEach(row => {
    const rawPeriod = row[timeCol.name]
    if (rawPeriod === null || rawPeriod === undefined || String(rawPeriod).trim() === '') return
    const period = String(rawPeriod).trim()
    if (!grouped[period]) {
      grouped[period] = {}
      numCols.forEach(nc => { grouped[period][nc.name] = 0 })
    }
    numCols.forEach(nc => {
      grouped[period][nc.name] += typeof row[nc.name] === 'number' ? row[nc.name] : 0
    })
  })

  const periods = Object.keys(grouped)
  const tableRows: TableRow[] = periods.map(period => {
    const r: TableRow = { [timeCol.name]: period }
    numCols.forEach(nc => { r[nc.name] = grouped[period][nc.name] })
    return r
  })

  const total: TableRow = { [timeCol.name]: 'TOTAL', _isTotal: true }
  numCols.forEach(nc => { total[nc.name] = nc.sum })
  tableRows.push(total)

  sections.push({
    id: 'table-timeseries',
    type: 'table',
    title: `Resumen por ${timeCol.name}`,
    tableHeaders: [timeCol.name, ...numCols.map(c => c.name)],
    tableRows,
  })

  // Gráfico de línea con la métrica principal
  const mainNumCol = numCols.find(isCurrencyCol) ?? numCols[0]
  if (mainNumCol) {
    sections.push({
      id: 'chart-timeseries',
      type: 'chart',
      title: `Evolución de ${mainNumCol.name} por ${timeCol.name}`,
      chartType: 'line',
      chartData: periods.map(p => ({ label: p, value: grouped[p][mainNumCol.name] ?? 0 })),
    })
  }

  // También tablas por categoría si las hay
  catCols.filter(c => !isTimeCol(c)).forEach((catCol, idx) => {
    const grouped2: Record<string, number> = {}
    rows.forEach(row => {
      const rawKey = row[catCol.name]
      if (rawKey === null || rawKey === undefined || String(rawKey).trim() === '') return
      const key = String(rawKey).trim()
      grouped2[key] = (grouped2[key] ?? 0) + 1
    })
    const sorted = Object.entries(grouped2).sort((a, b) => b[1] - a[1])
    sections.push({
      id: `chart-cat-${idx}`,
      type: 'chart',
      title: `Distribución por ${catCol.name}`,
      chartType: sorted.length <= 6 ? 'donut' : 'bar',
      chartData: sorted.map(([label, value]) => ({ label, value })),
    })
  })

  return sections
}

// ─── Summary (ya viene resumida/pivot) ───────────────────────────────────────

function buildSummarySections(
  data: ParsedSheet,
  numCols: ColumnInfo[],
  catCols: ColumnInfo[]
): ReportSection[] {
  const { rows } = data
  const sections: ReportSection[] = []

  if (catCols.length === 0) return sections

  const labelCol = catCols[0]
  const tableHeaders = [labelCol.name, ...numCols.map(c => c.name)]
  const tableRows: TableRow[] = rows.map(row => {
    const r: TableRow = { [labelCol.name]: row[labelCol.name] ?? '' }
    numCols.forEach(nc => { r[nc.name] = row[nc.name] ?? 0 })
    return r
  })

  sections.push({
    id: 'table-summary',
    type: 'table',
    title: 'Tabla Resumen',
    tableHeaders,
    tableRows,
  })

  // Gráfico con la métrica principal
  const mainNumCol = numCols.find(isCurrencyCol) ?? numCols[0]
  if (mainNumCol) {
    sections.push({
      id: 'chart-summary',
      type: 'chart',
      title: `${mainNumCol.name} por ${labelCol.name}`,
      chartType: rows.length <= 8 ? 'bar' : 'bar',
      chartData: rows.map(row => ({
        label: String(row[labelCol.name] ?? ''),
        value: typeof row[mainNumCol.name] === 'number' ? row[mainNumCol.name] : 0,
      })),
    })
  }

  return sections
}

// ─── Catalog (productos, tarifas) ────────────────────────────────────────────

function buildCatalogSections(
  data: ParsedSheet,
  numCols: ColumnInfo[],
  catCols: ColumnInfo[]
): ReportSection[] {
  const { rows, columns } = data
  const sections: ReportSection[] = []

  // Mostrar tabla completa con todas las columnas
  const allHeaders = columns.map(c => c.name)
  const tableRows: TableRow[] = rows.map(row => {
    const r: TableRow = {}
    allHeaders.forEach(h => { r[h] = row[h] ?? '' })
    return r
  })

  sections.push({
    id: 'table-catalog',
    type: 'table',
    title: 'Listado Completo',
    tableHeaders: allHeaders,
    tableRows,
  })

  // Si hay columna de categoría, gráfico de distribución
  if (catCols.length > 0 && numCols.length > 0) {
    const catCol = catCols[0]
    const numCol = numCols.find(isCurrencyCol) ?? numCols[0]
    const grouped: Record<string, number> = {}
    rows.forEach(row => {
      const key = String(row[catCol.name] ?? 'Sin valor')
      grouped[key] = (grouped[key] ?? 0) + (typeof row[numCol.name] === 'number' ? row[numCol.name] : 0)
    })
    sections.push({
      id: 'chart-catalog',
      type: 'chart',
      title: `${numCol.name} por ${catCol.name}`,
      chartType: 'bar',
      chartData: Object.entries(grouped).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
    })
  }

  return sections
}
