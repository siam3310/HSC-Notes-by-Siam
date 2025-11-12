'use client';

import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import { Loader } from '@/components/Loader';

interface PdfViewerProps {
    documentUrl: string;
}

export function PdfViewer({ documentUrl }: PdfViewerProps) {
  const viewerDiv = useRef<HTMLDivElement>(null);
  const webViewerInstance = useRef<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Use a ref to store the previous documentUrl to detect changes efficiently
  const prevDocumentUrl = useRef<string | null>(null);

  useEffect(() => {
    // Phase 1: Initialize WebViewer if it hasn't been initialized yet
    if (viewerDiv.current && !webViewerInstance.current) {
      setLoading(true); // Start loading state for initial load
      WebViewer(
        {
          path: '/webviewer',
          initialDoc: documentUrl,
          licenseKey: 'YOUR_APRYSE_LICENSE_KEY',
          fullAPI: true,
          disabledElements: [
             'header',
             'toolsHeader',
             'downloadButton',
             'printButton',
          ],
        },
        viewerDiv.current
      ).then((instance) => {
        webViewerInstance.current = instance;
        const { documentViewer } = instance.Core;

        documentViewer.addEventListener('documentLoaded', () => {
           setLoading(false);
           // Apply settings only after document is loaded
           if (webViewerInstance.current) {
             webViewerInstance.current.UI.setTheme('dark');
             webViewerInstance.current.UI.setFitMode(webViewerInstance.current.UI.FitMode.FitWidth);
           }
        });

        // Store the initial documentUrl
        prevDocumentUrl.current = documentUrl;
      }).catch(error => {
          console.error("Error initializing WebViewer:", error);
          setLoading(false); // Stop loading if initialization fails
      });
    }
    // Phase 2: Handle document URL changes using the existing instance
    else if (webViewerInstance.current && documentUrl !== prevDocumentUrl.current) {
        setLoading(true); // Start loading state for new document
        webViewerInstance.current.UI.loadDocument(documentUrl, {
            // Options can be passed here if needed, e.g., 'disableWorker: true'
        }).then(() => {
            setLoading(false);
            // Apply settings again after new document is loaded
            if (webViewerInstance.current) {
              webViewerInstance.current.UI.setTheme('dark');
              webViewerInstance.current.UI.setFitMode(webViewerInstance.current.UI.FitMode.FitWidth);
            }
        }).catch(error => {
            console.error("Error loading new document in WebViewer:", error);
            setLoading(false); // Stop loading if new document load fails
        });
        prevDocumentUrl.current = documentUrl; // Update the stored documentUrl
    }


    // Cleanup function
    return () => {
      if (webViewerInstance.current) {
          // Dispose the instance only if it was successfully initialized
          // and prevent re-initialization if the component remounts quickly in dev mode
          if (webViewerInstance.current.UI.dispose) { // Check if dispose method exists
            webViewerInstance.current.UI.dispose();
          }
          webViewerInstance.current = null;
          prevDocumentUrl.current = null; // Clear prev document URL on unmount
      }
    };
  }, [documentUrl]); // Dependency array to react to documentUrl changes

  return (
    <div className="h-[800px] w-full relative">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10">
          <Loader />
          <p className="text-muted-foreground mt-4">Loading PDF Viewer...</p>
        </div>
      )}
      <div className="webviewer h-full w-full" ref={viewerDiv}></div>
    </div>
  );
}