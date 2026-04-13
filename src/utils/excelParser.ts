import * as XLSX from 'xlsx'

export interface ColumnInfo {
  name: string
  originalIndex: number
  type: 'id' | 'numeric' | 'category' | 'text'
  uniqueValues: string[]
  sum: number
}

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, any>[]
  columns: ColumnInfo[]
  totalRows: number
  metadata: { title: string | null; subtitle: string | null; period: string | null }
}

export function parseSheet(worksheet: XLSX.WorkSheet): ParsedSheet {
  const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  }) as any[][]

  if (!aoa.length) return { headers: [], rows: [], columns: [], totalRows: 0, metadata: { title: null, subtitle: null, period: null } }

  // PASO 1: Encontrar fila real de headers
  // Es la primera fila donde hay 2+ strings cortos Y la fila siguiente tiene números
  let headerIdx = 0
  for (let i = 0; i < Math.min(aoa.length - 1, 30); i++) {
    const row = aoa[i] ?? []
    const filled = row.filter(c => c !== null && String(c).trim() !== '')
    if (filled.length < 2) continue

    const strings = filled.filter(c => isNaN(Number(String(c).trim())))
    const next = aoa[i + 1] ?? []
    const nextHasNum = next.some(c => typeof c === 'number')

    if (strings.length >= 2 && nextHasNum) {
      headerIdx = i
      break
    }
  }

  // PASO 2: Construir mapa de columnas — SOLO las que tienen nombre real
  const headerRow = aoa[headerIdx] ?? []
  const colMap: { idx: number; name: string }[] = []

  headerRow.forEach((cell, i) => {
    if (cell !== null && cell !== undefined && String(cell).trim() !== '') {
      colMap.push({ idx: i, name: String(cell).trim() })
    }
    // columnas vacías se ignoran — NUNCA A B C D E F
  })

  // PASO 3: Extraer metadata de filas anteriores al header
  let title: string | null = null
  let period: string | null = null
  for (let i = 0; i < headerIdx; i++) {
    const text = (aoa[i] ?? []).find((c: any) => c && String(c).trim().length > 3)
    if (!text) continue
    const s = String(text).trim()
    if (/\d+-\d+.*al.*\d+-\d+/i.test(s)) period = s
    else if (!title && s.length > 6) title = s
  }

  // PASO 4: Extraer TODAS las filas — sin límite, sin formato
  // Una fila es válida si al menos el 30% de sus columnas tienen valor real
  const minFilledCols = Math.max(1, Math.ceil(colMap.length * 0.3))
  const rows: Record<string, any>[] = []
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const raw = aoa[i] ?? []
    const filledCount = colMap.filter(c => {
      const v = raw[c.idx]
      return v !== null && v !== undefined && String(v).trim() !== ''
    }).length
    if (filledCount < minFilledCols) continue  // fila mayormente vacía → ignorar

    const obj: Record<string, any> = {}
    colMap.forEach(c => {
      const v = raw[c.idx]
      if (v === null || v === undefined || String(v).trim() === '') { obj[c.name] = null; return }
      if (typeof v === 'number') { obj[c.name] = v; return }
      // Convertir fechas a string legible (evita "Thu Mar 05 2026 00:00:36 GMT-0500...")
      if (v instanceof Date) {
        obj[c.name] = isNaN(v.getTime()) ? null : v.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        return
      }
      const s = String(v).trim()
      // Solo intentar parsear como número si tiene símbolo de moneda o es puramente numérico con coma/punto
      const hasCurrencySymbol = /[$€£]/.test(s)
      if (hasCurrencySymbol) {
        const cleaned = s.replace(/[$€£US\s]/g, '').replace(/\./g, '').replace(/,/g, '.').trim()
        obj[c.name] = !isNaN(Number(cleaned)) && cleaned !== '' ? Number(cleaned) : s
      } else {
        // Sin símbolo: solo parsear si es puramente numérico (dígitos, punto decimal opcional)
        const plainNum = /^-?\d+(\.\d+)?$/.test(s)
        obj[c.name] = plainNum ? Number(s) : s
      }
    })
    rows.push(obj)
  }

  // PASO 5: Analizar tipos de columna
  const headers = colMap.map(c => c.name)
  const columns: ColumnInfo[] = colMap.map(c => {
    const vals = rows.map(r => r[c.name]).filter(v => v !== null)
    const nums = vals.filter(v => typeof v === 'number') as number[]
    const uniq = [...new Set(vals.map(String))]

    let type: ColumnInfo['type'] = 'text'
    if (nums.length > vals.length * 0.8) {
      const allIntegers = nums.every(n => Number.isInteger(n))
      const uniqueRatio = uniq.length / vals.length
      // Secuencial exacto (1,2,3...) → id
      const diffs = nums.slice(1).map((n, i) => n - nums[i])
      // isSeq requiere al menos 2 diferencias para evitar falsos positivos con 1 registro
      const isSeq = diffs.length >= 2 && diffs.slice(0, 5).every(d => d === 1)
      // isIdLike requiere al menos 3 valores para evitar clasificar columnas de 1-2 registros como ID
      const isIdLike = allIntegers && uniqueRatio > 0.7 && vals.length >= 3
      type = isSeq || isIdLike ? 'id' : 'numeric'
    } else if (uniq.length <= 20) {
      // Umbral fijo (no basado en rows.length) → clasificación estable entre meses con diferente volumen
      type = 'category'
    }

    return {
      name: c.name,
      originalIndex: c.idx,
      type,
      uniqueValues: uniq,
      sum: nums.reduce((a, b) => a + b, 0),
    }
  })

  return { headers, rows, columns, totalRows: rows.length, metadata: { title, subtitle: null, period } }
}
