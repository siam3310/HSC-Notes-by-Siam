'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Note } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createNoteAction, updateNoteAction } from '@/app/admin/actions';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const noteFormSchema = z.object({
  subject: z.string().min(2, {
    message: 'Subject must be at least 2 characters.',
  }),
  chapter_name: z.string().min(3, {
    message: 'Chapter name must be at least 3 characters.',
  }),
  topic_title: z.string().min(3, {
    message: 'Topic title must be at least 3 characters.',
  }),
  content_html: z.string().optional(),
  pdf_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  pdf_file: z
    .any()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
  is_published: z.boolean().default(false),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  note?: Note | null;
}

export function NoteForm({ note }: NoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!note;

  const defaultValues = isEditMode && note
    ? {
        subject: note.subject,
        chapter_name: note.chapter_name,
        topic_title: note.topic_title,
        content_html: note.content_html || '',
        pdf_url: note.pdf_url || '',
        is_published: note.is_published,
        pdf_file: undefined,
      }
    : {
        subject: '',
        chapter_name: '',
        topic_title: '',
        content_html: '',
        pdf_url: '',
        is_published: false,
        pdf_file: undefined,
      };

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: NoteFormValues) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'pdf_file') {
            if (value && value.length > 0) {
                formData.append(key, value[0]);
            }
        } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    try {
        let result;
        if (isEditMode && note) {
            result = await updateNoteAction(note.id, formData);
        } else {
            result = await createNoteAction(formData);
        }

        if (result.success) {
            toast({
                title: isEditMode ? 'Note Updated' : 'Note Created',
                description: `Successfully ${isEditMode ? 'updated' : 'created'} "${data.topic_title}".`,
            });
            router.push('/admin');
            router.refresh();
        } else {
            throw new Error(result.error || 'Operation failed');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: error.message || `Could not ${isEditMode ? 'update' : 'create'} the note. Please try again.`,
        });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Link href="/admin">
                <Button variant="ghost" className="text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin Dashboard
                </Button>
            </Link>
        </div>
        <div className="bg-card p-6 sm:p-8 rounded-lg border">
            <header className="border-b pb-4 mb-6">
                 <h1 className="text-3xl font-bold tracking-tight">
                    {isEditMode ? 'Edit Note' : 'Create New Note'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isEditMode ? 'Update the details of the note.' : 'Fill in the details to create a new note.'}
                </p>
            </header>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Physics" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="chapter_name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Chapter Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Chapter 1: Kinematics" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="topic_title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Topic Title</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Motion in a Straight Line" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="content_html"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Content (HTML)</FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder="<h1>Title</h1><p>Your note content here...</p>"
                            className="min-h-[200px] font-mono"
                            {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                    control={form.control}
                    name="pdf_file"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload PDF</FormLabel>
                            <FormControl>
                                <Input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => field.onChange(e.target.files)}
                                />
                            </FormControl>
                            <FormDescription>
                                Upload a PDF file directly (max 5MB). This will override the PDF URL field.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <FormField
                control={form.control}
                name="pdf_url"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>PDF URL (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="https://example.com/note.pdf" {...field} />
                    </FormControl>
                     <FormDescription>
                        Use this if you are linking to an external PDF instead of uploading.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Status</FormLabel>
                        <p className="text-sm text-muted-foreground">
                            Make this note visible to all users.
                        </p>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.push('/admin')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-32">
                        {form.formState.isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isEditMode ? 'Update Note' : 'Create Note'}
                    </Button>
                </div>
            </form>
            </Form>
        </div>
    </div>
  );
}
