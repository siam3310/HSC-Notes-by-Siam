
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Note, Subject, Chapter } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createNoteAction, updateNoteAction } from '@/app/admin/notes/actions';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from './ui/textarea';

const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"];

const noteFormSchema = z.object({
  subject_id: z.coerce.number().positive({ message: 'Please select a subject.' }),
  chapter_id: z.coerce.number().optional().nullable(),
  topic_title: z.string().min(3, {
    message: 'Topic title must be at least 3 characters.',
  }),
  content: z.string().optional(),
  pdf_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  pdf_file: z
    .any()
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf, .jpg, .png, .gif, .webp files are accepted."
    ),
  is_published: z.boolean().default(false),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  note?: Note | null;
  subjects: Subject[];
  chapters: Chapter[];
}

export function NoteForm({ note, subjects, chapters }: NoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!note;

  const defaultValues = isEditMode && note
    ? {
        subject_id: note.subject_id,
        chapter_id: note.chapter_id,
        topic_title: note.topic_title,
        content: note.content || '',
        pdf_url: note.pdf_url || '',
        is_published: note.is_published,
        pdf_file: undefined,
      }
    : {
        subject_id: 0,
        chapter_id: null,
        topic_title: '',
        content: '',
        pdf_url: '',
        is_published: false,
        pdf_file: undefined,
      };

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues,
  });

  const selectedSubjectId = form.watch('subject_id');
  const [chaptersForSelectedSubject, setChaptersForSelectedSubject] = useState<Chapter[]>([]);

  useEffect(() => {
    if (selectedSubjectId > 0) {
      setChaptersForSelectedSubject(chapters.filter(c => c.subject_id === selectedSubjectId));
    } else {
      setChaptersForSelectedSubject([]);
    }
     // Reset chapter when subject changes, unless we are in edit mode and on initial load
    if (!isEditMode || (isEditMode && note?.subject_id !== selectedSubjectId)) {
        form.setValue('chapter_id', null);
    }
  }, [selectedSubjectId, chapters, isEditMode, note, form]);

  // When in edit mode, populate chapters for the initial subject
  useEffect(() => {
    if (isEditMode && note?.subject_id) {
       setChaptersForSelectedSubject(chapters.filter(c => c.subject_id === note.subject_id));
    }
  }, [isEditMode, note, chapters]);


  const onSubmit = async (data: NoteFormValues) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'pdf_file') {
            if (value && value.length > 0) {
                formData.append(key, value[0]);
            }
        } else if (value !== null && value !== undefined) {
            if (key === 'chapter_id' && (value === 0 || value === '0')) {
              // Don't append if it's the "No Chapter" placeholder
            } else {
              formData.append(key, String(value));
            }
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
            router.push('/admin/notes');
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
    <div className="w-full space-y-6">
        <header className="flex items-center justify-between">
            <div>
                <Button variant="ghost" asChild>
                    <Link href="/admin/notes">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Notes
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight px-4">
                    {isEditMode ? 'Edit Note' : 'Create New Note'}
                </h1>
                <p className="text-muted-foreground mt-1 px-4">
                    {isEditMode ? 'Update the details of the note.' : 'Fill in the details to create a new note.'}
                </p>
            </div>
        </header>

        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardContent className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="subject_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {subjects.map(subject => (
                                    <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="chapter_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Chapter Name (Optional)</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(value === '0' ? null : Number(value))} 
                                    value={String(field.value ?? '0')} 
                                    disabled={!selectedSubjectId}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={!selectedSubjectId ? "First select a subject" : "Select a chapter"} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="0">No Chapter</SelectItem>
                                        {chaptersForSelectedSubject.map(chapter => (
                                            <SelectItem key={chapter.id} value={String(chapter.id)}>{chapter.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Start writing your note here..."
                                        className="min-h-[200px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                Add text content if there is no PDF or Image.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="pdf_file"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Upload PDF or Image</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...fieldProps}
                                        type="file" 
                                        accept="application/pdf,image/*"
                                        onChange={(e) => {
                                        const file = e.target.files && e.target.files[0];
                                        onChange(file ? [file] : null);
                                        if (file) {
                                            form.setValue('pdf_url', ''); // Clear URL field if file is selected
                                        }
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Upload a PDF or an Image file directly. This will override the URL field.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="relative my-2">
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
                        <FormLabel>File URL (Optional)</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="https://example.com/note.pdf" 
                                {...field} 
                                onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value) {
                                        form.setValue('pdf_file', null); // Clear file input if URL is entered
                                    }
                                }}
                            />
                        </FormControl>
                        <FormDescription>
                            Link to an external PDF or Image. This will be ignored if a file is uploaded.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-secondary/50 p-4">
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
                </CardContent>
            </Card>
            <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 px-2 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>
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
  );
}
