import { NoteForm } from '@/components/NoteForm';
import { getSubjectsAndChapters } from '@/lib/data';

export default async function NewNotePage() {
  const { subjects, chapters } = await getSubjectsAndChapters();
  return <NoteForm subjects={subjects} chapters={chapters} />;
}
