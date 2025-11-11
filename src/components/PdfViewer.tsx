
'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Loader as SpinnerLoader } from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Configure the PDF.js worker.
// Use the non-module worker from a CDN. This is a reliable way for Next.js.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


const loadingSpinner = (
    <div className="flex flex-col items-center justify-center h-full">
        <SpinnerLoader />
        <p className="mt-4 text-muted-foreground">Loading PDF...</p>
    </div>
);

const errorComponent = (error?: Error) => (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading PDF</AlertTitle>
      <AlertDescription>
        There was a problem loading the PDF file. Please try again later.
        {error?.message && <p className="text-xs mt-2 font-mono">{error.message}</p>}
      </AlertDescription>
    </Alert>
);

export function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  }

  return (
    <div className="w-full bg-secondary/30 rounded-lg border">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-2 p-2 bg-card border-b">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
                Page {pageNumber} of {numPages || '...'}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= (numPages || 0)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
                {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
            </Button>
             <Button variant="outline" size="icon" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex items-center">
            <Button asChild variant="outline">
                <a href={fileUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </a>
            </Button>
        </div>
      </div>
      
      {/* PDF Document */}
      <div className="flex justify-center p-4 overflow-auto" style={{ height: '800px' }}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={loadingSpinner}
          error={errorComponent}
          className="flex justify-center"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            rotate={rotation}
            loading={loadingSpinner}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}
