
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note } from '@/lib/types';
import { z } from 'zod';
import { getNoteByIdAdmin } from '@/lib/data';

const noteSchema = z.object({
  topic_title: z.string().min(3, "Topic title must be at least 3 characters long."),
  subject_id: z.coerce.number().positive("Please select a subject."),
  chapter_id: z.coerce.number().optional().nullable(),
  content: z.string().optional(),
  is_published: z.enum(['true', 'false']).transform(val => val === 'true'),
});

async function handleFileUpload(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { data, error } = await supabaseAdmin.storage
        .from('notes-pdfs')
        .upload(fileName, file);

    if (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('notes-pdfs')
        .getPublicUrl(data.path);

    return publicUrl;
}

export async function createNoteAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const rawData = Object.fromEntries(formData.entries());
    
    const newImages = formData.getAll('images').filter(f => f instanceof File && f.size > 0) as File[];
    const newPdfFile = formData.get('pdf') as File | null;

    try {
        const validatedData = noteSchema.parse(rawData);

        const noteDataToInsert: Omit<Note, 'id' | 'created_at'> = {
            ...validatedData,
            chapter_id: validatedData.chapter_id || null,
            content: validatedData.content || '',
        };

        const { data: note, error } = await supabaseAdmin
            .from('notes')
            .insert([noteDataToInsert])
            .select()
            .single();
        
        if (error || !note) {
            throw error || new Error('Failed to create note.');
        }

        // Handle PDF Upload
        if (newPdfFile && newPdfFile.size > 0) {
            const pdfUrl = await handleFileUpload(newPdfFile);
            const { error: pdfError } = await supabaseAdmin.from('note_pdfs').insert([{ note_id: note.id, pdf_url: pdfUrl }]);
            if (pdfError) throw pdfError;
        }

        // Handle Image Uploads
        if (newImages.length > 0) {
            const uploadPromises = newImages.map(file => handleFileUpload(file));
            const imageUrls = await Promise.all(uploadPromises);
            
            const imageInsertions = imageUrls.map(url => ({ note_id: note.id, image_url: url }));
            const { error: imageError } = await supabaseAdmin.from('note_images').insert(imageInsertions);
            if (imageError) throw imageError;
        }

        revalidatePath('/admin/notes');
        revalidatePath('/admin');
        revalidatePath('/subjects', 'layout');
        return { success: true };

    } catch (error: any) {
        console.error("Create Note Error:", error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function updateNoteAction(id: number, formData: FormData): Promise<{ success: boolean; error?: string }> {
    const rawData = Object.fromEntries(formData.entries());
    const newImages = formData.getAll('images').filter(f => f instanceof File && f.size > 0) as File[];
    const newPdfFile = (formData.get('pdf') as File | null);
    
    const imagesToDelete = JSON.parse(formData.get('images_to_delete') as string || '[]') as number[];
    const pdfsToDelete = JSON.parse(formData.get('pdfs_to_delete') as string || '[]') as number[];

    try {
        const validatedData = noteSchema.parse(rawData);
        const existingNote = await getNoteByIdAdmin(id);
        if (!existingNote) throw new Error("Note not found.");

        // 1. Delete marked images and PDFs
        if (imagesToDelete.length > 0) {
            const { error } = await supabaseAdmin.from('note_images').delete().in('id', imagesToDelete);
            if (error) throw error;
        }
        if (pdfsToDelete.length > 0) {
            const { error } = await supabaseAdmin.from('note_pdfs').delete().in('id', pdfsToDelete);
            if (error) throw error;
        }

        // 2. Upload new images and PDFs
        if (newImages.length > 0) {
            const uploadPromises = newImages.map(file => handleFileUpload(file));
            const imageUrls = await Promise.all(uploadPromises);
            const imageInsertions = imageUrls.map(url => ({ note_id: id, image_url: url }));
            const { error } = await supabaseAdmin.from('note_images').insert(imageInsertions);
            if (error) throw error;
        }
        if (newPdfFile && newPdfFile.size > 0) {
            const pdfUrl = await handleFileUpload(newPdfFile);
            const { error } = await supabaseAdmin.from('note_pdfs').insert([{ note_id: id, pdf_url: pdfUrl }]);
            if (error) throw error;
        }
        
        // 3. Update note details
        const noteDataToUpdate = {
            ...validatedData,
            chapter_id: validatedData.chapter_id || null,
            content: validatedData.content || '',
        };

        const { error } = await supabaseAdmin.from('notes').update(noteDataToUpdate).eq('id', id);
        if (error) throw error;
        
        revalidatePath('/admin/notes');
        revalidatePath(`/admin/edit/${id}`);
        revalidatePath(`/note/${id}`);
        revalidatePath('/admin');
        revalidatePath('/subjects', 'layout');
        return { success: true };

    } catch (error: any) {
        console.error("Update Note Error:", error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function deleteNoteAction(id: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/notes');
    revalidatePath('/admin');
    revalidatePath('/subjects', 'layout');
    return { success: true };
}

export async function deleteMultipleNotesAction(ids: number[]): Promise<{ success: boolean; error?: string }> {
    if (!ids || ids.length === 0) {
        return { success: false, error: 'No note IDs provided.' };
    }

    const { error: imageDeleteError } = await supabaseAdmin.from('note_images').delete().in('note_id', ids);
    if (imageDeleteError) {
        console.error('Error deleting associated images for multiple notes:', imageDeleteError);
        // non-critical, continue
    }

    const { error: pdfDeleteError } = await supabaseAdmin.from('note_pdfs').delete().in('note_id', ids);
    if (pdfDeleteError) {
        console.error('Error deleting associated pdfs for multiple notes:', pdfDeleteError);
        // non-critical, continue
    }

    const { error } = await supabaseAdmin.from('notes').delete().in('id', ids);
    if (error) {
        console.error('Error deleting multiple notes:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/notes');
    revalidatePath('/admin');
    revalidatePath('/subjects', 'layout');
    return { success: true };
}
