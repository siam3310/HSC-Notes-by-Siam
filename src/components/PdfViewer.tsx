
'use client';

import { useEffect, useRef } from 'react';
import 'pdfjs-dist/web/pdf_viewer.css';
import {
  PDFViewer,
  EventBus,
  PDFFindController,
  PDFLinkService,
} from 'pdfjs-dist/web/pdf_viewer.mjs';

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
  const eventBusRef = useRef<EventBus | null>(null);

  useEffect(() => {
    if (!containerRef.current || !viewerRef.current) {
      return;
    }

    if (!eventBusRef.current) {
      eventBusRef.current = new EventBus();
    }
    const eventBus = eventBusRef.current;

    const linkService = new PDFLinkService({
      eventBus: eventBus,
    });

    const findController = new PDFFindController({
      eventBus: eventBus,
      linkService: linkService,
    });

    const pdfViewer = new PDFViewer({
      container: containerRef.current,
      viewer: viewerRef.current,
      eventBus: eventBus,
      linkService: linkService,
      findController: findController,
      textLayerMode: 1, // Enable text selection
      annotationLayerMode: 1, // Enable annotations
    });

    linkService.setViewer(pdfViewer);

    const loadingTask = pdfjsLib.getDocument(fileUrl);
    loadingTask.promise
      .then(function (pdfDocument) {
        pdfViewer.setDocument(pdfDocument);
        linkService.setDocument(pdfDocument, null);
      })
      .catch(function (reason) {
        console.error('Error during PDF loading: ' + reason);
      });

    return () => {
      loadingTask.destroy();
      // Clean up viewer
      const pdfViewerDiv = viewerRef.current;
      if (pdfViewerDiv) {
        while (pdfViewerDiv.firstChild) {
          pdfViewerDiv.removeChild(pdfViewerDiv.firstChild);
        }
      }
    };
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
