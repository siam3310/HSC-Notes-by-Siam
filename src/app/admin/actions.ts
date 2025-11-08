'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Note } from '@/lib/types';

export async function createNoteAction(noteData: Omit<Note, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('notes')
        .insert([noteData]);
    
    if (error) {
        console.error('Error creating note:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
}

export async function updateNoteAction(id: number, noteData: Partial<Omit<Note, 'id' | 'created_at'>>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('notes')
        .update(noteData)
        .eq('id', id);

    if (error) {
        console.error('Error updating note:', error);
        return { success: false, error: error.message };
    }
    
    revalidatePath('/admin');
    revalidatePath(`/admin/edit/${id}`);
    revalidatePath(`/note/${id}`);
    return { success: true };
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

    revalidatePath('/admin');
    return { success: true };
}
