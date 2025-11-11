
'use client';

import { useEffect, useRef, useState } from 'react';

// Setting worker path
import * as pdfjsLib from 'pdfjs-dist';
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);

  useEffect(() => {
    // --- Start: Dynamic Asset Loading ---
    const cssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css';
    const jsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.js';
    
    let cssLink = document.querySelector(`link[href="${cssUrl}"]`) as HTMLLinkElement;
    if (!cssLink) {
        cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = cssUrl;
        document.head.appendChild(cssLink);
    }
    
    const initializeViewer = () => {
      if (!containerRef.current || !viewerRef.current || !fileUrl || typeof window.pdfjsViewer === 'undefined') {
          return;
      }

      const { PDFViewer, EventBus, PDFFindController, PDFLinkService } = window.pdfjsViewer;

      const eventBus = new EventBus();
      const linkService = new PDFLinkService({ eventBus });
      const findController = new PDFFindController({ eventBus, linkService });

      const pdfViewer = new PDFViewer({
        container: containerRef.current,
        viewer: viewerRef.current,
        eventBus,
        linkService,
        findController,
        textLayerMode: 1, 
        annotationLayerMode: 2,
        renderer: 'canvas',
        useOnlyCssZoom: false,
      });

      linkService.setViewer(pdfViewer);

      const loadingTask = pdfjsLib.getDocument(fileUrl);
      loadingTask.promise
        .then((pdfDocument) => {
          pdfViewer.setDocument(pdfDocument);
          linkService.setDocument(pdfDocument, null);
        })
        .catch((reason) => {
          console.error('Error during PDF loading: ' + reason);
        });

      return () => {
        loadingTask.destroy();
        pdfViewer.setDocument(null);
        const pdfViewerDiv = viewerRef.current;
        if (pdfViewerDiv) {
            while (pdfViewerDiv.firstChild) {
                pdfViewerDiv.removeChild(pdfViewerDiv.firstChild);
            }
        }
      };
    }

    if (window.pdfjsViewer) {
      initializeViewer();
      setIsViewerLoaded(true);
    } else {
        let script = document.querySelector(`script[src="${jsUrl}"]`) as HTMLScriptElement;
        if (!script) {
            script = document.createElement('script');
            script.src = jsUrl;
            script.onload = () => {
              initializeViewer();
              setIsViewerLoaded(true);
            };
            document.body.appendChild(script);
        } else if (script.dataset.loaded) {
           initializeViewer();
           setIsViewerLoaded(true);
        } else {
           script.addEventListener('load', () => {
             initializeViewer();
             setIsViewerLoaded(true);
           });
        }
    }

  }, [fileUrl]);

  return (
    <div
      ref={containerRef}
      id="viewerContainer"
      className="pdf-viewer-container"
      style={{ position: 'relative', height: '800px', overflow: 'auto', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
    >
      <div id="viewer" ref={viewerRef} className="pdfViewer"></div>
    </div>
  );
}
