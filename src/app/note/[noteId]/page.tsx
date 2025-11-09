
import { getNoteById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from '@/components/ui/card';
import { PdfViewer } from '@/components/PdfViewer';

interface NotePageProps {
  params: {
    noteId: string;
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const noteId = parseInt(params.noteId, 10);
  if (isNaN(noteId)) {
    notFound();
  }

  const note = await getNoteById(noteId);

  if (!note) {
    notFound();
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
              <Carousel className="w-full max-w-full">
                <CarouselContent>
                  {images.map((image) => (
                    <CarouselItem key={image.id}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex aspect-video items-center justify-center p-0 relative">
                             <Image 
                                src={image.image_url}
                                alt={`Note image for ${note.topic_title}`}
                                fill
                                className="object-contain rounded-lg"
                             />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12" />
                <CarouselNext className="mr-12" />
              </Carousel>
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

export const revalidate = 60; // Revalidate every 60 seconds
