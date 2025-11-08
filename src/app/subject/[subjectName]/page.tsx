import { getNotesBySubject } from '@/lib/data';
import type { Note } from '@/lib/types';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FileText } from 'lucide-react';

interface SubjectPageProps {
  params: {
    subjectName: string;
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const subjectName = decodeURIComponent(params.subjectName);
  const notes = await getNotesBySubject(subjectName);

  const notesByChapter = notes.reduce((acc, note) => {
    const chapter = note.chapter_name;
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 font-headline">{subjectName}</h1>
      {Object.keys(notesByChapter).length > 0 ? (
      <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(notesByChapter)[0]}>
        {Object.entries(notesByChapter).map(([chapter, chapterNotes]) => (
          <AccordionItem value={chapter} key={chapter}>
            <AccordionTrigger className="text-xl font-semibold hover:no-underline">{chapter}</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-2 pt-2">
                {chapterNotes.map((note) => (
                  <li key={note.id}>
                    <Link href={`/note/${note.id}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-secondary transition-colors">
                      <FileText className="h-5 w-5 text-muted-foreground" />
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
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card rounded-lg">
          <h2 className="text-xl font-semibold text-foreground">No Notes Yet</h2>
          <p className="text-muted-foreground mt-2 max-w-md">No notes have been added for this subject. Please check back later for new content.</p>
        </div>
      )}
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
