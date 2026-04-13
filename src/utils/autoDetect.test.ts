// @ts-nocheck
import assert from 'assert';
import * as XLSX from 'xlsx';
import { analyzeExcel } from './autoDetect';

function createWorkbook(): XLSX.WorkBook {
  const aoa = [
    ['Reporte Facturación Pickup Call Center', '', '', '', '', '', '', '', ''],
    ['Fecha 16-03 al 31-03', '', '', '', '', '', '', '', ''],
    ['Facturación Total', '', '', null, null, 'Libras Totales Generadas', '', '', ''],
    ['Fecha', 'Guías', 'Piezas', null, null, 'Localidad', '%', 'Facturas $', 'Flete'],
    ['Marzo. 2', 107, 107, null, null, 'CABA', 45.5, 18413.92, 123.4],
    ['Total general', 107, 107, null, null, 'TOTAL', 45.5, 18413.92, 123.4],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
  return workbook;
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
}

function runTests() {
  const workbook = createWorkbook();
  const sheets = analyzeExcel(workbook);
  assert.strictEqual(sheets.length, 1, 'Debe detectar una hoja');

  const sheet = sheets[0];
  test('detecta título "Reporte Facturación Pickup Call Center"', () => {
    assert.strictEqual(sheet.reportTitle, 'Reporte Facturación Pickup Call Center');
  });

  test('detecta período "16-03 al 31-03"', () => {
    assert.strictEqual(sheet.reportPeriod, '16-03 al 31-03');
  });

  test('detecta layout dos columnas: "Facturación Total" | "Libras Totales Generadas"', () => {
    assert.strictEqual(sheet.layout, 'two-column');
    assert.strictEqual(sheet.tables.length, 2);
    assert.ok(sheet.tables.some(table => table.title.includes('Facturación Total')));
    assert.ok(sheet.tables.some(table => table.title.includes('Libras Totales Generadas')));
  });

  test('detecta tabla "Facturación Total" con totalsRow', () => {
    const facturacionTable = sheet.tables.find(table => table.title.includes('Facturación Total'));
    assert.ok(facturacionTable, 'Debe existir la tabla Facturación Total');
    assert.strictEqual(facturacionTable?.hasTotalsRow, true);
    assert.strictEqual(facturacionTable?.rows.length, 1);
  });

  test('clasifica columna "Facturas $" como currency', () => {
    const facturasTable = sheet.tables.find(table => table.headers.includes('Facturas $'));
    assert.ok(facturasTable, 'Debe existir la tabla con columna Facturas $');
    const index = facturasTable!.headers.indexOf('Facturas $');
    assert.strictEqual(facturasTable!.columnTypes[index], 'currency');
  });

  test('sugiere KPI sum para columna Facturas $ = $18,413.92', () => {
    const facturasTable = sheet.tables.find(table => table.headers.includes('Facturas $'))!;
    const metric = facturasTable.suggestedMetrics.find(m => m.column === 'Facturas $' && m.operation === 'sum');
    assert.ok(metric, 'Debe sugerir métrica sum para Facturas $');
    assert.strictEqual(metric?.formatted, '$18,413.92');
  });

  test('sugiere pie chart para tabla con columna Localidad + %', () => {
    const localidadTable = sheet.tables.find(table => table.headers.includes('Localidad') && table.headers.includes('%'))!;
    const hasPie = localidadTable.suggestedCharts.some(chart => chart.type === 'pie');
    assert.ok(hasPie, 'Debe sugerir un gráfico pie para Localidad + %');
  });
}

if (typeof process !== 'undefined' && process.argv.includes('--run-auto-detect-tests')) {
  runTests();
}

export { runTests };
