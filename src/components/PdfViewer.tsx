
'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader as SpinnerLoader } from '@/components/Loader';

// Setting worker path
import * as pdfjsLib from 'pdfjs-dist';
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  fileUrl: string;
}

declare global {
  interface Window {
    pdfjsViewer: any;
  }
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [isCssLoaded, setIsCssLoaded] = useState(false);

  useEffect(() => {
    const cssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css';
    const jsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.js';
    
    let cssLink = document.querySelector(`link[href="${cssUrl}"]`) as HTMLLinkElement;
    if (!cssLink) {
        cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = cssUrl;
        cssLink.onload = () => setIsCssLoaded(true);
        document.head.appendChild(cssLink);
    } else {
        // If CSS is already in the DOM, assume it's loaded.
        setIsCssLoaded(true);
    }
    
    if (window.pdfjsViewer) {
      setIsViewerLoaded(true);
      return;
    }
    
    let script = document.querySelector(`script[src="${jsUrl}"]`) as HTMLScriptElement;
    if (!script) {
        script = document.createElement('script');
        script.src = jsUrl;
        script.async = true;
        script.onload = () => setIsViewerLoaded(true);
        document.body.appendChild(script);
    } else if (script.dataset.loaded) {
        setIsViewerLoaded(true);
    } else {
        const onLoad = () => {
           setIsViewerLoaded(true);
           script.dataset.loaded = 'true';
           script.removeEventListener('load', onLoad);
        }
        script.addEventListener('load', onLoad);
    }
  }, []);

  useEffect(() => {
    if (!isViewerLoaded || !isCssLoaded || !fileUrl || !containerRef.current || !viewerRef.current) {
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
      // Ensure pdfViewer is cleaned up properly
      if (pdfViewer) {
          pdfViewer.setDocument(null);
      }
      const pdfViewerDiv = viewerRef.current;
      if (pdfViewerDiv) {
          while (pdfViewerDiv.firstChild) {
              pdfViewerDiv.removeChild(pdfViewerDiv.firstChild);
          }
      }
    };
  }, [fileUrl, isViewerLoaded, isCssLoaded]);

  return (
    <div
      ref={containerRef}
      className="pdf-viewer-container"
      style={{ height: '800px', overflow: 'auto', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', position: 'relative' }}
    >
      <div id="viewer" ref={viewerRef} className="pdfViewer"></div>
    </div>
  );
}
