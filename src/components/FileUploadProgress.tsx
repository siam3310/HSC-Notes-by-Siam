
'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

interface FileUploadProgressProps {
  upload: FileUpload;
  onRemove: () => void;
}

export function FileUploadProgress({ upload, onRemove }: FileUploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const isUploading = upload.progress > 0 && upload.progress < 100;
  const isComplete = upload.progress === 100;
  const hasError = !!upload.error;

  return (
    <div className={cn(
        "flex items-center gap-4 p-3 border rounded-lg",
        hasError ? "border-destructive bg-destructive/10" : "bg-secondary/50"
    )}>
      <div className="flex-shrink-0">
        {hasError ? (
            <AlertCircle className="h-6 w-6 text-destructive"/>
        ) : (
            <File className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <p className="text-sm font-medium truncate">{upload.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(upload.file.size)}
        </p>
        {!hasError && (
          <div className="mt-1 flex items-center gap-2">
            <Progress value={upload.progress} className="h-2 w-full" />
            <span className="text-xs font-mono text-muted-foreground">{Math.round(upload.progress)}%</span>
          </div>
        )}
         {hasError && (
          <p className="text-xs text-destructive mt-1 truncate">Error: {upload.error}</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  );
}
