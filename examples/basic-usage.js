/**
 * Ejemplo de uso básico del Motor de Reporting
 *
 * Este ejemplo muestra cómo:
 * 1. Configurar el sistema
 * 2. Procesar un archivo Excel
 * 3. Generar un reporte con métricas
 */

import { createReportingSystem } from '../src/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // 1. Crear instancia del sistema
  const reportingSystem = createReportingSystem({
    outputFormat: 'html' // o 'json'
  });

  try {
    // 2. Configurar el reporte
    const config = {
      title: 'Reporte de Ventas Mensual',
      sheetName: 'Ventas', // nombre de la hoja en el Excel
      metrics: [
        {
          name: 'Total Ventas',
          field: 'monto', // nombre de la columna en el Excel
          strategy: 'sum', // sum, avg, count, max, min
          unit: 'USD',
          description: 'Suma total de ventas'
        },
        {
          name: 'Promedio por Venta',
          field: 'monto',
          strategy: 'avg',
          unit: 'USD',
          description: 'Valor promedio de cada venta'
        },
        {
          name: 'Cantidad de Transacciones',
          field: 'monto',
          strategy: 'count',
          description: 'Número total de transacciones'
        },
        {
          name: 'Venta Máxima',
          field: 'monto',
          strategy: 'max',
          unit: 'USD',
          description: 'La venta de mayor valor'
        }
      ],
      outputOptions: {
        pretty: true
      }
    };

    // 3. Ruta del archivo Excel (ajustar a tu archivo real)
    const excelPath = join(__dirname, 'data', 'ventas.xlsx');

    console.log('📊 Procesando reporte...');
    console.log('Archivo:', excelPath);

    // 4. Generar el reporte
    const result = await reportingSystem.generate(excelPath, config);

    if (result.success) {
      console.log('\n✅ Reporte generado exitosamente!');
      console.log('Título:', result.report.title);
      console.log('Filas procesadas:', result.report.dataRows.length);
      console.log('\n📈 Métricas calculadas:');

      result.report.metrics.forEach(metric => {
        console.log(`  - ${metric.name}: ${metric.formatValue()}`);
      });

      // 5. Guardar el reporte (opcional)
      const outputPath = join(__dirname, 'output', 'reporte-ventas.html');
      await reportingSystem.generateReport.reportGenerator.save(
        result.output,
        outputPath
      );
      console.log('\n💾 Reporte guardado en:', outputPath);
    }
  } catch (error) {
    console.error('❌ Error generando reporte:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar si es el archivo principal
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default main;
