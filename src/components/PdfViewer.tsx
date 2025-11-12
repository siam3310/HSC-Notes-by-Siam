
'use client';

import { useState, useRef, createRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { InView } from 'react-intersection-observer';

import { Loader as SpinnerLoader } from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useResizeObserver from 'use-resize-observer';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle, DialogDescription } from './ui/dialog';

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

export function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [slideshowPage, setSlideshowPage] = useState(1);
  const pageRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);

  const { ref: containerRef, width: containerWidth = 1 } = useResizeObserver<HTMLDivElement>();
  
  const parentRef = useRef<HTMLDivElement>(null);

  const proxiedUrl = `/api/pdf-proxy?url=${encodeURIComponent(fileUrl)}`;

  const rowVirtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (containerWidth * 1.41 * scale), 
    overscan: 2,
  });

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Create refs for each page
    pageRefs.current = Array(numPages).fill(0).map((_, i) => pageRefs.current[i] || createRef());
  };
  
  const handlePageVisible = (page: number) => {
    setCurrentPage(page);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  
  const handleOpenSlideshow = () => {
    setSlideshowPage(currentPage);
  }

  const goToPrevSlide = () => setSlideshowPage(p => Math.max(1, p - 1));
  const goToNextSlide = () => setSlideshowPage(p => Math.min(numPages, p + 1));
  
  const handleGoToPage = (pageNumber: number) => {
    const pageIndex = pageNumber - 1;
    if (pageRefs.current[pageIndex]?.current) {
      pageRefs.current[pageIndex].current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
        rowVirtualizer.scrollToIndex(pageIndex, { align: 'start' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToNextSlide();
    if (e.key === 'ArrowLeft') goToPrevSlide();
  };
  
  const width = Math.min(containerWidth * 0.95, 1000); // Set max width for readability

  return (
    <div className="flex h-full w-full flex-col rounded-lg border bg-secondary/30">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-2 border-b bg-card p-2">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleGoToPage(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground w-24 text-center">
                Page {currentPage} of {numPages || '...'}
            </span>
            <Button variant="outline" size="icon" onClick={() => handleGoToPage(currentPage + 1)} disabled={!numPages || currentPage >= numPages}>
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
        <div className="flex items-center gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={!numPages} onClick={handleOpenSlideshow}>
                        <Expand className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent 
                    className="w-screen h-screen max-w-full p-0 bg-black/90 backdrop-blur-sm border-0 shadow-none flex flex-col items-center justify-center"
                    onKeyDown={handleKeyDown}
                >
                    <DialogTitle className="sr-only">PDF Slideshow</DialogTitle>
                    <DialogDescription className="sr-only">A full-screen view of the PDF document. Use arrow keys to navigate between pages.</DialogDescription>

                     <DialogClose asChild className="absolute top-4 right-4 z-50">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-white">
                            <X className="h-8 w-8" />
                        </Button>
                    </DialogClose>

                    {/* Slideshow Content */}
                    <div className="relative w-full h-full flex items-center justify-center">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-black/30 hover:bg-black/50 text-white disabled:hidden"
                            onClick={goToPrevSlide}
                            disabled={slideshowPage <= 1}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                        
                        <div className="w-full h-full flex items-center justify-center p-8">
                             <Document file={proxiedUrl} loading="" error="">
                                <Page 
                                    pageNumber={slideshowPage} 
                                    className="shadow-2xl"
                                    loading={<SpinnerLoader />}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    devicePixelRatio={window.devicePixelRatio || 1}
                                />
                            </Document>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-black/30 hover:bg-black/50 text-white disabled:hidden"
                            onClick={goToNextSlide}
                            disabled={slideshowPage >= numPages}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    </div>

                    <div className="absolute bottom-4 text-center text-white bg-black/50 px-4 py-2 rounded-full">
                        Page {slideshowPage} of {numPages}
                    </div>
                </DialogContent>
            </Dialog>

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
            className="h-[800px] w-full overflow-y-auto"
        >
             <Document
                file={proxiedUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={loadingSpinner}
                error={errorComponent}
                className="flex justify-center"
            >
             <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        ref={pageRefs.current[virtualItem.index]}
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
                       <InView
                            as="div"
                            threshold={0.5}
                            onChange={(inView) => {
                                if (inView) {
                                    handlePageVisible(virtualItem.index + 1);
                                }
                            }}
                        >
                            <Page
                                key={`page_${virtualItem.index + 1}`}
                                pageNumber={virtualItem.index + 1}
                                width={width}
                                scale={scale}
                                loading={<PageSkeleton height={width * 1.41 * scale} />}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-lg"
                            />
                        </InView>
                    </div>
                ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
