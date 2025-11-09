
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
import { createNoteAction, updateNoteAction, uploadFileAction } from '@/app/admin/notes/actions';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadProgress } from './FileUploadProgress';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_PDF_TYPE = "application/pdf";

const noteFormSchema = z.object({
  subject_id: z.coerce.number().positive({ message: 'Please select a subject.' }),
  chapter_id: z.coerce.number().optional().nullable(),
  topic_title: z.string().min(3, { message: 'Topic title must be at least 3 characters.' }),
  content: z.string().optional(),
  is_published: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface FileUpload {
    id: string;
    file: File;
    progress: number;
    url?: string;
    error?: string;
}

interface NoteFormProps {
  note?: NoteWithRelations | null;
  subjects: Subject[];
  chapters: Chapter[];
}

export function NoteForm({ note, subjects, chapters }: NoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!note;

  const [pdfUploads, setPdfUploads] = useState<FileUpload[]>([]);
  const [imageUploads, setImageUploads] = useState<FileUpload[]>([]);

  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [pdfsToDelete, setPdfsToDelete] = useState<number[]>([]);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
        subject_id: note?.subject_id || undefined,
        chapter_id: note?.chapter_id || null,
        topic_title: note?.topic_title || '',
        content: note?.content || '',
        is_published: note?.is_published ?? false,
      },
  });

  const selectedSubjectId = form.watch('subject_id');
  const [chaptersForSelectedSubject, setChaptersForSelectedSubject] = useState<Chapter[]>([]);

  useEffect(() => {
    if (selectedSubjectId) {
      setChaptersForSelectedSubject(chapters.filter(c => c.subject_id === selectedSubjectId));
    } else {
      setChaptersForSelectedSubject([]);
    }
    const isInitialization = !form.formState.isDirty && isEditMode;
    if (form.formState.dirtyFields.subject_id && !isInitialization) {
        form.setValue('chapter_id', null);
    }
  }, [selectedSubjectId, chapters, form, isEditMode]);
  
  const handleFileUpload = useCallback(async (file: File) => {
    const fileType = file.type === ACCEPTED_PDF_TYPE ? 'pdf' : 'image';
    const newUpload: FileUpload = { id: uuidv4(), file, progress: 0 };
    const setter = fileType === 'pdf' ? setPdfUploads : setImageUploads;

    setter(prev => [...prev, newUpload]);

    const formData = new FormData();
    formData.append('file', file);
    
    // Simulate progress while waiting for server action
    const progressInterval = setInterval(() => {
        setter(prev => prev.map(up => up.id === newUpload.id ? { ...up, progress: Math.min(up.progress + 10, 90) } : up));
    }, 200);


    try {
        const result = await uploadFileAction(formData);
        clearInterval(progressInterval);

        if (result.error || !result.url) {
            throw new Error(result.error || 'Upload failed on server.');
        }
        
        setter(prev => prev.map(up => up.id === newUpload.id ? { ...up, progress: 100, url: result.url! } : up));

    } catch (error: any) {
        clearInterval(progressInterval);
        console.error('Upload Error:', error);
        setter(prev => prev.map(up => up.id === newUpload.id ? { ...up, progress: 0, error: error.message } : up));
        toast({
            variant: 'destructive',
            title: `Upload Failed for ${file.name}`,
            description: error.message,
        });
    }
  }, [toast]);
  
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach(file => {
        if (file.type === ACCEPTED_PDF_TYPE) {
            // Replace existing PDF upload if a new one is selected
            setPdfUploads([]);
            handleFileUpload(file);
        } else if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            handleFileUpload(file);
        }
      });
      
      e.target.value = ''; // Reset input to allow re-selection of the same file
  };
  
  const removeUpload = (id: string, fileType: 'pdf' | 'image') => {
      const setter = fileType === 'pdf' ? setPdfUploads : setImageUploads;
      setter(prev => prev.filter(up => up.id !== id));
      // Optionally, add logic to delete from Supabase storage if already uploaded.
      // For now, we assume deletion only happens on form submit (via imagesToDelete/pdfsToDelete)
  };

  const onSubmit = async (data: NoteFormValues) => {
    const isUploading = [...pdfUploads, ...imageUploads].some(up => up.progress > 0 && up.progress < 100);
    if (isUploading) {
        toast({ variant: 'destructive', title: 'Please wait for all uploads to complete.' });
        return;
    }

    const new_pdf_urls = pdfUploads.map(f => f.url).filter((url): url is string => !!url);
    const new_image_urls = imageUploads.map(f => f.url).filter((url): url is string => !!url);

    const payload = {
        ...data,
        new_pdf_urls,
        new_image_urls,
        pdfs_to_delete: pdfsToDelete,
        images_to_delete: imagesToDelete,
    };

    try {
        const result = isEditMode && note
            ? await updateNoteAction(note.id, payload)
            : await createNoteAction(payload);

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
  
  const isSubmitting = form.formState.isSubmitting || [...pdfUploads, ...imageUploads].some(up => up.progress > 0 && up.progress < 100);

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
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : undefined}>
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

                    <div className="space-y-4">
                        <FormLabel>{(isEditMode && note?.pdfs && note.pdfs.length > 0) ? "Manage Files" : "Upload Files (Optional)"}</FormLabel>
                         {isEditMode && note?.pdfs?.filter(pdf => !pdfsToDelete.includes(pdf.id)).map(pdf => (
                            <div key={pdf.id} className="relative group flex items-center gap-4 p-3 border rounded-md bg-secondary/50">
                                 <a href={pdf.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex-grow truncate">{decodeURIComponent(pdf.pdf_url.split('/').pop()?.substring(14) ?? 'PDF Document')}</a>
                                <Button type="button" variant="destructive" size="icon" className="h-7 w-7 opacity-80 group-hover:opacity-100" onClick={() => setPdfsToDelete(prev => [...prev, pdf.id])}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                         {isEditMode && note?.images && note.images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {note.images.filter(img => !imagesToDelete.includes(img.id)).map(image => (
                                    <div key={image.id} className="relative group">
                                        <Image src={image.image_url} alt="Current note image" width={200} height={200} className="rounded-md object-cover aspect-square"/>
                                        <div className="absolute top-1 right-1">
                                            <Button type="button" variant="destructive" size="icon" className="h-7 w-7 opacity-80 group-hover:opacity-100" onClick={() => setImagesToDelete(prev => [...prev, image.id])}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <FormControl>
                            <Input
                                type="file"
                                accept={`${ACCEPTED_PDF_TYPE},${ACCEPTED_IMAGE_TYPES.join(',')}`}
                                multiple
                                onChange={handleFileSelection}
                                disabled={isSubmitting}
                            />
                        </FormControl>
                        {pdfUploads.map(upload => <FileUploadProgress key={upload.id} upload={upload} onRemove={() => removeUpload(upload.id, 'pdf')}/>)}
                        {imageUploads.map(upload => <FileUploadProgress key={upload.id} upload={upload} onRemove={() => removeUpload(upload.id, 'image')}/>)}
                        <FormDescription>Upload PDF or image files. Upload will start immediately.</FormDescription>
                    </div>

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
                <Button type="submit" disabled={isSubmitting} className="w-32">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditMode ? 'Update Note' : 'Create Note'}
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
