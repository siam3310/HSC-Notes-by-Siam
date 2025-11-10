
import { supabase } from './supabase';
import type { NoteWithRelations } from './types';

// =================================================================
// PUBLIC-FACING FUNCTIONS (using anon key)
// =================================================================

export async function getSubjects(): Promise<string[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('name, notes!inner(is_published)')
    .eq('notes.is_published', true);

  if (error) {
    console.error('Error fetching active subjects:', error);
    return [];
  }

  // Use a Set to ensure uniqueness and then convert to an array
  const subjectNames = [...new Set(data.map(item => item.name))];
  
  subjectNames.sort();

  return subjectNames;
}


export async function getNotesBySubject(subjectName: string): Promise<{ notes: NoteWithRelations[], error?: string}> {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects!inner(name),
      chapters(name)
    `)
    .eq('subjects.name', subjectName)
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching notes for subject ${subjectName}:`, error);
    return { notes: [], error: error.message };
  }

  const transformedData = data.map(note => ({
    ...note,
    subject_name: note.subjects.name,
    chapter_name: note.chapters?.name ?? null,
  }));

  return { notes: transformedData as unknown as NoteWithRelations[] };
}

export async function getNoteById(noteId: number): Promise<NoteWithRelations | null> {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects (name),
      chapters (name),
      note_images (id, image_url),
      note_pdfs (id, pdf_url)
    `)
    .eq('id', noteId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Ignore "No rows found" error
      console.error(`Error fetching note with id ${noteId}:`, error);
    }
    return null;
  }
  
  if (!data.is_published) {
    return null;
  }

  const transformedData = {
    ...data,
    subject_name: data.subjects.name,
    chapter_name: data.chapters?.name ?? null,
    images: data.note_images || [],
    pdfs: data.note_pdfs || [],
  };

  return transformedData as unknown as NoteWithRelations;
}
