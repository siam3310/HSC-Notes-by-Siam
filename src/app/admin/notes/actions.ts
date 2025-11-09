
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note, NoteWithRelations } from '@/lib/types';
import { z } from 'zod';

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const noteSchema = z.object({
  topic_title: z.string().min(3),
  subject_id: z.coerce.number().positive(),
  chapter_id: z.coerce.number().positive().optional().nullable(),
  content: z.string().optional(),
  is_published: z.enum(['true', 'false']).transform(val => val === 'true'),
});

async function handleFileUpload(file: File): Promise<string> {
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

    const transformedData = data.map(note => ({
        ...note,
        subject_name: note.subjects.name,
        chapter_name: note.chapters?.name ?? null,
        subjects: undefined,
        chapters: undefined, 
    }));


    return { notes: transformedData as unknown as NoteWithRelations[] };
}


export async function createNoteAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const rawData = Object.fromEntries(formData.entries());
    const files = formData.getAll('images') as File[];

    try {
        const validatedData = noteSchema.parse(rawData);

        const noteDataToInsert: Omit<Note, 'id' | 'created_at'> = {
            subject_id: validatedData.subject_id,
            chapter_id: validatedData.chapter_id || null,
            topic_title: validatedData.topic_title,
            content: validatedData.content || null,
            is_published: validatedData.is_published,
        };

        const { data: note, error } = await supabaseAdmin
            .from('notes')
            .insert([noteDataToInsert])
            .select()
            .single();
        
        if (error || !note) {
            throw error || new Error('Failed to create note.');
        }

        if (files && files.length > 0) {
            const uploadPromises = files
                .filter(file => file.size > 0)
                .map(file => handleFileUpload(file));
            
            const imageUrls = await Promise.all(uploadPromises);
            
            const imageInsertions = imageUrls.map(url => ({
                note_id: note.id,
                image_url: url
            }));

            const { error: imageError } = await supabaseAdmin
                .from('note_images')
                .insert(imageInsertions);

            if (imageError) throw imageError;
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
    const files = formData.getAll('images') as File[];
    const imagesToDeleteRaw = formData.get('images_to_delete') as string;
    const imagesToDelete = imagesToDeleteRaw ? JSON.parse(imagesToDeleteRaw) : [];
   
    try {
        const validatedData = noteSchema.parse(rawData);

        // 1. Delete marked images
        if (imagesToDelete && imagesToDelete.length > 0) {
            const { error: deleteError } = await supabaseAdmin
                .from('note_images')
                .delete()
                .in('id', imagesToDelete);
            
            if (deleteError) throw deleteError;
        }

        // 2. Upload new images
        if (files && files.length > 0) {
            const uploadPromises = files
                .filter(file => file.size > 0)
                .map(file => handleFileUpload(file));
            
            const imageUrls = await Promise.all(uploadPromises);
            
            const imageInsertions = imageUrls.map(url => ({
                note_id: id,
                image_url: url
            }));

            const { error: imageError } = await supabaseAdmin
                .from('note_images')
                .insert(imageInsertions);

            if (imageError) throw imageError;
        }

        // 3. Update note details
        const noteDataToUpdate = {
            topic_title: validatedData.topic_title,
            subject_id: validatedData.subject_id,
            chapter_id: validatedData.chapter_id || null,
            is_published: validatedData.is_published,
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
    // RLS will handle cascading deletes if set up correctly.
    // If not, we need to delete related images manually first.
    const { error: imageDeleteError } = await supabaseAdmin
        .from('note_images')
        .delete()
        .eq('note_id', id);

    if (imageDeleteError) {
        console.error('Error deleting associated images:', imageDeleteError);
        return { success: false, error: imageDeleteError.message };
    }
    
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
    revalidatePath('/subjects');
    return { success: true };
}
