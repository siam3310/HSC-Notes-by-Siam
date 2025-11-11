
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
import { Loader2, ArrowLeft, Trash2, PlusCircle, Link as LinkIcon, X, FileImage, FileText, Code } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from './ui/textarea';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadProgress } from './FileUploadProgress';
import { supabase } from '@/lib/supabase';
import { Loader } from './Loader';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_PDF_TYPE = "application/pdf";

const noteFormSchema = z.object({
  subject_id: z.coerce.number().positive({ message: 'Please select a subject.' }),
  chapter_id: z.coerce.number().optional().nullable(),
  topic_title: z.string().min(3, { message: 'Topic title must be at least 3 characters.' }),
  content: z.string().optional(),
  display_order: z.coerce.number().default(0),
  is_published: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface FileUpload {
    id: string;
    file: File;
    progress: number;
    url?: string;
    error?: string;
    source?: AbortController;
}

interface UrlItem {
    id: string;
    url: string;
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

  // States for new uploads/links
  const [imageUploads, setImageUploads] = useState<FileUpload[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [newImageUrls, setNewImageUrls] = useState<UrlItem[]>([]);

  const [pdfUploads, setPdfUploads] = useState<FileUpload[]>([]);
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [newPdfUrls, setNewPdfUrls] = useState<UrlItem[]>([]);

  const [embedUrlInput, setEmbedUrlInput] = useState('');
  const [newEmbedUrls, setNewEmbedUrls] = useState<UrlItem[]>([]);

  // States for deleting existing items
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [pdfsToDelete, setPdfsToDelete] = useState<number[]>([]);
  const [embedsToDelete, setEmbedsToDelete] = useState<number[]>([]);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
        subject_id: note?.subject_id || undefined,
        chapter_id: note?.chapter_id || null,
        topic_title: note?.topic_title || '',
        content: note?.content || '',
        display_order: note?.display_order || 0,
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
    const fileIsPdf = file.type === ACCEPTED_PDF_TYPE;
    const setter = fileIsPdf ? setPdfUploads : setImageUploads;
    const folder = fileIsPdf ? 'pdfs' : 'images';

    const newUpload: FileUpload = { id: uuidv4(), file, progress: 0, source: new AbortController() };
    setter(prev => [...prev, newUpload]);
    
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const filePath = `${folder}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('notes-pdfs')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('notes-pdfs').getPublicUrl(filePath);
      if (!publicUrl) throw new Error('Could not get public URL for uploaded file.');
      
      setter(prev => prev.map(up => up.id === newUpload.id ? { ...up, progress: 100, url: publicUrl } : up));
    } catch (error: any) {
      console.error('Upload Error:', error);
      setter(prev => prev.map(up => up.id === newUpload.id ? { ...up, progress: 0, error: error.message } : up));
      toast({ variant: 'destructive', title: `Upload Failed for ${file.name}`, description: error.message });
    }
  }, [toast]);
  
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
      const files = e.target.files;
      if (!files) return;
      
      const acceptedTypes = type === 'image' ? ACCEPTED_IMAGE_TYPES : [ACCEPTED_PDF_TYPE];

      Array.from(files).forEach(file => {
        if (acceptedTypes.includes(file.type)) {
            handleFileUpload(file);
        } else {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: `File type ${file.type} is not supported for this section.` });
        }
      });
      
      e.target.value = ''; 
  };
  
  const addUrl = (type: 'image' | 'pdf' | 'embed') => {
    let urlInput: string, setUrlInput: (val: string) => void, setNewUrls: (fn: (prev: UrlItem[]) => UrlItem[]) => void, errorTitle: string;

    switch (type) {
        case 'image': [urlInput, setUrlInput, setNewUrls, errorTitle] = [imageUrlInput, setImageUrlInput, setNewImageUrls, 'Invalid Image URL']; break;
        case 'pdf': [urlInput, setUrlInput, setNewUrls, errorTitle] = [pdfUrlInput, setPdfUrlInput, setNewPdfUrls, 'Invalid PDF URL']; break;
        case 'embed': [urlInput, setUrlInput, setNewUrls, errorTitle] = [embedUrlInput, setEmbedUrlInput, setNewEmbedUrls, 'Invalid Embed URL']; break;
    }

    try {
        const parsedUrl = z.string().url().parse(urlInput);
        setNewUrls(prev => [...prev, { id: uuidv4(), url: parsedUrl }]);
        setUrlInput('');
    } catch (error) {
        toast({ variant: 'destructive', title: errorTitle, description: 'Please enter a valid URL.' });
    }
  };

  const removeUpload = (id: string, type: 'image' | 'pdf') => {
      const setter = type === 'image' ? setImageUploads : setPdfUploads;
      setter(prev => prev.filter(up => up.id !== id));
  };
  
  const removeUrl = (id: string, type: 'image' | 'pdf' | 'embed') => {
      const setter = type === 'image' ? setNewImageUrls : type === 'pdf' ? setNewPdfUrls : setNewEmbedUrls;
      setter(prev => prev.filter(p => p.id !== id));
  };

  const onSubmit = async (data: NoteFormValues) => {
    const allUploads = [...imageUploads, ...pdfUploads];
    const isUploading = allUploads.some(up => up.progress > 0 && up.progress < 100);

    if (isUploading) {
        toast({ variant: 'destructive', title: 'Please wait for all uploads to complete.' });
        return;
    }

    const finalImageUrls = [
      ...imageUploads.map(f => f.url).filter((url): url is string => !!url),
      ...newImageUrls.map(p => p.url)
    ];
    const finalPdfUrls = [
      ...pdfUploads.map(f => f.url).filter((url): url is string => !!url),
      ...newPdfUrls.map(p => p.url)
    ];
    const finalEmbedUrls = newEmbedUrls.map(p => p.url);

    const payload:any = {
        ...data,
        new_image_urls: finalImageUrls,
        new_pdf_urls: finalPdfUrls,
        new_embed_urls: finalEmbedUrls,
    };
    
    if (isEditMode) {
      payload.images_to_delete = imagesToDelete;
      payload.pdfs_to_delete = pdfsToDelete;
      payload.embeds_to_delete = embedsToDelete;
    }

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
  
  const isSubmitting = form.formState.isSubmitting || [...imageUploads, ...pdfUploads].some(up => up.progress > 0 && up.progress < 100);

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
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        control={form.control} name="display_order"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                            <FormDescription>Lower numbers appear first. Default is 0.</FormDescription>
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
                </CardContent>
            </Card>

            {/* Images Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5 text-muted-foreground"/> Images (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="space-y-2">
                        <FormLabel>Add new images</FormLabel>
                         <div className="flex gap-2">
                            <Input type="url" placeholder="Paste an image URL" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl('image'); }}} disabled={isSubmitting} />
                            <Button type="button" variant="outline" onClick={() => addUrl('image')} disabled={isSubmitting || !imageUrlInput}><PlusCircle className="h-4 w-4 mr-2" /> Add URL</Button>
                        </div>
                        <FormControl>
                            <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple onChange={(e) => handleFileSelection(e, 'image')} disabled={isSubmitting} className="h-auto p-2" />
                        </FormControl>
                    </div>
                     <div className="space-y-2">
                        {newImageUrls.map(p => (<div key={p.id} className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50"><LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-sm font-medium flex-grow truncate">{p.url}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeUrl(p.id, 'image')}><X className="h-4 w-4"/></Button></div>))}
                        {imageUploads.map(upload => <FileUploadProgress key={upload.id} upload={upload} onRemove={() => removeUpload(upload.id, 'image')}/>)}
                    </div>
                </CardContent>
            </Card>

            {/* PDF Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground"/> PDF Documents (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditMode && note?.pdfs?.filter(pdf => !pdfsToDelete.includes(pdf.id)).map(pdf => (
                        <div key={pdf.id} className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50 group">
                            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a href={pdf.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex-grow truncate">{pdf.pdf_url}</a>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 opacity-50 group-hover:opacity-100" onClick={() => setPdfsToDelete(prev => [...prev, pdf.id])}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                    <div className="space-y-2">
                        <FormLabel>Add new PDFs</FormLabel>
                        <div className="flex gap-2">
                            <Input type="url" placeholder="Paste a direct PDF URL" value={pdfUrlInput} onChange={(e) => setPdfUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl('pdf'); }}} disabled={isSubmitting} />
                            <Button type="button" variant="outline" onClick={() => addUrl('pdf')} disabled={isSubmitting || !pdfUrlInput}><PlusCircle className="h-4 w-4 mr-2" /> Add URL</Button>
                        </div>
                        <FormControl>
                            <Input type="file" accept={ACCEPTED_PDF_TYPE} multiple onChange={(e) => handleFileSelection(e, 'pdf')} disabled={isSubmitting} className="h-auto p-2" />
                        </FormControl>
                    </div>
                    <div className="space-y-2">
                        {newPdfUrls.map(p => (<div key={p.id} className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50"><LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-sm font-medium flex-grow truncate">{p.url}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeUrl(p.id, 'pdf')}><X className="h-4 w-4"/></Button></div>))}
                        {pdfUploads.map(upload => <FileUploadProgress key={upload.id} upload={upload} onRemove={() => removeUpload(upload.id, 'pdf')}/>)}
                    </div>
                </CardContent>
            </Card>

            {/* Embed Section */}
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-muted-foreground"/> Embed Links (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isEditMode && note?.embeds?.filter(embed => !embedsToDelete.includes(embed.id)).map(embed => (
                        <div key={embed.id} className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50 group">
                            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a href={embed.embed_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline flex-grow truncate">{embed.embed_url}</a>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 opacity-50 group-hover:opacity-100" onClick={() => setEmbedsToDelete(prev => [...prev, embed.id])}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                    <div className="space-y-2">
                        <FormLabel>Add new embed links</FormLabel>
                         <div className="flex gap-2">
                            <Input type="url" placeholder="e.g., Google Drive folder link" value={embedUrlInput} onChange={(e) => setEmbedUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl('embed'); }}} disabled={isSubmitting} />
                            <Button type="button" variant="outline" onClick={() => addUrl('embed')} disabled={isSubmitting || !embedUrlInput}><PlusCircle className="h-4 w-4 mr-2" /> Add URL</Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        {newEmbedUrls.map(p => (<div key={p.id} className="flex items-center gap-4 p-3 border rounded-md bg-secondary/50"><LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-sm font-medium flex-grow truncate">{p.url}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeUrl(p.id, 'embed')}><X className="h-4 w-4"/></Button></div>))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
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
                    {isSubmitting ? <Loader /> : isEditMode ? 'Update Note' : 'Create Note'}
                </Button>
            </div>
        </form>
        </Form>
    </div>
  );
}
