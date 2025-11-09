import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import type { Note, NoteWithRelations, Subject, Chapter, NoteImage } from './types';

// =================================================================
// PUBLIC-FACING FUNCTIONS (using anon key)
// =================================================================

export async function getSubjects(): Promise<string[]> {
  // Fetch subjects that have at least one published note.
  const { data, error } = await supabase
    .from('notes')
    .select(`
      subjects ( name )
    `)
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching active subjects:', error);
    return [];
  }

  // Create a unique list of subject names from the notes.
  // The 'Set' object automatically handles duplicates.
  const subjectNames = [...new Set(data.map(item => item.subjects?.name).filter(Boolean) as string[])];
  
  // Sort the names alphabetically.
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
      note_images (id, image_url)
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
  };

  return transformedData as unknown as NoteWithRelations;
}


// =================================================================
// ADMIN-ONLY FUNCTIONS (using service_role key)
// =================================================================

export async function getNoteByIdAdmin(noteId: number): Promise<NoteWithRelations | null> {
  const { data, error } = await supabaseAdmin
    .from('notes')
    .select(`
        *,
        note_images(id, image_url)
    `)
    .eq('id', noteId)
    .single();

  if (error) {
    console.error(`Error fetching note with id ${noteId} for admin:`, error);
    return null;
  }
  const transformedData = {
    ...data,
    images: data.note_images || [],
  };

  return transformedData as unknown as NoteWithRelations;
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

export async function getNotesAdmin(): Promise<{ notes: NoteWithRelations[]; error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('notes')
        .select(`
            *,
            subjects (name),
            chapters (name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notes:', error);
        return { notes: [], error: error.message };
    }

    const transformedData = data.map(note => ({
        ...note,
        subject_name: note.subjects?.name ?? 'N/A',
        chapter_name: note.chapters?.name ?? null,
    }));


    return { notes: transformedData as unknown as NoteWithRelations[] };
}

export async function deleteMultipleNotesAdmin(ids: number[]): Promise<{ success: boolean; error?: string }> {
    if (!ids || ids.length === 0) {
        return { success: false, error: 'No note IDs provided.' };
    }
    
    // RLS with "ON DELETE CASCADE" should handle note_images, but explicit deletion is safer.
    const { error: imageDeleteError } = await supabaseAdmin
        .from('note_images')
        .delete()
        .in('note_id', ids);

    if (imageDeleteError) {
        console.error('Error deleting associated images for multiple notes:', imageDeleteError);
        return { success: false, error: imageDeleteError.message };
    }

    const { error } = await supabaseAdmin
        .from('notes')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error deleting multiple notes:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/notes');
    revalidatePath('/admin');
    revalidatePath('/subjects', 'layout');
    return { success: true };
}
