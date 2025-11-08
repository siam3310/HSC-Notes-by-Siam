import { getNoteById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { Separator } from '@/components/ui/separator';

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
      
      <article className="bg-card p-6 sm:p-8 rounded-lg border">
        <header className="border-b pb-4 mb-6">
          <p className="text-sm text-muted-foreground">{note.subject} &gt; {note.chapter_name}</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 font-headline">{note.topic_title}</h1>
        </header>

        {note.pdf_url && (
          <div className="mb-6">
            <div className="border rounded-lg overflow-hidden bg-background">
                <iframe
                    src={note.pdf_url}
                    title={note.topic_title}
                    className="w-full h-[80vh]"
                    allow="fullscreen"
                />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href={note.pdf_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open PDF in New Tab
                </Button>
                </a>
                <a href={note.pdf_url} download>
                <Button>
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
                </a>
            </div>
          </div>
        )}

        {sanitizedContent && note.pdf_url && <Separator className="my-8" />}

        {sanitizedContent && (
           <div
            className="prose prose-invert prose-lg max-w-none prose-h1:font-headline prose-h1:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}

        {!note.pdf_url && !sanitizedContent && (
            <p className="text-muted-foreground text-center py-10">No content available for this note.</p>
        )}
      </article>
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
