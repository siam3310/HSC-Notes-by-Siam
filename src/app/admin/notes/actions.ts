
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note } from '@/lib/types';
import { z } from 'zod';
import { getNoteByIdAdmin, getNotesAdmin as getNotesAdminFromData } from '@/lib/data';

// Zod schema for validating file uploads
const fileSchema = z.instanceof(File).refine(file => file.size > 0, "File cannot be empty.");
const imageFileSchema = fileSchema.refine(
    file => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
    "Only .jpg, .png, .gif, or .webp formats are accepted."
);
const pdfFileSchema = fileSchema.refine(
    file => file.type === 'application/pdf',
    "Only .pdf format is accepted."
);

// Main schema for the note form
const noteSchema = z.object({
  topic_title: z.string().min(3, "Topic title must be at least 3 characters long."),
  subject_id: z.coerce.number().positive("Please select a subject."),
  chapter_id: z.coerce.number().optional().nullable(),
  content: z.string().optional(),
  is_published: z.enum(['true', 'false']).transform(val => val === 'true'),
});


async function handleFileUpload(file: File): Promise<{ url: string; type: 'image' | 'pdf' }> {
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

    return {
        url: publicUrl,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
    };
}


export async function createNoteAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const rawData = Object.fromEntries(formData.entries());
    const newImages = formData.getAll('images').filter(f => f instanceof File && f.size > 0) as File[];
    const newPdf = formData.get('pdf') as File | null;
    
    try {
        const validatedData = noteSchema.parse(rawData);

        const noteDataToInsert: Omit<Note, 'id' | 'created_at'> = {
            ...validatedData,
            chapter_id: validatedData.chapter_id || null,
            content: validatedData.content || null,
            pdf_url: null, // Start with null PDF URL
        };

        // Handle PDF Upload
        if (newPdf && newPdf.size > 0) {
            const pdfUploadResult = await handleFileUpload(newPdf);
            noteDataToInsert.pdf_url = pdfUploadResult.url;
        }

        const { data: note, error } = await supabaseAdmin
            .from('notes')
            .insert([noteDataToInsert])
            .select()
            .single();
        
        if (error || !note) {
            throw error || new Error('Failed to create note.');
        }

        // Handle Image Uploads
        if (newImages.length > 0) {
            const uploadPromises = newImages.map(file => handleFileUpload(file));
            const imageUrls = (await Promise.all(uploadPromises)).map(res => res.url);
            
            const imageInsertions = imageUrls.map(url => ({
                note_id: note.id,
                image_url: url
            }));

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
    const newPdf = formData.get('pdf') as File | null;
    
    const imagesToDelete = JSON.parse(formData.get('images_to_delete') as string || '[]') as number[];
    const pdfToDelete = (formData.get('pdf_to_delete') === 'true');

    try {
        const validatedData = noteSchema.parse(rawData);
        const existingNote = await getNoteByIdAdmin(id);
        if (!existingNote) throw new Error("Note not found.");

        // 1. Delete marked images
        if (imagesToDelete.length > 0) {
            const { error: deleteError } = await supabaseAdmin.from('note_images').delete().in('id', imagesToDelete);
            if (deleteError) throw deleteError;
        }

        // 2. Upload new images
        if (newImages.length > 0) {
            const uploadPromises = newImages.map(file => handleFileUpload(file));
            const imageUrls = (await Promise.all(uploadPromises)).map(res => res.url);
            
            const imageInsertions = imageUrls.map(url => ({ note_id: id, image_url: url }));
            const { error: imageError } = await supabaseAdmin.from('note_images').insert(imageInsertions);
            if (imageError) throw imageError;
        }

        // 3. Handle PDF
        let finalPdfUrl = existingNote.pdf_url;
        if (pdfToDelete) {
            // Here you might want to delete the file from storage as well
            finalPdfUrl = null;
        }
        if (newPdf && newPdf.size > 0) {
            // If there's a new PDF, upload it and replace the old one.
            const pdfUploadResult = await handleFileUpload(newPdf);
            finalPdfUrl = pdfUploadResult.url;
        }
        
        // 4. Update note details
        const noteDataToUpdate = {
            ...validatedData,
            chapter_id: validatedData.chapter_id || null,
            content: validatedData.content || null,
            pdf_url: finalPdfUrl,
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
    // RLS on note_images is set to ON DELETE CASCADE, so they will be deleted automatically.
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


export async function getNotesAction() {
    return await getNotesAdminFromData();
}

export async function deleteMultipleNotesAction(ids: number[]) {
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
    revalidatePath('/subjects', 'layout');
    return { success: true };
}
