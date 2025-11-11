
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
} from '@/app/admin/subjects/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, Edit, Save, X, Loader2, BookOpen, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader } from '@/components/Loader';

export default function SubjectsPageClient() {
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
    // Only fetch if chapters for this subject aren't already loaded
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
        fetchSubjects(); // Refetch all subjects to include the new one
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
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Subjects & Chapters</h1>
        <p className="text-muted-foreground">Manage subjects and their corresponding chapters.</p>
      </header>

      <Card>
        <CardHeader>
           <CardTitle>Add New Subject</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="e.g., Physics 1st Paper"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                  disabled={isPending}
                  className="flex-grow"
                />
                <Button onClick={handleAddSubject} disabled={isPending || !newSubjectName.trim()} className="w-full sm:w-auto">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4 sm:mr-2"/>}
                  <span className="sm:inline">Add Subject</span>
                </Button>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Existing Subjects</CardTitle>
            <CardDescription>Click on a subject to view and manage its chapters.</CardDescription>
        </CardHeader>
        <CardContent>
            {subjects.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {subjects.map(subject => (
                    <AccordionItem value={String(subject.id)} key={subject.id}>
                        <div className="flex items-center group justify-between hover:bg-accent/50 rounded-md pr-2">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline py-3 px-4 flex-grow" onClick={() => handleAccordionToggle(subject.id)}>
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    <span className="flex-grow text-left">{subject.name}</span>
                                </div>
                            </AccordionTrigger>
                            
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" disabled={isPending} onClick={() => startEditingSubject(subject)}><Edit className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isPending}><Trash2 className="h-4 w-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will delete the subject &quot;{subject.name}&quot;. You can only delete a subject if no notes or chapters are associated with it.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>

                        <AccordionContent className="pt-2">
                        {editingSubject?.id === subject.id ? (
                            <div className="flex gap-2 w-full p-4 bg-secondary/50 rounded-b-md" onClick={e => e.stopPropagation()}>
                                <Input value={editedValue} onChange={e => setEditedValue(e.target.value)} className="h-9" onKeyDown={e => { if(e.key === 'Enter') handleUpdateSubject()}} autoFocus/>
                                <Button size="sm" onClick={handleUpdateSubject} disabled={isPending}><Save className="h-4 w-4 mr-2"/>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingSubject(null)}><X className="h-4 w-4 mr-2"/>Cancel</Button>
                            </div>
                        ) : (
                            <div className="space-y-4 pl-4 sm:pl-8">
                                <ul className="flex flex-col gap-2 pt-2">
                                    {chapters[subject.id]?.map(chapter => (
                                        <li key={chapter.id} className="flex items-center gap-2 p-2 rounded-md group hover:bg-secondary">
                                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          {editingChapter?.id === chapter.id ? (
                                              <div className="flex gap-2 w-full items-center">
                                                  <Input value={editedValue} onChange={e => setEditedValue(e.target.value)} className="h-8 flex-grow" onKeyDown={e => e.key === 'Enter' && handleUpdateChapter()} autoFocus/>
                                                  <Button size="icon" className="h-8 w-8" onClick={handleUpdateChapter} disabled={isPending}><Save className="h-4 w-4"/></Button>
                                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingChapter(null)}><X className="h-4 w-4"/></Button>
                                              </div>
                                          ) : (
                                              <>
                                                  <span className="flex-grow text-foreground/90 break-words">{chapter.name}</span>
                                                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <Button variant="ghost" size="icon" disabled={isPending} onClick={() => startEditingChapter(chapter, subject.id)}><Edit className="h-4 w-4"/></Button>
                                                      <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                              <Button variant="ghost" size="icon" disabled={isPending} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                              <AlertDialogHeader>
                                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                              <AlertDialogDescription>This will delete the chapter &quot;{chapter.name}&quot;. You can only delete a chapter if no notes are associated with it.</AlertDialogDescription>
                                                              </AlertDialogHeader>
                                                              <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id, subject.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                              </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                      </AlertDialog>
                                                  </div>
                                              </>
                                          )}
                                        </li>
                                    ))}
                                    {!chapters[subject.id] && <div className="flex justify-center p-4"><Loader /></div>}
                                    {chapters[subject.id] && chapters[subject.id].length === 0 && (
                                        <li className="text-muted-foreground px-2 py-4 text-sm text-center">No chapters yet. Add one below.</li>
                                    )}
                                </ul>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        placeholder="Add new chapter..."
                                        value={newChapterName[subject.id] || ''}
                                        onChange={e => setNewChapterName({ ...newChapterName, [subject.id]: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleAddChapter(subject.id)}
                                        disabled={isPending}
                                        className="flex-grow"
                                    />
                                    <Button onClick={() => handleAddChapter(subject.id)} variant="secondary" disabled={isPending || !(newChapterName[subject.id] || '').trim()} className="w-full sm:w-auto">
                                        <PlusCircle className="h-4 w-4 mr-2"/>Add Chapter
                                    </Button>
                                </div>
                            </div>
                        )}
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
