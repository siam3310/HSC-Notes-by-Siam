'use client';

import { useState, useEffect, useTransition } from 'react';
import { SubjectData, getSubjectsData, updateSubjectsData } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, Edit, Save, X, Loader2, BookOpen, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [newSubject, setNewSubject] = useState('');
  const [newChapters, setNewChapters] = useState<Record<string, string>>({});
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ subject: string, chapter: string } | null>(null);
  const [editedValue, setEditedValue] = useState('');
  
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const result = await getSubjectsData();
    if (result.success && result.data) {
      setSubjects(result.data);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setLoading(false);
  };
  
  const handleSaveChanges = () => {
    startTransition(async () => {
      const result = await updateSubjectsData(subjects);
      if (result.success) {
        toast({ title: 'Success', description: 'Subjects and chapters have been saved.' });
        setEditingChapter(null);
        setEditingSubject(null);
      } else {
        toast({ variant: 'destructive', title: 'Error saving changes', description: result.error });
      }
    });
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !subjects.find(s => s.name.toLowerCase() === newSubject.trim().toLowerCase())) {
      const updatedSubjects = [...subjects, { name: newSubject.trim(), chapters: [] }];
      setSubjects(updatedSubjects);
      setNewSubject('');
    } else {
        toast({ variant: 'destructive', title: 'Invalid Name', description: 'Subject name cannot be empty or a duplicate.'})
    }
  };

  const handleDeleteSubject = (subjectName: string) => {
    const updatedSubjects = subjects.filter(s => s.name !== subjectName);
    setSubjects(updatedSubjects);
  };
  
  const handleAddChapter = (subjectName: string) => {
    const chapterName = newChapters[subjectName]?.trim();
    if (chapterName) {
      const updatedSubjects = subjects.map(s => {
        if (s.name === subjectName) {
            if (s.chapters.find(c => c.toLowerCase() === chapterName.toLowerCase())) {
                toast({ variant: 'destructive', title: 'Duplicate Chapter', description: 'This chapter already exists for the subject.' });
                return s;
            }
          return { ...s, chapters: [...s.chapters, chapterName] };
        }
        return s;
      });
      setSubjects(updatedSubjects);
      setNewChapters({ ...newChapters, [subjectName]: '' });
    }
  };

  const handleDeleteChapter = (subjectName: string, chapterName: string) => {
    const updatedSubjects = subjects.map(s => {
      if (s.name === subjectName) {
        return { ...s, chapters: s.chapters.filter(c => c !== chapterName) };
      }
      return s;
    });
    setSubjects(updatedSubjects);
  };

  const startEditingSubject = (subject: SubjectData) => {
    setEditingSubject(subject.name);
    setEditedValue(subject.name);
    setEditingChapter(null);
  };

  const handleUpdateSubject = () => {
    if (editedValue.trim() && editingSubject) {
       if (editedValue.trim().toLowerCase() !== editingSubject.toLowerCase() && subjects.find(s => s.name.toLowerCase() === editedValue.trim().toLowerCase())) {
            toast({ variant: 'destructive', title: 'Duplicate Subject', description: 'A subject with this name already exists.' });
            return;
       }
      const updatedSubjects = subjects.map(s => s.name === editingSubject ? { ...s, name: editedValue.trim() } : s);
      setSubjects(updatedSubjects);
      setEditingSubject(null);
    }
  };

  const startEditingChapter = (subjectName: string, chapterName: string) => {
    setEditingChapter({ subject: subjectName, chapter: chapterName });
    setEditedValue(chapterName);
    setEditingSubject(null);
  };

  const handleUpdateChapter = () => {
    if (editedValue.trim() && editingChapter) {
      const updatedSubjects = subjects.map(s => {
        if (s.name === editingChapter.subject) {
             if (editedValue.trim().toLowerCase() !== editingChapter.chapter.toLowerCase() && s.chapters.find(c => c.toLowerCase() === editedValue.trim().toLowerCase())) {
                toast({ variant: 'destructive', title: 'Duplicate Chapter', description: 'This chapter already exists for the subject.' });
                return s;
            }
          const newChapters = s.chapters.map(c => c === editingChapter.chapter ? editedValue.trim() : c);
          return { ...s, chapters: newChapters };
        }
        return s;
      });
      setSubjects(updatedSubjects);
      setEditingChapter(null);
    }
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
            <p className="text-muted-foreground">Manage all subjects and their corresponding chapters.</p>
        </div>
         <Button onClick={handleSaveChanges} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
        </Button>
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
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject}><PlusCircle className="h-4 w-4 mr-2"/>Add Subject</Button>
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
                    <AccordionItem value={subject.name} key={subject.name}>
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4 group">
                        <div className="flex items-center gap-3 flex-grow">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                            {editingSubject === subject.name ? (
                                <div className="flex gap-2 w-full">
                                    <Input value={editedValue} onChange={e => setEditedValue(e.target.value)} className="h-8" onKeyDown={e => e.key === 'Enter' && handleUpdateSubject()}/>
                                    <Button size="icon" className="h-8 w-8" onClick={handleUpdateSubject}><Save className="h-4 w-4"/></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSubject(null)}><X className="h-4 w-4"/></Button>
                                </div>
                            ) : (
                                <span className="flex-grow">{subject.name}</span>
                            )}
                        </div>
                         {!editingSubject && !editingChapter && (
                            <div className="flex items-center mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); startEditingSubject(subject)}}><Edit className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4"/></Button>
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
                                        <AlertDialogAction onClick={() => handleDeleteSubject(subject.name)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                         )}
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="space-y-4 pl-8 pt-2">
                             <ul className="flex flex-col gap-2">
                                {subject.chapters.map(chapter => (
                                    <li key={chapter} className="flex items-center gap-3 p-2 rounded-md group hover:bg-secondary">
                                       <FileText className="h-4 w-4 text-muted-foreground" />
                                       {editingChapter?.subject === subject.name && editingChapter?.chapter === chapter ? (
                                            <div className="flex gap-2 w-full">
                                                <Input value={editedValue} onChange={e => setEditedValue(e.target.value)} className="h-8" onKeyDown={e => e.key === 'Enter' && handleUpdateChapter()}/>
                                                <Button size="icon" className="h-8 w-8" onClick={handleUpdateChapter}><Save className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingChapter(null)}><X className="h-4 w-4"/></Button>
                                            </div>
                                       ) : (
                                           <>
                                            <span className="flex-grow text-foreground/90">{chapter}</span>
                                            {!editingSubject && !editingChapter && (
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => startEditingChapter(subject.name, chapter)}><Edit className="h-4 w-4"/></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the chapter &quot;{chapter}&quot;.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteChapter(subject.name, chapter)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                           </>
                                       )}
                                    </li>
                                ))}
                                {subject.chapters.length === 0 && (
                                    <li className="text-muted-foreground p-2 text-sm">No chapters yet. Add one below.</li>
                                )}
                            </ul>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add new chapter..."
                                    value={newChapters[subject.name] || ''}
                                    onChange={e => setNewChapters({ ...newChapters, [subject.name]: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleAddChapter(subject.name)}
                                />
                                <Button onClick={() => handleAddChapter(subject.name)} variant="secondary">
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
