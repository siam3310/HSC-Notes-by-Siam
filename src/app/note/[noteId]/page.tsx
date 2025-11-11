

'use client';

import { getNoteById } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, X, Loader, FileText } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PdfViewer } from '@/components/PdfViewer';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { NoteWithRelations } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader as SpinnerLoader } from '@/components/Loader';

interface NotePageProps {
  params: {
    noteId: string;
  };
}

export default function NotePage({ params: initialParams }: NotePageProps) {
  const params = useParams();
  const [note, setNote] = useState<NoteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfsToLoad, setPdfsToLoad] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const noteIdStr = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;
    const noteId = parseInt(noteIdStr, 10);
    
    if (isNaN(noteId)) {
      notFound();
      return;
    }

    const fetchNote = async () => {
      setLoading(true);
      const fetchedNote = await getNoteById(noteId);
      if (!fetchedNote) {
        notFound();
        return;
      }
      setNote(fetchedNote);
      setLoading(false);
    };

    fetchNote();
  }, [params.noteId]);

  const handleLoadPdf = (pdfId: number) => {
    setPdfsToLoad(prev => ({ ...prev, [pdfId]: true }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><SpinnerLoader /></div>;
  }
  
  if (!note) {
    return notFound();
  }

  const content = note.content || '';
  const images = note.images || [];
  const pdfs = note.pdfs || [];

  const hasContent = !!content;
  const hasImages = images.length > 0;
  const hasPdfs = pdfs.length > 0;

  return (
    <div className="-mt-8">
      <article className="p-0">
        <header className="border-b p-6 sm:p-8">
          <div className="text-sm text-muted-foreground tracking-wide uppercase">
            <Link href={`/subject/${encodeURIComponent(note.subject_name)}`} className="hover:text-foreground transition-colors">
                {note.subject_name}
            </Link>
            {note.chapter_name && <span className="mx-2">&gt;</span>}
            {note.chapter_name && <span>{note.chapter_name}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl mt-2 tracking-tight">{note.topic_title}</h1>
        </header>

        <div className="space-y-8 py-8">
          {hasImages && (
            <div className="px-4 sm:px-8">
              <h2 className="text-2xl mb-4">Images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((image) => (
                    <Dialog key={image.id}>
                        <DialogTrigger asChild>
                            <div className="cursor-pointer overflow-hidden rounded-lg border hover:ring-2 ring-primary transition-all">
                                <Image
                                src={image.image_url}
                                alt={`Note image for ${note.topic_title}`}
                                width={600}
                                height={400}
                                className="object-cover w-full aspect-video"
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent 
                          className="w-screen h-screen p-4 bg-black/80 backdrop-blur-sm border-0 shadow-none flex flex-col items-center justify-center"
                          closeButton={false}
                        >
                            <DialogTitle className="sr-only">Enlarged view of note image</DialogTitle>
                            <DialogDescription className="sr-only">An enlarged, fullscreen view of the note image for {note.topic_title}.</DialogDescription>
                            
                            <DialogClose asChild className="absolute top-4 right-4 z-50">
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-white">
                                    <X className="h-8 w-8" />
                                </Button>
                            </DialogClose>

                           <div className="relative w-full h-full flex-grow">
                             <Image 
                                src={image.image_url}
                                alt={`Note image for ${note.topic_title}`}
                                fill
                                className="object-contain"
                              />
                           </div>
                           <Button asChild size="lg" className="mt-4 flex-shrink-0">
                            <a href={image.image_url} download>
                                <Download className="mr-2 h-5 w-5"/>
                                Download
                            </a>
                           </Button>
                        </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}

          {hasPdfs && (
            <div className="px-6 sm:px-8">
              <h2 className="text-2xl mb-4">
                {pdfs.length > 1 ? 'PDF Documents' : 'PDF Document'}
              </h2>
               <p className="text-muted-foreground mb-4">Click on a file to load the PDF viewer.</p>
              <div className="space-y-4">
                {pdfs.map((pdf) => (
                  <Card key={pdf.id} className="overflow-hidden">
                    {pdfsToLoad[pdf.id] ? (
                       <div className="h-[800px] w-full">
                         <PdfViewer fileUrl={pdf.pdf_url} />
                       </div>
                    ) : (
                      <CardHeader className="flex flex-row items-center justify-between">
                         <div className="flex items-center gap-3">
                           <FileText className="h-5 w-5 text-muted-foreground"/>
                           <span className="text-foreground/90">{decodeURIComponent(pdf.pdf_url.split('/').pop()?.substring(14) ?? 'PDF Document')}</span>
                         </div>
                         <Button onClick={() => handleLoadPdf(pdf.id)}>
                            <Loader className="mr-2 h-4 w-4"/>
                            Load PDF
                         </Button>
                      </CardHeader>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {hasContent && (
             <div className="px-6 sm:px-8">
               <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/90">{content}</p>
               </div>
             </div>
          )}
        </div>

        {!hasImages && !hasPdfs && !hasContent && (
            <p className="text-muted-foreground text-center py-20">No content available for this note.</p>
        )}
      </article>
    </div>
  );
}
