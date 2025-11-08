import { getNoteByIdAdmin } from '@/lib/data';
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
  
  const note = await getNoteByIdAdmin(noteId);

  if (!note) {
    return notFound();
  }

  return <NoteForm note={note} />;
}
