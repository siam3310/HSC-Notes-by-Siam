
import { getNoteById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PdfViewer } from '@/components/PdfViewer';
import Image from 'next/image';


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
  const fileUrl = note.pdf_url;

  const isGoogleDriveUrl = fileUrl && fileUrl.includes('drive.google.com');
  const googleDriveEmbedUrl = isGoogleDriveUrl ? fileUrl?.replace('/view', '/preview') : '';
  
  const isPdf = fileUrl && fileUrl.toLowerCase().endsWith('.pdf');
  const isImage = fileUrl && (
    fileUrl.toLowerCase().endsWith('.png') ||
    fileUrl.toLowerCase().endsWith('.jpg') ||
    fileUrl.toLowerCase().endsWith('.jpeg') ||
    fileUrl.toLowerCase().endsWith('.gif') ||
    fileUrl.toLowerCase().endsWith('.webp')
  );

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

        {isGoogleDriveUrl ? (
            <div className="h-[200vh]">
              <iframe src={googleDriveEmbedUrl} width="100%" height="100%" frameBorder="0" className="w-full h-full"></iframe>
            </div>
        ) : isPdf ? (
            <div className="h-[200vh]">
              <PdfViewer fileUrl={fileUrl} />
            </div>
        ) : isImage ? (
            <div className="relative w-full aspect-video">
                <Image 
                    src={fileUrl}
                    alt={note.topic_title}
                    fill
                    className="object-contain"
                />
            </div>
        ) : null}

        {content && fileUrl && <Separator className="my-0" />}

        {content && (
           <div className="p-6 sm:p-8">
             <p className="whitespace-pre-wrap text-foreground/90">{content}</p>
           </div>
        )}

        {!fileUrl && !content && (
            <p className="text-muted-foreground text-center py-20">No content available for this note.</p>
        )}
      </article>
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
