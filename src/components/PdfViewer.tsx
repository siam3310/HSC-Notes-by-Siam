
'use client';

import React, { useEffect, useState } from 'react';
import { Loader } from '@/components/Loader';

interface AdobeViewerProps {
  pdfId: number;
  documentUrl: string;
  fileName: string;
}

const ADOBE_CLIENT_ID = "5f46413d7bcd4bcd9d74d243d095550c";
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

        const previewConfig = {
            embedMode: "SIZED_CONTAINER" as const,
            showAnnotationTools: false,
        };

        const content = { 
          promise: fetch(documentUrl)
            .then(res => res.arrayBuffer())
            .catch(err => { 
                console.error(`Failed to fetch PDF from ${documentUrl}:`, err);
                // Return an empty buffer or throw to be caught by the outer catch
                return new ArrayBuffer(0);
            })
        };
        
        const metaData = { fileName: fileName || 'document.pdf' };
        
        const viewPromise = adobeDCView.previewFile({ content, metaData }, previewConfig);

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
            document.addEventListener("adobe_dc_view_sdk.ready", initViewer);
        };
        script.onerror = () => {
            console.error("Adobe View SDK failed to load.");
            setLoading(false);
        };
        document.body.appendChild(script);

        return () => {
           document.removeEventListener("adobe_dc_view_sdk.ready", initViewer);
           // Try to clean up the script tag
           const existingScript = document.querySelector(`script[src="${ADOBE_SDK_URL}"]`);
           if (existingScript) {
             // document.body.removeChild(existingScript);
           }
        };
    }
  }, [documentUrl, fileName, divId]);

  return (
    <div className="relative w-full h-[800px] border-2 bg-card">
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
