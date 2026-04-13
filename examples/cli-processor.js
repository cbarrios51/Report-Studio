/**
 * Ejemplo: Procesamiento CLI simple
 * Uso: node examples/cli-processor.js <archivo.xlsx> [hoja]
 */

import { createReportingSystem } from '../src/index.js';

async function cliProcess() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const sheetName = args[1];

  if (!filePath) {
    console.log('Uso: node cli-processor.js <archivo.xlsx> [hoja]');
    process.exit(1);
  }

  const system = createReportingSystem({ outputFormat: 'json' });

  try {
    console.log(`📂 Leyendo: ${filePath}`);

    // Obtener hojas disponibles
    const sheets = await system.excelReader.getSheetNames(filePath);
    console.log('Hojas disponibles:', sheets);

    // Procesar datos
    const dataRows = await system.process(filePath, { sheetName });

    console.log(`\n✅ ${dataRows.length} filas procesadas`);

    if (dataRows.length > 0) {
      console.log('\nPrimeras 3 filas:');
      console.log(JSON.stringify(
        dataRows.slice(0, 3).map(r => r.getFields()),
        null,
        2
      ));
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cliProcess();
