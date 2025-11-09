import { getSubjectsAndChapters } from '@/lib/data';
import { getNoteByIdAdmin } from '@/app/admin/notes/actions';
import { NoteForm } from '@/components/NoteForm';
import { notFound } from 'next/navigation';

interface EditNotePageProps {
  params: {
    noteId: string;
  };
}

export default async function EditNotePage({ params }: EditNotePageProps) {
  const noteId = parseInt(params.noteId, 10);
  if (isNaN(noteId)) {
    return notFound();
  }
  
  const [note, { subjects, chapters }] = await Promise.all([
    getNoteByIdAdmin(noteId),
    getSubjectsAndChapters()
  ]);

  if (!note) {
    return notFound();
  }

  return <NoteForm note={note} subjects={subjects} chapters={chapters} />;
}
