
'use client';

import { useState, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useInView } from 'react-intersection-observer';

import { Loader as SpinnerLoader } from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useResizeObserver from 'use-resize-observer';
import { Skeleton } from './ui/skeleton';

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

const PageSkeleton = ({ height }: { height: number }) => (
    <div className="flex justify-center p-2">
        <Skeleton style={{ height: `${height}px`, width: '100%' }} />
    </div>
);


const PageRenderer = ({ pageIndex, width, scale, onPageVisible }: { pageIndex: number; width: number; scale: number; onPageVisible: (page: number) => void; }) => {
    const { ref, inView } = useInView({
        threshold: 0.5, // Trigger when 50% of the page is visible
        onChange: (inView, entry) => {
            if (inView) {
                onPageVisible(pageIndex + 1);
            }
        },
    });

    return (
        <div ref={ref}>
            <Page
                key={`page_${pageIndex + 1}`}
                pageNumber={pageIndex + 1}
                width={width ? width * 0.95 : undefined}
                scale={scale}
                loading={<PageSkeleton height={width * 1.41 * scale} />}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
            />
        </div>
    );
};


export function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);

  const { ref: containerRef, width = 1 } = useResizeObserver<HTMLDivElement>();
  
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (width * 1.41 * scale), 
    overscan: 2,
  });

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const handlePageVisible = (page: number) => {
    setCurrentPage(page);
  };

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
            <span className="text-sm font-medium text-muted-foreground w-24 text-center">
                Page {currentPage} of {numPages || '...'}
            </span>
            <Button variant="outline" size="icon" onClick={() => goToPage(currentPage)} disabled={!numPages || currentPage >= numPages}>
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
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="flex justify-center p-2"
                    >
                       <PageRenderer
                          pageIndex={virtualItem.index}
                          width={width}
                          scale={scale}
                          onPageVisible={handlePageVisible}
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

