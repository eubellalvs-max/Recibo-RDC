'use client';

/**
 * Universal Printing Engine for Recibos & RDC
 * 
 * Provides rock-solid printing across Chromium, Firefox, WebKit, and inside iframe containers.
 * Prevents Chrome blank page preview bugs by:
 * 1. Creating an isolated hidden iframe with clean document root
 * 2. Cloning all active styles and Tailwind stylesheets
 * 3. Waiting for full DOM attachment and image decoding (logos/brasões)
 * 4. Applying explicit @page rules matching the document orientation (portrait / landscape)
 * 5. Providing an automatic seamless fallback to window.print() if iframe printing is restricted.
 */

export interface PrintOptions {
  title: string;
  orientation?: 'portrait' | 'landscape';
  fallbackElementId?: string;
}

/**
 * Prints HTML content via an isolated hidden iframe.
 * Eliminates all conflicts with parent modals, overlays, and background styles.
 */
export async function imprimirViaIframe(
  htmlContent: string,
  options: PrintOptions
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise<boolean>((resolve) => {
    try {
      // Remove any leftover print frames from previous prints
      const oldFrame = document.getElementById('__isolated_print_frame__');
      if (oldFrame) {
        oldFrame.remove();
      }

      // Create new hidden iframe
      const iframe = document.createElement('iframe');
      iframe.id = '__isolated_print_frame__';
      iframe.style.position = 'fixed';
      iframe.style.top = '-99999px';
      iframe.style.left = '-99999px';
      iframe.style.width = options.orientation === 'landscape' ? '297mm' : '210mm';
      iframe.style.height = options.orientation === 'landscape' ? '210mm' : '297mm';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!frameDoc || !iframe.contentWindow) {
        iframe.remove();
        resolve(false);
        return;
      }

      // Collect all stylesheets and inline style tags from current document
      const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      let stylesHtml = '';
      styleSheets.forEach((el) => {
        stylesHtml += el.outerHTML;
      });

      const pageOrientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';

      const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${options.title || 'Documento'}</title>
  ${stylesHtml}
  <style>
    @page {
      size: A4 ${pageOrientation};
      margin: 8mm 10mm 8mm 10mm;
    }
    html, body {
      background-color: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    }
    .print-frame-body {
      display: block !important;
      visibility: visible !important;
      width: 100% !important;
      max-width: ${options.orientation === 'landscape' ? '275mm' : '188mm'} !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    /* Garantir que todos os elementos impressos fiquem visíveis no iframe */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    /* Ocultar elementos auxiliares indesejados */
    .no-print {
      display: none !important;
    }
  </style>
</head>
<body class="bg-white text-black p-0 m-0">
  <div class="print-frame-body">
    ${htmlContent}
  </div>
</body>
</html>`;

      frameDoc.open();
      frameDoc.write(fullHtml);
      frameDoc.close();

      // Wait for iframe images to load / decode
      const finalizeAndPrint = async () => {
        const frameImages = Array.from(frameDoc.querySelectorAll('img')) as HTMLImageElement[];
        if (frameImages.length > 0) {
          await Promise.all(
            frameImages.map((img) => {
              if (img.complete && img.naturalWidth > 0) return Promise.resolve();
              return new Promise<void>((imgDone) => {
                img.onload = () => imgDone();
                img.onerror = () => imgDone();
                setTimeout(imgDone, 500);
              });
            })
          );
        }

        // Give two rendering ticks for styles & fonts
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Cleanup after print dialog
            const cleanup = () => {
              try {
                iframe.remove();
              } catch (_) {}
            };

            iframe.contentWindow?.addEventListener('afterprint', cleanup);
            setTimeout(cleanup, 4000);
            resolve(true);
          } catch (err) {
            console.warn('Iframe print failed, falling back:', err);
            iframe.remove();
            resolve(false);
          }
        }, 150);
      };

      // Check if document is already ready
      if (frameDoc.readyState === 'complete') {
        finalizeAndPrint();
      } else {
        iframe.onload = () => finalizeAndPrint();
        setTimeout(finalizeAndPrint, 400); // Fallback trigger
      }
    } catch (err) {
      console.warn('Erro ao configurar iframe de impressão:', err);
      resolve(false);
    }
  });
}
