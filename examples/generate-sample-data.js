/**
 * Genera un archivo Excel de ejemplo para probar el sistema
 */
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateSampleData() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ventas');

  // Headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 15 },
    { header: 'Producto', key: 'producto', width: 25 },
    { header: 'Categoria', key: 'categoria', width: 20 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Precio Unit', key: 'precio', width: 15 },
    { header: 'Monto', key: 'monto', width: 15 },
    { header: 'Vendedor', key: 'vendedor', width: 20 }
  ];

  // Datos de ejemplo
  const productos = [
    { producto: 'Laptop Dell XPS', categoria: 'Electrónica', precio: 1200 },
    { producto: 'Mouse Logitech', categoria: 'Accesorios', precio: 25 },
    { producto: 'Teclado Mecánico', categoria: 'Accesorios', precio: 85 },
    { producto: 'Monitor Samsung 27"', categoria: 'Electrónica', precio: 350 },
    { producto: 'Silla Ergonómica', categoria: 'Muebles', precio: 450 },
    { producto: 'Escritorio Standing', categoria: 'Muebles', precio: 680 },
    { producto: 'Webcam HD', categoria: 'Accesorios', precio: 75 },
    { producto: 'Auriculares BT', categoria: 'Accesorios', precio: 120 },
    { producto: 'Tablet iPad', categoria: 'Electrónica', precio: 550 },
    { producto: 'Lámpara LED', categoria: 'Iluminación', precio: 45 }
  ];

  const vendedores = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Pérez'];
  const startDate = new Date(2026, 0, 1);

  // Generar 50 filas de datos
  for (let i = 1; i <= 50; i++) {
    const prod = productos[Math.floor(Math.random() * productos.length)];
    const cantidad = Math.floor(Math.random() * 10) + 1;
    const monto = prod.precio * cantidad;
    const fecha = new Date(startDate);
    fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 30));

    worksheet.addRow({
      id: i,
      fecha: fecha.toISOString().split('T')[0],
      producto: prod.producto,
      categoria: prod.categoria,
      cantidad,
      precio: prod.precio,
      monto,
      vendedor: vendedores[Math.floor(Math.random() * vendedores.length)]
    });
  }

  // Guardar archivo
  const outputPath = join(__dirname, 'data', 'ventas.xlsx');
  await fs.mkdir(join(__dirname, 'data'), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);

  console.log('✅ Archivo de ejemplo generado:', outputPath);
  console.log(`📊 ${50} filas de datos de ventas creadas`);
  console.log('📈 Categorías incluidas:', [...new Set(productos.map(p => p.categoria))].join(', '));
}

generateSampleData().catch(console.error);
