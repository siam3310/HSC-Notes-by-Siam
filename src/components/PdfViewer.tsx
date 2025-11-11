
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
  
  // Effect to load the viewer's JS library
  useEffect(() => {
    const jsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.js';
    
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
        script.onerror = () => console.error('Failed to load PDF Viewer script');
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

  // Effect to initialize the viewer once the library is loaded
  useEffect(() => {
    if (!isViewerLoaded || !fileUrl || !containerRef.current || !viewerRef.current) {
        return;
    }

    const { PDFViewer, EventBus, PDFFindController, PDFLinkService } = window.pdfjsViewer;

    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    const findController = new PDFFindController({ eventBus, linkService });

    // Forcefully set the position style directly on the DOM element before initialization.
    // This is the most reliable way to prevent the "container must be absolutely positioned" error.
    containerRef.current.style.position = 'relative';

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
      loadingTask.destroy().catch(() => {});
      if (pdfViewer) {
          pdfViewer.cleanup();
          pdfViewer.setDocument(null);
      }
      const pdfViewerDiv = viewerRef.current;
      if (pdfViewerDiv) {
          pdfViewerDiv.innerHTML = '';
      }
    };
  }, [fileUrl, isViewerLoaded]);

  return (
    <div
      ref={containerRef}
      className="pdf-viewer-container"
      style={{ height: '800px', width: '100%', overflow: 'auto', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
    >
      <div id="viewer" ref={viewerRef} className="pdfViewer"></div>
      {!isViewerLoaded && <div className="absolute inset-0 flex items-center justify-center"><SpinnerLoader /></div>}
    </div>
  );
}
