
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NoteWithRelations, Subject, Chapter } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createNoteAction, updateNoteAction } from '@/app/admin/notes/actions';
import { Loader2, ArrowLeft, Trash2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_PDF_TYPE = "application/pdf";

const noteFormSchema = z.object({
  subject_id: z.coerce.number().positive({ message: 'Please select a subject.' }),
  chapter_id: z.coerce.number().optional().nullable(),
  topic_title: z.string().min(3, { message: 'Topic title must be at least 3 characters.' }),
  content: z.string().optional(),
  images: z.any().optional(),
  pdf: z.any().optional(),
  images_to_delete: z.array(z.number()).optional(),
  pdf_to_delete: z.boolean().optional(),
  is_published: z.enum(['true', 'false']).transform(val => val === 'true'),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  note?: NoteWithRelations | null;
  subjects: Subject[];
  chapters: Chapter[];
}

export function NoteForm({ note, subjects, chapters }: NoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!note;

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
        subject_id: note?.subject_id || 0,
        chapter_id: note?.chapter_id || null,
        topic_title: note?.topic_title || '',
        content: note?.content || '',
        is_published: note?.is_published ?? false,
        images: undefined,
        pdf: undefined,
        images_to_delete: [],
        pdf_to_delete: false,
      },
  });

  const selectedSubjectId = form.watch('subject_id');
  const [chaptersForSelectedSubject, setChaptersForSelectedSubject] = useState<Chapter[]>([]);

  useEffect(() => {
    if (selectedSubjectId > 0) {
      setChaptersForSelectedSubject(chapters.filter(c => c.subject_id === selectedSubjectId));
    } else {
      setChaptersForSelectedSubject([]);
    }
    if (!isEditMode || (isEditMode && note?.subject_id !== selectedSubjectId)) {
        form.setValue('chapter_id', null);
    }
  }, [selectedSubjectId, chapters, isEditMode, note, form]);

  useEffect(() => {
    if (isEditMode && note?.subject_id) {
       setChaptersForSelectedSubject(chapters.filter(c => c.subject_id === note.subject_id));
    }
  }, [isEditMode, note, chapters]);


  const onSubmit = async (data: NoteFormValues) => {
    const formData = new FormData();
    
    // Append all fields from the form data object
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' || key === 'pdf') return; // Skip files for now
        if (value !== null && value !== undefined) {
             if (key === 'chapter_id' && (value === 0 || value === '0')) return;
             if (key === 'images_to_delete') {
                 formData.append(key, JSON.stringify(value));
             } else {
                 formData.append(key, String(value));
             }
        }
    });

    // Append image files
    if (data.images) {
        for (let i = 0; i < data.images.length; i++) {
            formData.append('images', data.images[i]);
        }
    }
    // Append PDF file
    const newPdfFile = (data.pdf?.[0] as File | null);
    if (newPdfFile) {
        formData.append('pdf', newPdfFile);
    }

    try {
        const result = isEditMode && note
            ? await updateNoteAction(note.id, formData)
            : await createNoteAction(formData);

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
            description: error.message || `Could not perform the operation. Please try again.`,
        });
    }
  };

  const handleDeleteImage = (imageId: number) => {
    const currentImagesToDelete = form.getValues('images_to_delete') || [];
    form.setValue('images_to_delete', [...currentImagesToDelete, imageId]);
  };
  
  const handleDeletePdf = () => {
    form.setValue('pdf_to_delete', true);
  };
  
  const imagesToDelete = form.watch('images_to_delete') || [];
  const pdfToDelete = form.watch('pdf_to_delete');

  return (
    <div className="w-full space-y-6">
        <header>
            <Button variant="ghost" asChild>
                <Link href="/admin/notes"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Notes</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight px-4">{isEditMode ? 'Edit Note' : 'Create New Note'}</h1>
        </header>

        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardContent className="p-4 sm:p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control} name="subject_id"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {subjects.map(subject => <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} name="chapter_id"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Chapter (Optional)</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === '0' ? null : Number(value))} value={String(field.value ?? '0')} disabled={!selectedSubjectId}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={!selectedSubjectId ? "First select a subject" : "Select a chapter"} /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="0">No Chapter</SelectItem>
                                        {chaptersForSelectedSubject.map(chapter => <SelectItem key={chapter.id} value={String(chapter.id)}>{chapter.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control} name="topic_title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Topic Title</FormLabel>
                            <FormControl><Input placeholder="e.g., Motion in a Straight Line" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="content"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content (Optional)</FormLabel>
                            <FormControl><Textarea placeholder="Start writing your note here..." className="min-h-[200px]" {...field} value={field.value || ''} /></FormControl>
                            <FormDescription>Add optional text content for the note.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {isEditMode && note?.pdf_url && !pdfToDelete && (
                         <FormItem>
                            <FormLabel>Current PDF</FormLabel>
                            <div className="relative group flex items-center gap-4 p-3 border rounded-md">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                                <a href={note.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex-grow truncate">{decodeURIComponent(note.pdf_url.split('/').pop() ?? '')}</a>
                                <Button type="button" variant="destructive" size="icon" className="h-7 w-7 opacity-80 group-hover:opacity-100" onClick={handleDeletePdf}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </FormItem>
                    )}

                    <FormField
                        control={form.control}
                        name="pdf"
                        render={({ field: { onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>{(isEditMode && note?.pdf_url && !pdfToDelete) ? "Replace PDF" : "Upload PDF (Optional)"}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept={ACCEPTED_PDF_TYPE} 
                                        onChange={(e) => onChange(e.target.files)}
                                        {...fieldProps}
                                    />
                                </FormControl>
                                <FormDescription>Upload a single PDF file for this note.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <hr/>

                    {isEditMode && note?.images && note.images.length > 0 && (
                        <FormItem>
                            <FormLabel>Current Images</FormLabel>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {note.images.filter(img => !imagesToDelete.includes(img.id)).map(image => (
                                    <div key={image.id} className="relative group">
                                        <Image src={image.image_url} alt="Current note image" width={200} height={200} className="rounded-md object-cover aspect-square"/>
                                        <div className="absolute top-1 right-1">
                                            <Button type="button" variant="destructive" size="icon" className="h-7 w-7 opacity-80 group-hover:opacity-100" onClick={() => handleDeleteImage(image.id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <FormDescription>Click the trash icon to mark an image for deletion on update.</FormDescription>
                        </FormItem>
                    )}

                     <FormField
                        control={form.control}
                        name="images"
                        render={({ field: { onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>{(isEditMode && note?.images && note.images.length > 0) ? "Add More Images" : "Upload Images (Optional)"}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept={ACCEPTED_IMAGE_TYPES.join(',')} 
                                        multiple 
                                        onChange={(e) => onChange(e.target.files)}
                                        {...fieldProps}
                                    />
                                </FormControl>
                                <FormDescription>Upload one or more images for this note.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control} name="is_published"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-secondary/50 p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Publish Status</FormLabel>
                                <p className="text-sm text-muted-foreground">Make this note visible to all users.</p>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 px-2 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-32">
                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditMode ? 'Update Note' : 'Create Note'}
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}

