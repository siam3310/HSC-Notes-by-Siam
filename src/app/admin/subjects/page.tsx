'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Subject, Chapter } from '@/lib/types';
import { 
  getSubjectsAction,
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
  getChaptersForSubjectAction,
  createChapterAction,
  updateChapterAction,
  deleteChapterAction
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, Edit, Save, X, Loader2, BookOpen, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Record<number, Chapter[]>>({});
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState<Record<number, string>>({});
  
  const [editingSubject, setEditingSubject] = useState<{ id: number, name: string } | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ id: number, name: string, subjectId: number } | null>(null);
  const [editedValue, setEditedValue] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const result = await getSubjectsAction();
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error fetching subjects', description: result.error });
      setSubjects([]);
    } else {
      setSubjects(result.subjects);
    }
    setLoading(false);
  };
  
  const handleAccordionToggle = async (subjectId: number) => {
    if (!chapters[subjectId]) {
      const result = await getChaptersForSubjectAction(subjectId);
      if (result.chapters) {
        setChapters(prev => ({ ...prev, [subjectId]: result.chapters }));
      } else {
        toast({ variant: 'destructive', title: 'Error fetching chapters', description: result.error });
      }
    }
  };

  const handleAddSubject = () => {
    if (newSubjectName.trim() === '') {
        toast({ variant: 'destructive', title: 'Error', description: 'Subject name cannot be empty.' });
        return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', newSubjectName);
      const result = await createSubjectAction(formData);
      if (result.success) {
        toast({ title: 'Success', description: 'Subject added successfully.' });
        setNewSubjectName('');
        fetchSubjects();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handleUpdateSubject = () => {
    if (!editingSubject || editedValue.trim() === '') return;
    startTransition(async () => {
      const result = await updateSubjectAction(editingSubject.id, editedValue);
      if (result.success) {
        toast({ title: 'Success', description: 'Subject updated successfully.' });
        setSubjects(subjects.map(s => s.id === editingSubject.id ? { ...s, name: editedValue } : s));
        setEditingSubject(null);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };
  
  const handleDeleteSubject = (subjectId: number) => {
    startTransition(async () => {
      const result = await deleteSubjectAction(subjectId);
      if (result.success) {
        toast({ title: 'Success', description: 'Subject deleted successfully.' });
        setSubjects(subjects.filter(s => s.id !== subjectId));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };
  
  const handleAddChapter = (subjectId: number) => {
    const chapterName = newChapterName[subjectId]?.trim();
    if (!chapterName) {
        toast({ variant: 'destructive', title: 'Error', description: 'Chapter name cannot be empty.' });
        return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', chapterName);
      formData.append('subject_id', String(subjectId));
      const result = await createChapterAction(formData);
      if (result.success) {
        toast({ title: 'Success', description: 'Chapter added successfully.' });
        setNewChapterName({ ...newChapterName, [subjectId]: '' });
        // Refetch chapters for the specific subject to show the new one
        const chaptersResult = await getChaptersForSubjectAction(subjectId);
        if (chaptersResult.chapters) {
          setChapters(prev => ({ ...prev, [subjectId]: chaptersResult.chapters }));
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };
  
  const handleUpdateChapter = () => {
    if (!editingChapter || editedValue.trim() === '') return;
    startTransition(async () => {
      const result = await updateChapterAction(editingChapter.id, editedValue);
      if (result.success) {
        toast({ title: 'Success', description: 'Chapter updated successfully.' });
        setChapters(prev => ({
            ...prev,
            [editingChapter.subjectId]: prev[editingChapter.subjectId].map(c => c.id === editingChapter.id ? { ...c, name: editedValue } : c)
        }));
        setEditingChapter(null);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };
  
  const handleDeleteChapter = (chapterId: number, subjectId: number) => {
    startTransition(async () => {
      const result = await deleteChapterAction(chapterId);
      if (result.success) {
        toast({ title: 'Success', description: 'Chapter deleted successfully.' });
        setChapters(prev => ({
            ...prev,
            [subjectId]: prev[subjectId].filter(c => c.id !== chapterId)
        }));
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const startEditingSubject = (subject: Subject) => {
    setEditingSubject({ id: subject.id, name: subject.name });
    setEditedValue(subject.name);
    setEditingChapter(null);
  };
  
  const startEditingChapter = (chapter: Chapter, subjectId: number) => {
    setEditingChapter({ id: chapter.id, name: chapter.name, subjectId });
    setEditedValue(chapter.name);
    setEditingSubject(null);
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Subjects & Chapters</h1>
            <p className="text-muted-foreground">Manage all subjects and their corresponding chapters from the database.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
           <CardTitle>Add New Subject</CardTitle>
           <CardDescription>Enter a name to add a new subject to the list.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-2">
                <Input
                placeholder="e.g., Biology 1st Paper"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                disabled={isPending}
                />
                <Button onClick={handleAddSubject} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4 mr-2"/>}
                  Add Subject
                </Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Manage Existing Subjects</CardTitle>
            <CardDescription>Add, edit, or delete chapters for each subject.</CardDescription>
        </CardHeader>
        <CardContent>
            {subjects.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {subjects.map(subject => (
                    <AccordionItem value={String(subject.id)} key={subject.id}>
                        <div className="flex items-center group">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4 flex-grow" onClick={() => handleAccordionToggle(subject.id)}>
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    {editingSubject?.id === subject.id ? (
                                        <div className="flex gap-2 w-full">
                                            <Input value={editedValue} onChange={e => setEditedValue(e.target.value)} className="h-8" onClick={e => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); if(e.key === 'Enter') handleUpdateSubject()}}/>
                                            <Button size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleUpdateSubject()}} disabled={isPending}><Save className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); setEditingSubject(null)}}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <span className="flex-grow text-left">{subject.name}</span>
                                    )}
                                </div>
                            </AccordionTrigger>
                            {!editingSubject && !editingChapter && (
                                <div className="flex items-center mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" disabled={isPending} onClick={(e) => {e.stopPropagation(); startEditingSubject(subject)}}><Edit className="h-4 w-4"/></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isPending} onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will delete the subject &quot;{subject.name}&quot; and all its chapters. This action cannot be undone.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                        <AccordionContent>
                        <div className="space-y-4 pl-8 pt-2">
                             <ul className="flex flex-col gap-2">
                                {chapters[subject.id]?.map(chapter => (
                                    <li key={chapter.id} className="flex items-center gap-3 p-2 rounded-md group hover:bg-secondary">
                                       <FileText className="h-4 w-4 text-muted-foreground" />
                                       {editingChapter?.id === chapter.id ? (
                                            <div className="flex gap-2 w-full">
                                                <Input value={editedValue} onChange={e => setEditedValue(e.target.value)} className="h-8" onKeyDown={e => e.key === 'Enter' && handleUpdateChapter()}/>
                                                <Button size="icon" className="h-8 w-8" onClick={handleUpdateChapter} disabled={isPending}><Save className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingChapter(null)}><X className="h-4 w-4"/></Button>
                                            </div>
                                       ) : (
                                           <>
                                            <span className="flex-grow text-foreground/90">{chapter.name}</span>
                                            {!editingSubject && !editingChapter && (
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" disabled={isPending} onClick={() => startEditingChapter(chapter, subject.id)}><Edit className="h-4 w-4"/></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" disabled={isPending} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the chapter &quot;{chapter.name}&quot;.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id, subject.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                           </>
                                       )}
                                    </li>
                                ))}
                                {!chapters[subject.id] && <Loader2 className="h-4 w-4 animate-spin my-2" />}
                                {chapters[subject.id] && chapters[subject.id].length === 0 && (
                                    <li className="text-muted-foreground p-2 text-sm">No chapters yet. Add one below.</li>
                                )}
                            </ul>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add new chapter..."
                                    value={newChapterName[subject.id] || ''}
                                    onChange={e => setNewChapterName({ ...newChapterName, [subject.id]: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleAddChapter(subject.id)}
                                    disabled={isPending}
                                />
                                <Button onClick={() => handleAddChapter(subject.id)} variant="secondary" disabled={isPending}>
                                    <PlusCircle className="h-4 w-4 mr-2"/>Add Chapter
                                </Button>
                            </div>
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                 <div className="text-center py-12 text-muted-foreground">
                    <p>No subjects found. Start by adding a new subject above.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
