import { supabase } from './supabase';
import type { Note } from './types';

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
    .eq('is_published', true)
    .single();

  if (error) {
    // .single() throws an error if no row is found, which is expected.
    // We'll log other errors.
    if (error.code !== 'PGRST116') {
      console.error(`Error fetching note with id ${noteId}:`, error);
    }
    return null;
  }

  return data as Note;
}
