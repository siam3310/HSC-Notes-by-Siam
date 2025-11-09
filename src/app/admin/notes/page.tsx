
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import type { NoteWithRelations } from '@/lib/types';
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
import { PlusCircle, Edit, Trash2, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getNotesAction, deleteNoteAction, deleteMultipleNotesAction } from './actions';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';

export default function AdminNotesPage() {
  const [allNotes, setAllNotes] = useState<NoteWithRelations[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const result = await getNotesAction();
    if(result.error) {
        toast({
            variant: 'destructive',
            title: 'Failed to fetch notes',
            description: result.error,
        });
        setAllNotes([]);
    } else {
        setAllNotes(result.notes);
    }
    setLoading(false);
  };
  
  const filteredNotes = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return allNotes;
    return allNotes.filter((note) =>
      note.topic_title.toLowerCase().includes(lowercasedFilter) ||
      note.subject_name.toLowerCase().includes(lowercasedFilter) ||
      note.chapter_name.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, allNotes]);

  const handleDelete = (noteId: number) => {
    startTransition(async () => {
      const result = await deleteNoteAction(noteId);
      if (result.success) {
        setAllNotes(allNotes.filter((note) => note.id !== noteId));
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
    if (checked) {
      setSelectedNotes(filteredNotes.map(note => note.id));
    } else {
      setSelectedNotes([]);
    }
  };

  const handleDeleteMultiple = () => {
    startTransition(async () => {
        const result = await deleteMultipleNotesAction(selectedNotes);
        if (result.success) {
            setAllNotes(allNotes.filter(note => !selectedNotes.includes(note.id)));
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

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Notes Management</h1>
            <p className="text-muted-foreground">
                Create, edit, and manage all your study notes.
            </p>
        </div>
        <Link href="/admin/new">
          <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Note
          </Button>
        </Link>
      </header>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search notes by topic, subject, or chapter..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                {numSelected > 0 && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full sm:w-auto" disabled={isPending}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete ({numSelected})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the {numSelected} selected note(s).
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteMultiple}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={isPending}
                            >
                              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="w-[40px] px-4">
                    <Checkbox
                        checked={numSelected === numFiltered && numFiltered > 0}
                        indeterminate={numSelected > 0 && numSelected < numFiltered}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                        disabled={isPending}
                    />
                  </TableHead>
                  <TableHead className="w-[40%]">Topic</TableHead>
                  <TableHead>Subject</TableHead>
                   <TableHead>Published</TableHead>
                  <TableHead className="hidden lg:table-cell">Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </TableCell>
                    </TableRow>
                ) : filteredNotes.length > 0 ? (
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
                            <span className="text-xs text-muted-foreground">{note.chapter_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{note.subject_name}</TableCell>
                      <TableCell>
                         <Badge variant={note.is_published ? 'default' : 'outline'} className="capitalize text-xs transition-colors">
                              {note.is_published ? 'Published' : 'Draft'}
                         </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(note.created_at), 'dd MMM, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                            <Link href={`/admin/edit/${note.id}`}>
                                <Button variant="ghost" size="icon" aria-label="Edit" disabled={isPending}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </Link>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete" disabled={isPending}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the note titled &quot;{note.topic_title}&quot;.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(note.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                        disabled={isPending}
                                    >
                                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <h3 className="font-semibold">No notes found</h3>
                      <p className="text-muted-foreground mt-1">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Click "Add New Note" to get started.'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
