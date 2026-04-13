/**
 * Debug: Ver el flujo de datos
 */
import { ExcelReaderAdapter } from '../src/infrastructure/index.js';
import { DataRow } from '../src/domain/index.js';
import { ReportCalculator } from '../src/domain/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debug() {
  const excelPath = join(__dirname, 'data', 'ventas.xlsx');

  console.log('🔍 DEBUG: Flujo de datos\n');

  // 1. Leer Excel
  const reader = new ExcelReaderAdapter();
  const rawData = await reader.read(excelPath, { sheetName: 'Ventas' });

  console.log('1️⃣ Datos raw desde Excel (primera fila):');
  console.log(rawData[0]);
  console.log('   Tipo:', typeof rawData[0]);
  console.log('   Keys:', Object.keys(rawData[0]));

  // 2. Transformar a DataRow
  const dataRows = rawData.map((row, index) => new DataRow({
    id: `row-${index}`,
    fields: row,
    sourceSheet: 'Ventas',
    rowIndex: index
  }));

  console.log('\n2️⃣ Primera fila como DataRow:');
  console.log('   fields:', dataRows[0].getFields());
  console.log('   hasField("monto"):', dataRows[0].hasField('monto'));
  console.log('   getField("monto"):', dataRows[0].getField('monto'));
  console.log('   Tipo de "monto":', typeof dataRows[0].getField('monto'));

  // 3. Probar calculadora
  const calculator = new ReportCalculator();

  console.log('\n3️⃣ Probando calculadora:');
  console.log('   Estrategias registradas:', [...calculator.strategies.keys()]);

  // Ver qué pasa en el filtro
  const fieldName = 'monto';
  const values = dataRows
    .filter(row => {
      const has = row.hasField(fieldName);
      if (!has) return false;
      const val = row.getField(fieldName);
      const isNum = typeof val === 'number';
      return isNum;
    })
    .map(row => row.getField(fieldName));

  console.log(`\n4️⃣ Valores encontrados para "${fieldName}":`);
  console.log('   Cantidad:', values.length);
  console.log('   Primeros 5:', values.slice(0, 5));
  console.log('   Suma:', values.reduce((a, b) => a + b, 0));

  // Calcular oficialmente
  const sum = calculator.calculate(dataRows, 'monto', 'sum');
  console.log('\n5️⃣ Resultado oficial de calculate():');
  console.log('   suma:', sum);
}

debug().catch(console.error);
