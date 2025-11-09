
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note, NoteWithRelations } from '@/lib/types';
import { z } from 'zod';
import { getNoteByIdAdmin } from '@/lib/data';


const noteSchema = z.object({
  topic_title: z.string().min(3, "Topic title must be at least 3 characters long."),
  subject_id: z.coerce.number().positive("Please select a subject."),
  chapter_id: z.coerce.number().optional().nullable(),
  content: z.string().optional(),
  is_published: z.boolean(),
  new_pdf_urls: z.array(z.string()).optional(),
  new_image_urls: z.array(z.string()).optional(),
});

export async function uploadFileAction(formData: FormData): Promise<{ url: string | null, error: string | null }> {
    const file = formData.get('file') as File;

    if (!file) {
        return { url: null, error: 'No file provided.' };
    }

    try {
        const filePath = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { data, error } = await supabaseAdmin.storage
            .from('notes-pdfs')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage.from('notes-pdfs').getPublicUrl(filePath);

        return { url: publicUrl, error: null };

    } catch (error: any) {
        console.error('Upload Error from Server Action:', error);
        return { url: null, error: error.message };
    }
}


export async function createNoteAction(formData: Omit<z.infer<typeof noteSchema>, 'new_pdf_urls' | 'new_image_urls'> & {new_pdf_urls?: string[], new_image_urls?: string[]}): Promise<{ success: boolean; error?: string }> {
    try {
        const validatedData = noteSchema.parse(formData);

        const noteDataToInsert: Omit<Note, 'id' | 'created_at'> = {
            topic_title: validatedData.topic_title,
            subject_id: validatedData.subject_id,
            chapter_id: validatedData.chapter_id || null,
            content: validatedData.content || '',
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

        // Handle PDF Uploads
        if (validatedData.new_pdf_urls && validatedData.new_pdf_urls.length > 0) {
            const pdfInsertions = validatedData.new_pdf_urls.map(url => ({ note_id: note.id, pdf_url: url }));
            const { error: pdfError } = await supabaseAdmin.from('note_pdfs').insert(pdfInsertions);
            if (pdfError) throw pdfError;
        }

        // Handle Image Uploads
        if (validatedData.new_image_urls && validatedData.new_image_urls.length > 0) {
            const imageInsertions = validatedData.new_image_urls.map(url => ({ note_id: note.id, image_url: url }));
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

export async function updateNoteAction(id: number, formData: Omit<z.infer<typeof noteSchema>, 'new_pdf_urls' | 'new_image_urls'> & {new_pdf_urls?: string[], new_image_urls?: string[], images_to_delete?: number[], pdfs_to_delete?: number[]}): Promise<{ success: boolean; error?: string }> {
     try {
        const validatedData = noteSchema.parse(formData);
        const existingNote = await getNoteByIdAdmin(id);
        if (!existingNote) throw new Error("Note not found.");

        const { images_to_delete = [], pdfs_to_delete = [] } = formData;

        // 1. Delete marked images and PDFs
        if (images_to_delete.length > 0) {
            const { error } = await supabaseAdmin.from('note_images').delete().in('id', images_to_delete);
            if (error) throw error;
        }
        if (pdfs_to_delete.length > 0) {
            const { error } = await supabaseAdmin.from('note_pdfs').delete().in('id', pdfs_to_delete);
            if (error) throw error;
        }

        // 2. Add new images and PDFs
        if (validatedData.new_image_urls && validatedData.new_image_urls.length > 0) {
            const imageInsertions = validatedData.new_image_urls.map(url => ({ note_id: id, image_url: url }));
            const { error } = await supabaseAdmin.from('note_images').insert(imageInsertions);
            if (error) throw error;
        }
        if (validatedData.new_pdf_urls && validatedData.new_pdf_urls.length > 0) {
             // Delete existing PDFs if a new one is uploaded
            const existingPdfs = existingNote.pdfs?.filter(p => !pdfs_to_delete.includes(p.id)) || [];
            if (existingPdfs.length > 0) {
                const existingPdfIds = existingPdfs.map(p => p.id);
                await supabaseAdmin.from('note_pdfs').delete().in('id', existingPdfIds);
            }
            const pdfInsertions = validatedData.new_pdf_urls.map(url => ({ note_id: id, pdf_url: url }));
            const { error } = await supabaseAdmin.from('note_pdfs').insert(pdfInsertions);
            if (error) throw error;
        }
        
        // 3. Update note details
        const noteDataToUpdate: Partial<Note> = {
            topic_title: validatedData.topic_title,
            subject_id: validatedData.subject_id,
            chapter_id: validatedData.chapter_id || null,
            content: validatedData.content || '',
            is_published: validatedData.is_published
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
