
'use client';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { useInView } from 'react-intersection-observer';
import { Loader } from './Loader';
import { Skeleton } from './ui/skeleton';

interface PdfViewerProps {
  fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Load only once
    rootMargin: '200px 0px', // Load when 200px away from viewport
  });

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    theme: 'dark'
  });

  return (
    <div ref={ref} className="h-[800px] w-full">
      {inView ? (
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg border bg-card">
            <div className="flex flex-col items-center gap-4">
                <Loader />
                <p className="text-muted-foreground">Loading PDF...</p>
            </div>
        </div>
      )}
    </div>
  );
}
