
'use client';

import React, { useEffect, useState } from 'react';
import { Loader } from '@/components/Loader';

interface AdobeViewerProps {
  pdfId: number;
  documentUrl: string;
  fileName: string;
}

const ADOBE_CLIENT_ID = "18c878ba4f5743eb8a63866cb602ac0b";
const ADOBE_SDK_URL = "https://acrobatservices.adobe.com/view-sdk/viewer.js";

export function PdfViewer({ pdfId, documentUrl, fileName }: AdobeViewerProps) {
  const [loading, setLoading] = useState(true);
  const divId = `adobe-dc-view-${pdfId}`;

  useEffect(() => {
    const initViewer = () => {
      if (!(window as any).AdobeDC) {
        console.warn("AdobeDC View SDK is not ready yet.");
        return;
      }
      
      try {
        setLoading(true);
        const adobeDCView = new (window as any).AdobeDC.View({
            clientId: ADOBE_CLIENT_ID,
            divId: divId,
        });

        const viewPromise = adobeDCView.previewFile({
            content: { location: { url: documentUrl } },
            metaData: { fileName: fileName || 'document.pdf' },
        }, {
            embedMode: "SIZED_CONTAINER",
            showAnnotationTools: false,
            showLeftHandPanel: true,
            showDownloadPDF: true,
            showPrintPDF: true,
        });

        viewPromise.then(() => {
            setLoading(false);
        }).catch((error:any) => {
            console.error(`AdobeDC.View.previewFile failed for div ${divId}:`, error);
            setLoading(false);
        });

      } catch (e) {
          console.error("Error initializing Adobe PDF viewer:", e);
          setLoading(false);
      }
    };

    if ((window as any).adobe_dc_sdk_ready) {
        initViewer();
    } else {
        const script = document.createElement('script');
        script.src = ADOBE_SDK_URL;
        script.async = true;
        script.onload = () => {
            (window as any).adobe_dc_sdk_ready = true;
            document.addEventListener("adobe_dc_view_sdk.ready", initViewer);
        };
        script.onerror = () => {
            console.error("Adobe View SDK failed to load.");
            setLoading(false);
        };
        document.body.appendChild(script);

        return () => {
           // No need to remove the script as it can be reused by other viewers.
           // Removing the event listener could be complex if multiple components add it.
           // The SDK is designed to handle multiple initializations.
        };
    }
  }, [documentUrl, fileName, divId]);

  return (
    <div className="relative w-full h-[800px] border rounded-lg overflow-hidden bg-card">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card">
          <Loader />
          <p className="mt-4 text-muted-foreground">Loading PDF Document...</p>
        </div>
      )}
      <div id={divId} className="w-full h-full" />
    </div>
  );
}
