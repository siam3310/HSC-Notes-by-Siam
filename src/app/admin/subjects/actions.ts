'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Subject, Chapter } from '@/lib/types';

// ==================================
// GENERIC DATA FETCHING
// ==================================

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

// ==================================
// SUBJECT ACTIONS
// ==================================

const subjectSchema = z.object({
    name: z.string().min(2, "Subject name must be at least 2 characters long."),
});

export async function getSubjectsAction(): Promise<{ subjects: Subject[], error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        return { subjects: [], error: error.message };
    }
    return { subjects: data };
}

export async function createSubjectAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    const validatedFields = subjectSchema.safeParse({ name: formData.get('name') });
    
    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.flatten().fieldErrors.name?.[0] };
    }

    const { error } = await supabaseAdmin
        .from('subjects')
        .insert({ name: validatedFields.data.name });

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return { success: false, error: 'A subject with this name already exists.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/subjects');
    revalidatePath('/admin/new');
    return { success: true };
}


export async function updateSubjectAction(id: number, name: string): Promise<{ success: boolean; error?: string }> {
    const validatedFields = subjectSchema.safeParse({ name });

    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.flatten().fieldErrors.name?.[0] };
    }

    const { error } = await supabaseAdmin
        .from('subjects')
        .update({ name: validatedFields.data.name })
        .eq('id', id);

    if (error) {
       if (error.code === '23505') {
            return { success: false, error: 'A subject with this name already exists.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/subjects');
    revalidatePath('/admin/new');
    return { success: true };
}


export async function deleteSubjectAction(id: number): Promise<{ success: boolean; error?: string }> {
    // Foreign key in 'notes' table is ON DELETE RESTRICT, 
    // so Supabase will prevent deletion if notes exist.
    // We can rely on that and catch the specific error.
    const { error } = await supabaseAdmin
        .from('subjects')
        .delete()
        .eq('id', id);

    if (error) {
        if (error.code === '23503') { // Foreign key violation
             return { success: false, error: 'Cannot delete subject. There are still notes or chapters associated with it.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/subjects');
    revalidatePath('/admin/new');
    return { success: true };
}


// ==================================
// CHAPTER ACTIONS
// ==================================

const chapterSchema = z.object({
    name: z.string().min(2, "Chapter name must be at least 2 characters long."),
    subject_id: z.coerce.number().positive(),
});

export async function getChaptersForSubjectAction(subjectId: number): Promise<{ chapters: Chapter[], error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .order('name', { ascending: true });

    if (error) {
        return { chapters: [], error: error.message };
    }
    return { chapters: data };
}


export async function createChapterAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const subjectId = Number(formData.get('subject_id'));
    const validatedFields = chapterSchema.safeParse({ 
        name: formData.get('name'),
        subject_id: subjectId,
    });

    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.flatten().fieldErrors.name?.[0] };
    }

    const { error } = await supabaseAdmin
        .from('chapters')
        .insert({ ...validatedFields.data });

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return { success: false, error: 'A chapter with this name already exists for this subject.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/subjects');
    revalidatePath('/admin/new');
    return { success: true };
}


export async function updateChapterAction(id: number, name: string): Promise<{ success: boolean; error?: string }> {
     const validatedName = z.string().min(2, "Chapter name must be at least 2 characters long.").safeParse(name);

    if (!validatedName.success) {
        return { success: false, error: validatedName.error.flatten().fieldErrors._errors[0] };
    }

    const { error } = await supabaseAdmin
        .from('chapters')
        .update({ name: validatedName.data })
        .eq('id', id);

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'A chapter with this name already exists for this subject.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/subjects');
    revalidatePath('/admin/new');
    return { success: true };
}

export async function deleteChapterAction(id: number): Promise<{ success: boolean; error?: string }> {
    // Foreign key in 'notes' table is ON DELETE RESTRICT.
    // Supabase will throw an error if we try to delete a chapter that has notes.
    const { error } = await supabaseAdmin
        .from('chapters')
        .delete()
        .eq('id', id);

    if (error) {
         if (error.code === '23503') { // Foreign key violation
            return { success: false, error: 'Cannot delete chapter. There are still notes associated with it.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/subjects');
    revalidatePath('/admin/new');
    return { success: true };
}
