/**
 * Visualizador del Motor de Reporting
 * Muestra la arquitectura y funcionamiento del sistema
 */
import { createReportingSystem } from '../src/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, text) {
  console.log(`${color}${text}${COLORS.reset}`);
}

function separator() {
  log(COLORS.dim, '─'.repeat(60));
}

async function visualizeApp() {
  console.clear();

  log(COLORS.cyan, '\n╔══════════════════════════════════════════════════════════╗');
  log(COLORS.cyan, '║     MOTOR DE REPORTING ANALÍTICO - Visualizador           ║');
  log(COLORS.cyan, '╚══════════════════════════════════════════════════════════╝\n');

  // 1. Mostrar arquitectura
  separator();
  log(COLORS.bright, '🏗️  ARQUITECTURA HEXAGONAL');
  separator();

  console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │                   ADAPTADORES DE ENTRADA                │
  │                    (CLI / API / Web)                    │
  └────────────────────┬────────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────────────┐
  │              CAPA DE APLICACIÓN (Ports)                 │
  │  ┌─────────────────┐  ┌─────────────────────────────┐  │
  │  │ GenerateReport  │  │  ProcessExcelData           │  │
  │  └─────────────────┘  └─────────────────────────────┘  │
  └────────────────────┬────────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 CAPA DE DOMINIO (Core)                  │
  │  ┌──────────┐ ┌────────┐ ┌─────────┐ ┌───────────────┐  │
  │  │ Report   │ │ Metric │ │ DataRow │ │ ReportCalc.   │  │
  │  └──────────┘ └────────┘ └─────────┘ └───────────────┘  │
  └────────────────────┬────────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────────────┐
  │             ADAPTADORES DE SALIDA (Infra)               │
  │  ┌──────────────────┐  ┌────────────────────────────┐   │
  │  │ ExcelReader      │  │ Json/Html Report Generator │   │
  │  └──────────────────┘  └────────────────────────────┘   │
  └─────────────────────────────────────────────────────────┘
`);

  // 2. Mostrar entidades
  separator();
  log(COLORS.bright, '📦 ENTIDADES DE DOMINIO');
  separator();

  log(COLORS.green, '  Report');
  log(COLORS.dim, '    - id: string');
  log(COLORS.dim, '    - title: string');
  log(COLORS.dim, '    - metrics: Metric[]');
  log(COLORS.dim, '    - dataRows: DataRow[]');
  log(COLORS.dim, '    - generatedAt: Date');

  log(COLORS.green, '\n  Metric');
  log(COLORS.dim, '    - name: string');
  log(COLORS.dim, '    - value: number');
  log(COLORS.dim, '    - unit?: string');
  log(COLORS.dim, '    - description?: string');

  log(COLORS.green, '\n  DataRow');
  log(COLORS.dim, '    - id: string');
  log(COLORS.dim, '    - fields: Map<string, any>');

  // 3. Mostrar estrategias
  separator();
  log(COLORS.bright, '🧮 ESTRATEGIAS DE CÁLCULO');
  separator();

  const strategies = [
    { name: 'sum', desc: 'Suma total de valores' },
    { name: 'avg', desc: 'Promedio aritmético' },
    { name: 'count', desc: 'Cantidad de elementos' },
    { name: 'max', desc: 'Valor máximo' },
    { name: 'min', desc: 'Valor mínimo' }
  ];

  strategies.forEach(s => {
    log(COLORS.yellow, `    ${s.name.padEnd(8)} - ${s.desc}`);
  });

  // 4. Demo en vivo
  separator();
  log(COLORS.bright, '▶️  DEMO EN VIVO');
  separator();

  const excelPath = join(__dirname, 'data', 'ventas.xlsx');

  try {
    log(COLORS.cyan, `\n📂 Archivo: ${excelPath}`);

    // Leer archivo directamente para mostrar info
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    log(COLORS.green, `✅ Workbook cargado`);
    const sheetNames = workbook.worksheets.map(w => w.name);
    log(COLORS.dim, `   Hojas: ${sheetNames.join(', ')}`);

    const worksheet = workbook.getWorksheet('Ventas');
    log(COLORS.dim, `   Filas: ${worksheet.rowCount - 1} (excluyendo headers)`);
    log(COLORS.dim, `   Columnas: ${worksheet.columnCount}`);

    // Mostrar headers
    const headers = [];
    worksheet.getRow(1).eachCell(cell => headers.push(cell.value));
    log(COLORS.yellow, `\n📋 Columnas: ${headers.join(' | ')}`);

    // Mostrar primeras 3 filas
    log(COLORS.cyan, '\n📊 Primeras 3 filas:');
    for (let i = 2; i <= 4; i++) {
      const row = worksheet.getRow(i);
      const values = [];
      row.eachCell(cell => values.push(cell.value));
      log(COLORS.dim, `   Fila ${i-1}: ${values.slice(0, 5).join(' | ')}...`);
    }

    // 5. Ejecutar el sistema
    separator();
    log(COLORS.bright, '🚀 EJECUTANDO SISTEMA DE REPORTING');
    separator();

    const system = createReportingSystem({ outputFormat: 'html' });

    const config = {
      title: 'Reporte de Ventas - Demo',
      sheetName: 'Ventas',
      metrics: [
        { name: 'Total Ventas', field: 'Monto', strategy: 'sum', unit: 'USD' },
        { name: 'Promedio', field: 'Monto', strategy: 'avg', unit: 'USD' },
        { name: 'Transacciones', field: 'Monto', strategy: 'count' },
        { name: 'Venta Máxima', field: 'Monto', strategy: 'max', unit: 'USD' },
        { name: 'Venta Mínima', field: 'Monto', strategy: 'min', unit: 'USD' }
      ]
    };

    log(COLORS.cyan, '\n⚙️  Configuración:');
    log(COLORS.dim, `   Título: ${config.title}`);
    log(COLORS.dim, `   Métricas: ${config.metrics.length}`);

    log(COLORS.yellow, '\n⏳ Procesando...');

    const result = await system.generate(excelPath, config);

    if (result.success) {
      log(COLORS.green, '\n✅ ¡Reporte generado exitosamente!');

      log(COLORS.cyan, '\n📈 RESULTADOS:');
      log(COLORS.dim, `   Filas procesadas: ${result.report.dataRows.length}`);
      log(COLORS.dim, `   Formato: ${result.outputFormat}`);

      log(COLORS.yellow, '\n📊 MÉTRICAS CALCULADAS:');
      result.report.metrics.forEach(m => {
        const unit = m.unit ? ` ${m.unit}` : '';
        log(COLORS.green, `   ${m.name.padEnd(20)}: ${m.value.toLocaleString()}${unit}`);
      });

      // Guardar reporte HTML
      const outputPath = join(__dirname, 'output', 'reporte-ventas.html');
      await system.generateReport.reportGenerator.save(result.output, outputPath);
      log(COLORS.green, `\n💾 Reporte HTML guardado: ${outputPath}`);
    }

  } catch (error) {
    log(COLORS.red, `\n❌ Error: ${error.message}`);
    log(COLORS.dim, error.stack);
  }

  separator();
  log(COLORS.cyan, '✨ Visualización completada');
  separator();
  console.log('\n');
}

visualizeApp().catch(console.error);
