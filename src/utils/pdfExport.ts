/**
 * Exportación de reportes a PDF, HTML e imagen
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exporta un elemento HTML a PDF respetando los límites de cada sección.
 *
 * Estrategia:
 *   1. Renderiza el header, cada sección y el footer como canvas individuales.
 *   2. Los coloca en páginas A4 en orden; si un bloque no cabe en el espacio
 *      restante de la página actual, inicia una página nueva antes de agregarlo.
 *   3. Si un bloque es más alto que una página completa (tabla muy larga),
 *      se divide horizontalmente a nivel de canvas para no perder contenido.
 */
export const exportToPdf = async (
  elementId: string,
  filename: string = 'reporte.pdf',
  orientation: 'p' | 'l' = 'p'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageW = orientation === 'p' ? 210 : 297;
  const pageH = orientation === 'p' ? 297 : 210;
  const margin = 10;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;

  // Recopilar bloques en orden: header → secciones → footer
  const headerEl = element.querySelector('[data-pdf-header]') as HTMLElement | null;
  const sectionEls = Array.from(element.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
  const footerEl = element.querySelector('[data-pdf-footer]') as HTMLElement | null;

  const blocks: HTMLElement[] = [
    ...(headerEl ? [headerEl] : []),
    ...sectionEls,
    ...(footerEl ? [footerEl] : []),
  ];

  // Fallback: sin bloques marcados → comportamiento original (imagen única)
  if (blocks.length === 0) {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let pos = margin;
    pdf.addImage(imgData, 'PNG', margin, pos, imgW, imgH);
    heightLeft -= usableH;
    while (heightLeft > 0) {
      pdf.addPage();
      pos = heightLeft - imgH + margin;
      pdf.addImage(imgData, 'PNG', margin, pos, imgW, imgH);
      heightLeft -= usableH;
    }
    pdf.save(filename);
    return;
  }

  /** Renderiza un elemento como canvas y devuelve su imagen + altura en mm */
  const renderBlock = async (el: HTMLElement): Promise<{ imgData: string; pxW: number; pxH: number; mmH: number }> => {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    const mmH = (canvas.height * usableW) / canvas.width;
    return { imgData: canvas.toDataURL('image/png'), pxW: canvas.width, pxH: canvas.height, mmH };
  };

  let currentY = margin;
  const gapMm = 3; // espacio entre bloques

  for (const block of blocks) {
    const { imgData, pxW, pxH, mmH } = await renderBlock(block);

    if (mmH <= usableH) {
      // Bloque entra en una sola página
      const remainingSpace = (pageH - margin) - currentY;
      // Si queda poco espacio (menos de 60 mm) o el bloque directamente no cabe → nueva página.
      // Esto evita que secciones queden "huérfanas" al pie de página con su análisis
      // continuando en la siguiente hoja.
      if (currentY > margin && (remainingSpace < 60 || currentY + mmH > pageH - margin)) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.addImage(imgData, 'PNG', margin, currentY, usableW, mmH);
      currentY += mmH + gapMm;
    } else {
      // Bloque más alto que una página → dividir en franjas recortando el canvas
      const pxPerMm = pxH / mmH;
      const pxPerPage = usableH * pxPerMm;

      // Precargar imagen una sola vez para reutilizarla en cada franja
      const img = await new Promise<HTMLImageElement>(res => {
        const el = new Image();
        el.onload = () => res(el);
        el.src = imgData;
      });

      let pxOffset = 0;
      while (pxOffset < pxH) {
        const slicePxH = Math.min(pxPerPage, pxH - pxOffset);
        const sliceMmH = slicePxH / pxPerMm;

        if (currentY > margin && currentY + sliceMmH > pageH - margin) {
          pdf.addPage();
          currentY = margin;
        }

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = pxW;
        sliceCanvas.height = slicePxH;
        sliceCanvas.getContext('2d')!.drawImage(img, 0, pxOffset, pxW, slicePxH, 0, 0, pxW, slicePxH);

        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, currentY, usableW, sliceMmH);
        currentY += sliceMmH;
        pxOffset += slicePxH;

        if (pxOffset < pxH) {
          pdf.addPage();
          currentY = margin;
        }
      }
      currentY += gapMm;
    }
  }

  pdf.save(filename);
};

/**
 * Exporta un elemento HTML a imagen PNG
 */
export const exportToImage = async (
  elementId: string,
  filename: string = 'reporte.png'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Crear enlace de descarga
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/**
 * Copia un elemento HTML al portapapeles como imagen
 */
export const copyToClipboard = async (elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Convertir canvas a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }

      try {
        navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 'image/png');
  });
};

/**
 * Exporta un elemento HTML a archivo HTML standalone
 */
export const exportToHtml = async (
  elementId: string,
  filename: string = 'reporte.html'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Capturar estilos computados
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => (rule as CSSStyleRule).cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Exportado</title>
  <style>
    ${styles}
    body {
      font-family: 'Inter', system-ui, sans-serif;
      padding: 20px;
      background: #fff;
    }
  </style>
</head>
<body>
  ${element.outerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Imprime un elemento HTML directamente
 */
export const printReport = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Imprimir Reporte</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>
        window.onload = () => {
          window.print();
          window.close();
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
};
