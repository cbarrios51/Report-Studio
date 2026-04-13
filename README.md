# Motor de Reporting Analítico

Motor de reporting robusto y escalable con **Arquitectura Hexagonal** (Ports and Adapters) en Node.js.

## 🏗️ Arquitectura

```
src/
├── domain/          # Entidades y reglas de negocio puras
│   ├── entities/    # Report, Metric, DataRow
│   └── services/    # ReportCalculator (lógica pura)
├── application/     # Casos de uso y puertos
│   ├── useCases/    # GenerateReport, ProcessExcelData
│   └── ports/       # Interfaces (ExcelReader, ReportGenerator)
├── infrastructure/  # Adaptadores concretos
│   └── adapters/    # ExcelReader, JsonGenerator, HtmlGenerator
└── shared/          # Utilidades globales
```

## 🚀 Instalación

```bash
npm install
```

## 📖 Uso Básico

```javascript
import { createReportingSystem } from './src/index.js';

// Crear instancia
const system = createReportingSystem({ outputFormat: 'html' });

// Generar reporte
const result = await system.generate('datos.xlsx', {
  title: 'Reporte de Ventas',
  sheetName: 'Ventas',
  metrics: [
    { name: 'Total', field: 'monto', strategy: 'sum', unit: 'USD' },
    { name: 'Promedio', field: 'monto', strategy: 'avg', unit: 'USD' },
    { name: 'Cantidad', field: 'monto', strategy: 'count' }
  ]
});

console.log(result.report.metrics);
```

## 🧪 Tests

```bash
npm test
npm run test:coverage
```

## 📊 Estrategias de Cálculo Disponibles

- `sum` - Suma total
- `avg` - Promedio
- `count` - Cantidad
- `max` - Valor máximo
- `min` - Valor mínimo

## 🔌 Extensiones

Para agregar un nuevo formato de salida:

1. Crear adaptador en `infrastructure/adapters/`
2. Implementar el puerto `ReportGeneratorPort`
3. Registrar en el factory `ReportingSystem`

## 📝 Ejemplos

Ver carpeta `examples/`:
- `basic-usage.js` - Ejemplo completo de generación
- `cli-processor.js` - Procesamiento por línea de comandos
