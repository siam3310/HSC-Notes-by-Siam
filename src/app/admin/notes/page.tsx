
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import type { NoteWithRelations, Subject } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Loader2, Search, MoreHorizontal, ArrowUpDown, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deleteMultipleNotesAction, deleteNoteAction, getNotesAdmin, updateNotePublishStatusAction } from './actions';
import { getSubjectsAction } from '../subjects/actions';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Loader } from '@/components/Loader';

export default function AdminNotesPage() {
  const [allNotes, setAllNotes] = useState<NoteWithRelations[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [notesResult, subjectsResult] = await Promise.all([
        getNotesAdmin(),
        getSubjectsAction()
    ]);

    if(notesResult.error) {
        toast({
            variant: 'destructive',
            title: 'Failed to fetch notes',
            description: notesResult.error,
        });
        setAllNotes([]);
    } else {
        setAllNotes(notesResult.notes);
    }
    
    if(subjectsResult.error) {
        toast({
            variant: 'destructive',
            title: 'Failed to fetch subjects',
            description: subjectsResult.error,
        });
        setSubjects([]);
    } else {
        setSubjects(subjectsResult.subjects);
    }

    setLoading(false);
  };
  
  const filteredNotes = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return allNotes.filter((note) => {
      const matchesSearch = !lowercasedFilter ||
        note.topic_title.toLowerCase().includes(lowercasedFilter) ||
        (note.subject_name && note.subject_name.toLowerCase().includes(lowercasedFilter)) ||
        (note.chapter_name && note.chapter_name.toLowerCase().includes(lowercasedFilter));

      const matchesSubject = selectedSubject === 'all' || note.subject_name === selectedSubject;
      
      return matchesSearch && matchesSubject;
    });
  }, [searchTerm, allNotes, selectedSubject]);

  const handleTogglePublish = (noteId: number, currentStatus: boolean) => {
    startTransition(async () => {
        // Optimistically update UI
        setAllNotes(prev => prev.map(note => note.id === noteId ? { ...note, is_published: !currentStatus } : note));

        const result = await updateNotePublishStatusAction(noteId, !currentStatus);
        
        if (!result.success) {
            // Revert optimistic update on failure
            setAllNotes(prev => prev.map(note => note.id === noteId ? { ...note, is_published: currentStatus } : note));
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error || 'Could not update the note status.',
            });
        } else {
             toast({
                title: 'Note Updated',
                description: `Note has been ${!currentStatus ? 'published' : 'unpublished'}.`,
            });
        }
    });
  };

  const handleDelete = (noteId: number) => {
    startTransition(async () => {
      const result = await deleteNoteAction(noteId);
      if (result.success) {
        setAllNotes(prev => prev.filter((note) => note.id !== noteId));
        setSelectedNotes(prev => prev.filter(id => id !== noteId));
        toast({
          title: 'Note Deleted',
          description: 'The note has been successfully deleted.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: result.error || 'Could not delete the note.',
        });
      }
    });
  };

  const handleSelectNote = (id: number) => {
    setSelectedNotes(prev => 
      prev.includes(id) ? prev.filter(noteId => noteId !== id) : [...prev, id]
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedNotes(checked ? filteredNotes.map(note => note.id) : []);
  };

  const handleDeleteMultiple = () => {
    startTransition(async () => {
        const result = await deleteMultipleNotesAction(selectedNotes);
        if (result.success) {
            setAllNotes(prev => prev.filter(note => !selectedNotes.includes(note.id)));
            setSelectedNotes([]);
            toast({
                title: 'Notes Deleted',
                description: `${selectedNotes.length} notes have been successfully deleted.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: result.error || 'Could not delete the selected notes.',
            });
        }
    });
  };
  
  const numSelected = selectedNotes.length;
  const numFiltered = filteredNotes.length;

  const NoteActionsDropdown = ({ noteId, noteTitle }: { noteId: number, noteTitle: string}) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions" disabled={isPending}>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
                 <a href={`/note/${noteId}`} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`/admin/edit/${noteId}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the note titled &quot;{noteTitle}&quot;.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleDelete(noteId)}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isPending}
                    >
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Notes Management</h1>
            <p className="text-muted-foreground">
                Create, edit, and manage all your study notes.
            </p>
        </div>
        <Link href="/admin/new" passHref>
          <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Note
          </Button>
        </Link>
      </header>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex flex-1 flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                          placeholder="Search notes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full"
                      />
                  </div>
                   <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                           <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                           <SelectValue placeholder="Filter by subject" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {numSelected > 0 && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isPending}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete ({numSelected})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the {numSelected} selected note(s). This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteMultiple}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={isPending}
                            >
                              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader />
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4">
                 {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <Card key={note.id} className="relative" data-state={selectedNotes.includes(note.id) ? 'selected' : ''}>
                          <div className="absolute top-3 left-3">
                              <Checkbox
                                checked={selectedNotes.includes(note.id)}
                                onCheckedChange={() => handleSelectNote(note.id)}
                                aria-label={`Select note ${note.topic_title}`}
                                disabled={isPending}
                              />
                          </div>
                          <div className="absolute top-2 right-2">
                             <NoteActionsDropdown noteId={note.id} noteTitle={note.topic_title} />
                          </div>
                          <CardHeader className="pr-12">
                              <h3 className="font-semibold">{note.topic_title}</h3>
                              <p className="text-sm text-muted-foreground">{note.subject_name}</p>
                              {note.chapter_name && <p className="text-sm text-muted-foreground">{note.chapter_name}</p>}
                          </CardHeader>
                          <CardContent className="pt-2">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`publish-switch-mobile-${note.id}`}
                                    checked={note.is_published}
                                    onCheckedChange={() => handleTogglePublish(note.id, note.is_published)}
                                    disabled={isPending}
                                  />
                                  <label htmlFor={`publish-switch-mobile-${note.id}`} className="text-sm font-medium text-muted-foreground">
                                    {note.is_published ? 'Published' : 'Draft'}
                                  </label>
                                </div>
                            </CardContent>
                          <CardFooter className="flex justify-between text-sm text-muted-foreground">
                              <span className='font-mono text-xs'>Order: {note.display_order}</span>
                              <span>{format(new Date(note.created_at), 'dd MMM, yyyy')}</span>
                          </CardFooter>
                      </Card>
                    ))
                 ) : (
                    <div className="h-48 text-center flex flex-col justify-center items-center">
                      <h3 className="font-semibold">No notes found</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {searchTerm || selectedSubject !== 'all' ? 'Try adjusting your search or filter.' : 'Click "Add New Note" to get started.'}
                      </p>
                    </div>
                 )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="w-[40px] px-4">
                        <Checkbox
                            checked={numFiltered > 0 && numSelected === numFiltered}
                            indeterminate={numSelected > 0 && numSelected < numFiltered}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            aria-label="Select all"
                            disabled={isPending}
                        />
                      </TableHead>
                      <TableHead className="min-w-[250px]">Topic</TableHead>
                      <TableHead className="min-w-[150px]">Subject</TableHead>
                      <TableHead><div className='flex items-center'>Order</div></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.length > 0 ? (
                      filteredNotes.map((note) => (
                        <TableRow 
                            key={note.id} 
                            className="transition-colors"
                            data-state={selectedNotes.includes(note.id) ? 'selected' : ''}
                        >
                          <TableCell className="px-4">
                            <Checkbox
                                checked={selectedNotes.includes(note.id)}
                                onCheckedChange={() => handleSelectNote(note.id)}
                                aria-label={`Select note ${note.topic_title}`}
                                disabled={isPending}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span className="font-semibold">{note.topic_title}</span>
                                {note.chapter_name && <span className="text-xs text-muted-foreground">{note.chapter_name}</span>}
                            </div>
                          </TableCell>
                          <TableCell>{note.subject_name}</TableCell>
                          <TableCell>{note.display_order}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`publish-switch-desktop-${note.id}`}
                                checked={note.is_published}
                                onCheckedChange={() => handleTogglePublish(note.id, note.is_published)}
                                disabled={isPending}
                                aria-label={`Publish status for ${note.topic_title}`}
                              />
                               <label htmlFor={`publish-switch-desktop-${note.id}`} className="text-xs font-medium text-muted-foreground">
                                    {note.is_published ? 'Published' : 'Draft'}
                               </label>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(note.created_at), 'dd MMM, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <NoteActionsDropdown noteId={note.id} noteTitle={note.topic_title} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                       <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                          <h3 className="font-semibold">No notes found</h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {searchTerm || selectedSubject !== 'all' ? 'Try adjusting your search or filter.' : 'Click "Add New Note" to get started.'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
