'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@/components/Loader';

interface AdobeViewerProps {
  documentUrl: string;
  fileName: string;
}

const ADOBE_CLIENT_ID = "18c878ba4f5743eb8a63866cb602ac0b";
const ADOBE_SDK_URL = "https://acrobatservices.adobe.com/view-sdk/viewer.js";

export function PdfViewer({ documentUrl, fileName }: AdobeViewerProps) {
  const viewerDiv = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Adobe View SDK script
  useEffect(() => {
    if ((window as any).AdobeDC) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = ADOBE_SDK_URL;
    script.async = true;
    script.onload = () => {
      document.addEventListener("adobe_dc_view_sdk.ready", () => {
        setSdkReady(true);
      });
    };
    script.onerror = () => {
        console.error("Adobe View SDK failed to load.");
        setLoading(false);
    }

    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      document.body.removeChild(script);
    };
  }, []);

  // Initialize viewer once SDK is ready and documentUrl is available
  useEffect(() => {
    if (sdkReady && documentUrl && viewerDiv.current) {
        setLoading(true);
        const adobeDCView = new (window as any).AdobeDC.View({
            clientId: ADOBE_CLIENT_ID,
            divId: "adobe-dc-view",
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
            console.error("AdobeDC.View.previewFile failed", error);
            setLoading(false);
        });

    }
  }, [sdkReady, documentUrl, fileName]);

  return (
    <div className="relative w-full h-[800px] border rounded-lg overflow-hidden bg-card">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card">
          <Loader />
          <p className="mt-4 text-muted-foreground">Loading Adobe PDF Viewer...</p>
        </div>
      )}
      <div id="adobe-dc-view" ref={viewerDiv} className="w-full h-full" />
    </div>
  );
}
