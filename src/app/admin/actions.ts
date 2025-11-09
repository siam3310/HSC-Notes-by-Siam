'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note } from '@/lib/types';
import { z } from 'zod';

// Schema for validating form data from the client
const noteSchema = z.object({
  subject: z.string().min(2),
  chapter_name: z.string().min(3),
  topic_title: z.string().min(3),
  content_html: z.string().optional(),
  pdf_url: z.string().url().optional().or(z.literal('')),
  is_published: z.enum(['true', 'false']).transform(val => val === 'true'),
});


export async function getNotesAction(): Promise<{ notes: Note[]; error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notes:', error);
        return { notes: [], error: error.message };
    }

    return { notes: data as Note[] };
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
        let pdfUrl = validatedData.pdf_url || null;

        if (file && file.size > 0) {
            pdfUrl = await handleFileUpload(file);
        }

        const noteDataToInsert: Omit<Note, 'id' | 'created_at'> = {
            ...validatedData,
            pdf_url: pdfUrl,
            content_html: validatedData.content_html || null,
        };

        const { error } = await supabaseAdmin
            .from('notes')
            .insert([noteDataToInsert]);
        
        if (error) {
            throw error;
        }

        revalidatePath('/admin/notes');
        revalidatePath('/admin');
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
        let pdfUrl = validatedData.pdf_url;

        // If there's a new file, upload it and get the new URL
        if (file && file.size > 0) {
            pdfUrl = await handleFileUpload(file);
        }

        const noteDataToUpdate = {
            subject: validatedData.subject,
            chapter_name: validatedData.chapter_name,
            topic_title: validatedData.topic_title,
            is_published: validatedData.is_published,
            pdf_url: pdfUrl || null,
            content_html: validatedData.content_html || null,
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
    return { success: true };
}
