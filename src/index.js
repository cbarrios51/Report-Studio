/**
 * Motor de Reporting Analítico
 * Punto de entrada principal - Composición con Inyección de Dependencias
 *
 * Arquitectura Hexagonal:
 * - Domain: Entidades y lógica pura de negocio
 * - Application: Casos de uso y puertos
 * - Infrastructure: Adaptadores concretos
 */

// Importar capas
import {
  GenerateReport,
  ProcessExcelData
} from './application/index.js';

import {
  ExcelReaderAdapter,
  JsonReportGenerator,
  HtmlReportGenerator
} from './infrastructure/index.js';

import {
  Report,
  Metric,
  DataRow,
  ReportCalculator
} from './domain/index.js';

import {
  generateId,
  validateRequired,
  toCsv,
  groupBy
} from './shared/index.js';

/**
 * Factory para crear instancias configuradas del sistema
 * Facilita la composición y el testing
 */
export class ReportingSystem {
  constructor(options = {}) {
    this.options = options;

    // Inicializar adaptadores (Infraestructura)
    this.excelReader = options.excelReader || new ExcelReaderAdapter();

    this.reportGenerators = {
      json: options.jsonGenerator || new JsonReportGenerator(),
      html: options.htmlGenerator || new HtmlReportGenerator()
    };

    // Inicializar casos de uso (Aplicación)
    this.generateReport = new GenerateReport(
      this.excelReader,
      this.reportGenerators[options.outputFormat || 'json']
    );

    this.processExcelData = new ProcessExcelData(this.excelReader);
  }

  /**
   * Genera un reporte completo desde un archivo Excel
   * @param {string} filePath - Ruta del archivo Excel
   * @param {Object} config - Configuración del reporte
   * @returns {Promise<Object>} Resultado del reporte
   */
  async generate(filePath, config) {
    return this.generateReport.execute(filePath, config);
  }

  /**
   * Procesa datos de Excel sin generar reporte
   * @param {string} filePath - Ruta del archivo Excel
   * @param {Object} options - Opciones de procesamiento
   * @returns {Promise<Array<DataRow>>} Datos procesados
   */
  async process(filePath, options) {
    return this.processExcelData.execute(filePath, options);
  }

  /**
   * Cambia el generador de reportes
   * @param {string} format - Formato ('json' o 'html')
   */
  setOutputFormat(format) {
    this.options.outputFormat = format;
    this.generateReport.reportGenerator = this.reportGenerators[format];
  }
}

/**
 * Factory function para creación rápida
 */
export function createReportingSystem(options) {
  return new ReportingSystem(options);
}

// Exportar todo el dominio para uso directo
export {
  Report,
  Metric,
  DataRow,
  ReportCalculator,
  GenerateReport,
  ProcessExcelData,
  ExcelReaderAdapter,
  JsonReportGenerator,
  HtmlReportGenerator,
  generateId,
  validateRequired,
  toCsv,
  groupBy
};

// Default export
export default ReportingSystem;

/**
 * Demo ejecutable cuando se corre directamente
 * node src/index.js
 */
async function main() {
  console.log('🚀 Motor de Reporting Analítico\n');

  const system = createReportingSystem({ outputFormat: 'html' });

  // Buscar archivo de ejemplo
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { promises: fs } = await import('fs');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const examplePath = join(__dirname, '..', 'examples', 'data', 'ventas.xlsx');

  try {
    await fs.access(examplePath);
  } catch {
    console.log('⚠️  No hay archivo de ejemplo en examples/data/ventas.xlsx');
    console.log('\n💡 Ejecutá primero: node examples/generate-sample-data.js');
    return;
  }

  const config = {
    title: 'Reporte Demo',
    sheetName: 'Ventas',
    metrics: [
      { name: 'Total', field: 'Monto', strategy: 'sum', unit: 'USD' },
      { name: 'Promedio', field: 'Monto', strategy: 'avg', unit: 'USD' },
      { name: 'Cantidad', field: 'Monto', strategy: 'count' }
    ]
  };

  console.log('📂 Archivo:', examplePath);
  console.log('⚙️  Configuración:', JSON.stringify(config, null, 2));
  console.log('\n⏳ Procesando...\n');

  const result = await system.generate(examplePath, config);

  if (result.success) {
    console.log('✅ ¡Reporte generado!\n');
    console.log('📈 Métricas:');
    result.report.metrics.forEach(m => {
      const unit = m.unit ? ` ${m.unit}` : '';
      console.log(`   ${m.name}: ${m.value.toLocaleString()}${unit}`);
    });
    console.log(`\n💾 Filas procesadas: ${result.report.dataRows.length}`);
  }
}

// Ejecutar si es el archivo principal
if (process.argv[1] && (process.argv[1].endsWith('src/index.js') || process.argv[1].endsWith('src\\index.js'))) {
  main().catch(console.error);
}
