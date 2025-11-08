import { getNoteById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { Separator } from '@/components/ui/separator';
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
  
  const sanitizedContent = note.content_html ? DOMPurify.sanitize(note.content_html) : '';

  const isGoogleDriveUrl = note.pdf_url && note.pdf_url.includes('drive.google.com');
  const googleDriveEmbedUrl = isGoogleDriveUrl ? note.pdf_url?.replace('/view', '/preview') : '';


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href={`/subject/${encodeURIComponent(note.subject)}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {note.subject}
          </Button>
        </Link>
      </div>
      
      <article className="bg-card p-0 sm:p-0 rounded-lg border">
        <header className="border-b pb-4 mb-6 p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">{note.subject} &gt; {note.chapter_name}</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 font-headline">{note.topic_title}</h1>
        </header>

        {isGoogleDriveUrl ? (
            <div className="mb-6 h-[200vh]">
              <iframe src={googleDriveEmbedUrl} width="100%" height="100%" frameBorder="0"></iframe>
            </div>
          ) : note.pdf_url ? (
            <div className="mb-6 h-[200vh]">
              <PdfViewer fileUrl={note.pdf_url} />
            </div>
          ) : null}

        {sanitizedContent && note.pdf_url && <Separator className="my-8" />}

        {sanitizedContent && (
           <div className="p-6 sm:p-8">
             <div
              className="prose prose-invert prose-lg max-w-none prose-h1:font-headline prose-h1:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
           </div>
        )}

        {!note.pdf_url && !sanitizedContent && (
            <p className="text-muted-foreground text-center py-10">No content available for this note.</p>
        )}
      </article>
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
