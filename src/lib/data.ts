import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import type { Note } from './types';

// =================================================================
// PUBLIC-FACING FUNCTIONS (using anon key)
// =================================================================

export async function getSubjects(): Promise<string[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('subject')
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  const subjects = data.map((item) => item.subject);
  return [...new Set(subjects)]; // Return distinct subjects
}

export async function getNotesBySubject(subjectName: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('subject', subjectName)
    .eq('is_published', true)
    .order('chapter_name', { ascending: true })
    .order('topic_title', { ascending: true });

  if (error) {
    console.error(`Error fetching notes for subject ${subjectName}:`, error);
    return [];
  }

  return data as Note[];
}

export async function getNoteById(noteId: number): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Ignore "No rows found" error for public view
      console.error(`Error fetching note with id ${noteId}:`, error);
    }
    return null;
  }
  
  // For public view, only return if it's published.
  if(!data.is_published) {
    return null;
  }

  return data as Note;
}


// =================================================================
// ADMIN-ONLY FUNCTIONS (using service_role key)
// =================================================================

// Admin function to get all notes, including drafts
export async function getNotes(): Promise<Note[]> {
    const { data, error } = await supabaseAdmin
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all notes:', error);
        return [];
    }

    return data as Note[];
}

// Admin function to get a single note by ID, including drafts
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
