
import { supabase } from './supabase';
import type { NoteWithRelations } from './types';

// =================================================================
// PUBLIC-FACING FUNCTIONS (using anon key)
// =================================================================

export async function getSubjects(): Promise<string[]> {
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('subject_id')
    .eq('is_published', true);

  if (notesError) {
    console.error('Error fetching published notes:', notesError);
    return [];
  }

  const subjectIds = [...new Set(notes.map(note => note.subject_id))].filter(id => id);

  if (subjectIds.length === 0) {
    return [];
  }

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('name')
    .in('id', subjectIds);

  if (subjectsError) {
    console.error('Error fetching subjects:', subjectsError);
    return [];
  }

  const subjectNames = subjects.map(subject => subject.name);
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
      note_pdfs (id, pdf_url),
      note_embeds (id, embed_url)
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
    embeds: data.note_embeds || [],
  };

  return transformedData as unknown as NoteWithRelations;
}

export async function getLatestNotes(limit: number = 5): Promise<NoteWithRelations[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id,
      topic_title,
      created_at,
      subjects (name),
      chapters (name)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching latest notes:', error);
    return [];
  }

  const transformedData = data.map(note => ({
    ...note,
    subject_name: note.subjects!.name,
    chapter_name: note.chapters?.name ?? null,
  }));
  
  return transformedData as unknown as NoteWithRelations[];
}
