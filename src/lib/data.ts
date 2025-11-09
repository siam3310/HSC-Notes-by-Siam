import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import type { Note, NoteWithRelations, Subject, Chapter } from './types';

// =================================================================
// PUBLIC-FACING FUNCTIONS (using anon key)
// =================================================================

export async function getSubjects(): Promise<string[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('name')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
  return data.map(s => s.name);
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
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching notes for subject ${subjectName}:`, error);
    return { notes: [], error: error.message };
  }

  const transformedData = data.map(note => ({
    ...note,
    subject_name: note.subjects.name,
    chapter_name: note.chapters.name,
  }));

  return { notes: transformedData as unknown as NoteWithRelations[] };
}

export async function getNoteById(noteId: number): Promise<NoteWithRelations | null> {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      subjects (name),
      chapters (name)
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
    chapter_name: data.chapters.name,
  };

  return transformedData as unknown as NoteWithRelations;
}


// =================================================================
// ADMIN-ONLY FUNCTIONS (using service_role key)
// =================================================================

export async function getNoteByIdAdmin(noteId: number): Promise<Note | null> {
  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (error) {
    console.error(`Error fetching note with id ${noteId} for admin:`, error);
    return null;
  }
  return data as Note;
}


export async function getSubjectsAndChapters(): Promise<{ subjects: Subject[], chapters: Chapter[] }> {
    const [subjectsRes, chaptersRes] = await Promise.all([
        supabaseAdmin.from('subjects').select('*').order('name'),
        supabaseAdmin.from('chapters').select('*').order('name')
    ]);

    if (subjectsRes.error || chaptersRes.error) {
        console.error('Error fetching subjects/chapters:', subjectsRes.error || chaptersRes.error);
        return { subjects: [], chapters: [] };
    }

    return {
        subjects: subjectsRes.data,
        chapters: chaptersRes.data
    };
}
