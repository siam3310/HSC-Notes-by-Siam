
'use client';

import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import { Loader } from '@/components/Loader';

interface PdfViewerProps {
    fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  const viewerDiv = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    let instance: any = null;
    if (viewerDiv.current) {
        WebViewer(
        {
          path: '/webviewer', // Path to the copied static assets in the public folder
          initialDoc: fileUrl,
          licenseKey: 'YOUR_APRYSE_LICENSE_KEY', // Get your key from https://www.apryse.com/
          fullAPI: true,
          disabledElements: [
             'header', // Disables the main header
             'toolsHeader', // Disables the tools header
             'downloadButton',
             'printButton',
          ],
        },
        viewerDiv.current
      ).then((inst) => {
        instance = inst;
        const { documentViewer } = inst.Core;

        documentViewer.addEventListener('documentLoaded', () => {
           setLoading(false);
           inst.UI.setTheme('dark'); // Set dark theme
           inst.UI.setFitMode(inst.UI.FitMode.FitWidth); // Set fit mode
        });
        
        // Clean up the instance when the component unmounts
        return () => {
            if(instance) {
                instance.UI.dispose();
                instance = null;
            }
        };
      });
    }

    return () => {
        if(instance) {
            instance.UI.dispose();
            instance = null;
        }
    }
  }, [fileUrl]);

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
};
