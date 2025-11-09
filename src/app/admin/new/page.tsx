import { NoteForm } from '@/components/NoteForm';
import { getSubjectsAndChapters } from '@/app/admin/subjects/actions';

export default async function NewNotePage() {
  const { subjects, chapters } = await getSubjectsAndChapters();
  return <NoteForm subjects={subjects} chapters={chapters} />;
}
