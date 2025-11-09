'use server';

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getDashboardStats() {
    try {
        const [
            { count: noteCount },
            { count: subjectCount },
            { count: chapterCount }
        ] = await Promise.all([
            supabaseAdmin.from('notes').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('subjects').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('chapters').select('*', { count: 'exact', head: true })
        ]);

        return {
            success: true,
            data: {
                noteCount: noteCount ?? 0,
                subjectCount: subjectCount ?? 0,
                chapterCount: chapterCount ?? 0,
            }
        };
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return { success: false, error: error.message };
    }
}
