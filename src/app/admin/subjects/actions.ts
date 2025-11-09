'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export interface SubjectData {
    name: string;
    chapters: string[];
}

const subjectsFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'subjects.json');

const subjectSchema = z.object({
    name: z.string().min(2, "Subject name must be at least 2 characters."),
    chapters: z.array(z.string().min(2, "Chapter name must be at least 2 characters.")),
});

// Action to read subjects data from the JSON file
export async function getSubjectsData(): Promise<{ success: boolean; data?: SubjectData[]; error?: string }> {
    try {
        const fileContent = await fs.readFile(subjectsFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to read subjects data:", error);
        if (error.code === 'ENOENT') {
            return { success: true, data: [] }; // File doesn't exist, return empty array
        }
        return { success: false, error: "Failed to load subject data." };
    }
}

// Action to write subjects data to the JSON file
export async function updateSubjectsData(subjects: SubjectData[]): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate the entire structure
        const validatedData = z.array(subjectSchema).parse(subjects);
        await fs.writeFile(subjectsFilePath, JSON.stringify(validatedData, null, 2));
        revalidatePath('/admin/subjects');
        revalidatePath('/admin/new');
        return { success: true };
    } catch (error: any) {
        console.error("Failed to write subjects data:", error);
         if (error instanceof z.ZodError) {
            return { success: false, error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}` };
        }
        return { success: false, error: "Failed to save subject data." };
    }
}
