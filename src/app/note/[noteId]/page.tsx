import { getNoteById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
  
  const content = note.content || '';

  const isGoogleDriveUrl = note.pdf_url && note.pdf_url.includes('drive.google.com');
  const googleDriveEmbedUrl = isGoogleDriveUrl ? note.pdf_url?.replace('/view', '/preview') : '';


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/subject/${encodeURIComponent(note.subject)}`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {note.subject}
          </Button>
        </Link>
      </div>
      
      <article className="bg-card p-0 rounded-lg border">
        <header className="border-b p-6 sm:p-8">
          <p className="text-sm text-muted-foreground tracking-wide uppercase">{note.subject} &gt; {note.chapter_name}</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{note.topic_title}</h1>
        </header>

        {isGoogleDriveUrl ? (
            <div className="h-[200vh]">
              <iframe src={googleDriveEmbedUrl} width="100%" height="100%" frameBorder="0" className="w-full h-full"></iframe>
            </div>
          ) : note.pdf_url ? (
            <div className="h-[200vh]">
              <PdfViewer fileUrl={note.pdf_url} />
            </div>
          ) : null}

        {content && note.pdf_url && <Separator className="my-0" />}

        {content && (
           <div className="p-6 sm:p-8">
             <p className="whitespace-pre-wrap text-foreground/90">{content}</p>
           </div>
        )}

        {!note.pdf_url && !content && (
            <p className="text-muted-foreground text-center py-20">No content available for this note.</p>
        )}
      </article>
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
