
'use client';

import { getNoteById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PdfViewer } from '@/components/PdfViewer';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { NoteWithRelations } from '@/lib/types';
import { useEffect, useState } from 'react';

interface NotePageProps {
  params: {
    noteId: string;
  };
}

export default function NotePage({ params }: NotePageProps) {
  const noteId = parseInt(params.noteId, 10);
  const [note, setNote] = useState<NoteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(noteId)) {
      notFound();
    }

    const fetchNote = async () => {
      const fetchedNote = await getNoteById(noteId);
      if (!fetchedNote) {
        notFound();
      }
      setNote(fetchedNote);
      setLoading(false);
    };

    fetchNote();
  }, [noteId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  if (!note) {
    return notFound();
  }

  const content = note.content || '';
  const images = note.images || [];
  const pdfUrl = note.pdf_url;

  const hasContent = !!content;
  const hasImages = images.length > 0;
  const hasPdf = !!pdfUrl;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/subject/${encodeURIComponent(note.subject_name)}`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {note.subject_name}
          </Button>
        </Link>
      </div>
      
      <article className="bg-card p-0 rounded-lg border">
        <header className="border-b p-6 sm:p-8">
          <p className="text-sm text-muted-foreground tracking-wide uppercase">
            {note.subject_name} {note.chapter_name && `> ${note.chapter_name}`}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{note.topic_title}</h1>
        </header>

        <div className="space-y-8 py-8">
          {hasImages && (
            <div className="px-4 sm:px-8">
              <h2 className="text-2xl font-semibold mb-4">Images</h2>
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
                        <DialogContent className="max-w-5xl h-[90vh] bg-transparent border-0 shadow-none">
                             <Image 
                                src={image.image_url}
                                alt={`Note image for ${note.topic_title}`}
                                layout="fill"
                                className="object-contain"
                            />
                        </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}

          {hasContent && (
             <div className="px-6 sm:px-8">
               <h2 className="text-2xl font-semibold mb-4">Content</h2>
               <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/90">{content}</p>
               </div>
             </div>
          )}

          {hasPdf && (
            <div className="px-6 sm:px-8">
              <h2 className="text-2xl font-semibold mb-4">PDF Document</h2>
              <div className="h-[800px] w-full rounded-lg border overflow-hidden">
                <PdfViewer fileUrl={pdfUrl} />
              </div>
            </div>
          )}
        </div>

        {!hasImages && !hasPdf && !hasContent && (
            <p className="text-muted-foreground text-center py-20">No content available for this note.</p>
        )}
      </article>
    </div>
  );
}
