import { getNotesBySubject } from '@/lib/data';
import type { NoteWithRelations } from '@/lib/types';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FileText, BookOpen } from 'lucide-react';
import { notFound } from 'next/navigation';

interface SubjectPageProps {
  params: {
    subjectName: string;
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const subjectName = decodeURIComponent(params.subjectName);
  const notesResult = await getNotesBySubject(subjectName);

  if (notesResult.error || !notesResult.notes) {
      // Or handle error more gracefully
      return notFound();
  }
  
  const { notes } = notesResult;

  const notesByChapter = notes.reduce((acc, note) => {
    const chapter = note.chapter_name || 'Uncategorized';
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(note);
    return acc;
  }, {} as Record<string, NoteWithRelations[]>);

  const defaultAccordionValue = Object.keys(notesByChapter).length > 0 ? Object.keys(notesByChapter)[0] : undefined;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 tracking-tight">{subjectName}</h1>
      {Object.keys(notesByChapter).length > 0 ? (
      <Accordion type="single" collapsible className="w-full" defaultValue={defaultAccordionValue}>
        {Object.entries(notesByChapter).map(([chapter, chapterNotes]) => (
          <AccordionItem value={chapter} key={chapter}>
            <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground"/>
                <span>{chapter}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1 pt-2 ml-4 border-l pl-6">
                {chapterNotes.map((note) => (
                  <li key={note.id}>
                    <Link href={`/note/${note.id}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-secondary transition-colors duration-200 ease-in-out">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground/90">{note.topic_title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold text-foreground">No Notes Yet</h2>
          <p className="text-muted-foreground mt-2 max-w-md">No notes have been added for this subject. Please check back later for new content.</p>
        </div>
      )}
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
