
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note, NoteWithRelations } from '@/lib/types';
import { z } from 'zod';

// Schema for validating form data from the client
const noteSchema = z.object({
  topic_title: z.string().min(3),
  subject_id: z.coerce.number().positive(),
  chapter_id: z.coerce.number().positive().optional().nullable(),
  content: z.string().optional(),
  pdf_url: z.string().url().optional().or(z.literal('')),
  is_published: z.enum(['true', 'false']).transform(val => val === 'true'),
});

export async function getNotesAction(): Promise<{ notes: NoteWithRelations[]; error?: string }> {
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

    // Transform the data to match the NoteWithRelations structure
    const transformedData = data.map(note => ({
        ...note,
        subject_name: note.subjects.name,
        chapter_name: note.chapters?.name ?? null,
        subjects: undefined, // remove the nested object
        chapters: undefined, // remove the nested object
    }));


    return { notes: transformedData as unknown as NoteWithRelations[] };
}


async function handleFileUpload(file: File): Promise<string | null> {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { data, error } = await supabaseAdmin.storage
        .from('notes-pdfs')
        .upload(fileName, file);

    if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('notes-pdfs')
        .getPublicUrl(data.path);

    return publicUrl;
}

export async function createNoteAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const rawData = Object.fromEntries(formData.entries());
    const file = formData.get('pdf_file') as File | null;

    try {
        const validatedData = noteSchema.parse(rawData);
        let fileUrl = validatedData.pdf_url || null;

        if (file && file.size > 0) {
            fileUrl = await handleFileUpload(file);
        }

        const noteDataToInsert: Omit<Note, 'id' | 'created_at'> = {
            subject_id: validatedData.subject_id,
            chapter_id: validatedData.chapter_id || null,
            topic_title: validatedData.topic_title,
            pdf_url: fileUrl,
            content: validatedData.content || null,
            is_published: validatedData.is_published,
        };

        const { error } = await supabaseAdmin
            .from('notes')
            .insert([noteDataToInsert]);
        
        if (error) {
            throw error;
        }

        revalidatePath('/admin/notes');
        revalidatePath('/admin');
        revalidatePath('/subjects');
        return { success: true };

    } catch (error: any) {
        console.error('Error creating note:', error);
        return { success: false, error: error.message || 'Validation failed or database error.' };
    }
}

export async function updateNoteAction(id: number, formData: FormData): Promise<{ success: boolean; error?: string }> {
    const rawData = Object.fromEntries(formData.entries());
    const file = formData.get('pdf_file') as File | null;
   
    try {
        const validatedData = noteSchema.parse(rawData);
        let fileUrl = validatedData.pdf_url;

        // If there's a new file, upload it and get the new URL
        if (file && file.size > 0) {
            fileUrl = await handleFileUpload(file);
        }

        const noteDataToUpdate = {
            topic_title: validatedData.topic_title,
            subject_id: validatedData.subject_id,
            chapter_id: validatedData.chapter_id || null,
            is_published: validatedData.is_published,
            pdf_url: fileUrl || null,
            content: validatedData.content || null,
        };

        const { error } = await supabaseAdmin
            .from('notes')
            .update(noteDataToUpdate)
            .eq('id', id);

        if (error) {
            throw error;
        }
        
        revalidatePath('/admin/notes');
        revalidatePath(`/admin/edit/${id}`);
        revalidatePath(`/note/${id}`);
        revalidatePath('/admin');
        revalidatePath('/subjects');
        return { success: true };

    } catch (error: any) {
        console.error('Error updating note:', error);
        return { success: false, error: error.message || 'Validation failed or database error.' };
    }
}

export async function deleteNoteAction(id: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting note:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/notes');
    revalidatePath('/admin');
    revalidatePath('/subjects');
    return { success: true };
}


export async function deleteMultipleNotesAction(ids: number[]): Promise<{ success: boolean; error?: string }> {
    if (!ids || ids.length === 0) {
        return { success: false, error: 'No note IDs provided.' };
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
    revalidatePath('/subjects');
    return { success: true };
}
