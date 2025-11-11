
'use client';

import { useState, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { Loader as SpinnerLoader } from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useResizeObserver from 'use-resize-observer';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const loadingSpinner = (
    <div className="flex h-full flex-col items-center justify-center">
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
        {error?.message && <p className="mt-2 font-mono text-xs">{error.message}</p>}
      </AlertDescription>
    </Alert>
);

export function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);

  const { ref: containerRef, width = 1 } = useResizeObserver<HTMLDivElement>();
  
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (width / (8.5 / 11)) * scale, // Estimate height based on aspect ratio
    overscan: 2,
  });

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const visibleItems = rowVirtualizer.getVirtualItems();
  
  useMemo(() => {
    if (visibleItems.length > 0) {
      const firstVisibleItem = visibleItems[0];
      if (firstVisibleItem) {
        setCurrentPage(firstVisibleItem.index + 1);
      }
    }
  }, [visibleItems]);


  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const goToPage = (pageIndex: number) => rowVirtualizer.scrollToIndex(pageIndex, { align: 'start' });

  return (
    <div className="flex h-full w-full flex-col rounded-lg border bg-secondary/30">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-2 border-b bg-card p-2">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 2)} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {numPages || '...'}
            </span>
            <Button variant="outline" size="icon" onClick={() => goToPage(currentPage)} disabled={currentPage >= numPages}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
                {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 2.5}>
                <ZoomIn className="h-4 w-4" />
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
      <div ref={containerRef} className="flex-grow">
        <div
            ref={parentRef}
            className="h-full max-h-[85vh] w-full overflow-y-auto"
        >
             <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={loadingSpinner}
                error={errorComponent}
                className="flex justify-center"
            >
             <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="flex justify-center p-2"
                    >
                        <Page
                            key={`page_${virtualItem.index + 1}`}
                            pageNumber={virtualItem.index + 1}
                            width={Math.min(width * 0.95, 800 * scale)} // Responsive width with a max
                            scale={scale}
                            loading={
                                <div style={{width: Math.min(width * 0.95, 800 * scale), height: Math.min(width * 0.95, 800 * scale) * 1.41 * scale}} className="flex items-center justify-center">
                                    <SpinnerLoader />
                                </div>
                            }
                            className="shadow-lg"
                        />
                    </div>
                ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
