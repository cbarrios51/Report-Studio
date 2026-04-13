# PRD Maestro: Orquestación de Reporting y Visualización de Datos Analíticos

## 1. Objetivo Global
Este proyecto tiene como propósito construir un motor de reporting robusto y escalable utilizando **Node.js**. El sistema debe ser capaz de ingerir archivos **MS Excel**, procesar la información contenida en ellos bajo reglas de negocio específicas y generar visualizaciones o reportes estructurados bajo demanda. La meta es desacoplar completamente la lógica de procesamiento de datos de las fuentes de entrada y los formatos de salida.

## 2. Stack Tecnológico
- **Runtime:** Node.js (Versión LTS).
- **Lenguaje:** JavaScript (ES6+) / TypeScript (opcional pero recomendado para contratos de dominio).
- **Procesamiento de Datos:** Librerías especializadas en Excel (como `exceljs` o `xlsx`).
- **Gestión de Dependencias:** npm o pnpm.
- **Testing:** Jest para Unit Testing e Integration Testing.

## 3. Arquitectura Core: Hexagonal (Ports and Adapters)
Para asegurar la mantenibilidad y la evolución del sistema, se implementará una **Arquitectura Hexagonal**:

### A. Capa de Dominio (Domain)
Contiene las entidades de negocio (ej. `Report`, `Metric`, `DataRow`) y los servicios de dominio. Es el corazón del sistema y **no tiene dependencias externas**.

### B. Capa de Aplicación (Application)
Define los casos de uso (ej. `GenerateReport`, `ProcessExcelData`). Aquí se definen los **Puertos (Interfaces)** que describen cómo el sistema interactúa con el mundo exterior.

### C. Capa de Infraestructura (Infrastructure)
Implementa los **Adaptadores**. 
- **Adaptadores de Entrada (Driving):** API REST, CLI, o triggers que inician un proceso.
- **Adaptadores de Salida (Driven):** Implementaciones concretas de persistencia, generación de archivos PDF/HTML, o lectores de Excel específicos.

## 4. Estructura de Archivos General
```text
src/
├── domain/          # Entidades y reglas de negocio puras
├── application/     # Casos de uso y definiciones de puertos
├── infrastructure/  # Adaptadores (ExcelReader, PDFGenerator, WebServer)
├── shared/          # Utilidades y constantes globales
└── index.js         # Punto de entrada y composición (DI)
```

## 5. Justificación de la Arquitectura
Se elige la Arquitectura Hexagonal porque permite cambiar la fuente de datos (ej. pasar de Excel a una Base de Datos SQL) sin tocar la lógica de generación de métricas, simplemente creando un nuevo adaptador en la capa de infraestructura.