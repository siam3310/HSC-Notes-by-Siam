'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Note } from '@/lib/types';
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
} from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Loader2, Search, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { deleteNoteAction, updateNoteAction, getNotesAction } from './actions';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ADMIN_PASSCODE = 'siam3310';
const SESSION_STORAGE_KEY = 'admin_authenticated';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(true);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      fetchNotes();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allNotes.filter((note) =>
      note.topic_title.toLowerCase().includes(lowercasedFilter) ||
      note.subject.toLowerCase().includes(lowercasedFilter) ||
      note.chapter_name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredNotes(filteredData);
  }, [searchTerm, allNotes]);

  const handleLogin = () => {
    if (passcode === ADMIN_PASSCODE) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      fetchNotes();
      toast({ title: 'Login successful!', description: 'Welcome to the admin dashboard.' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect passcode. Please try again.',
      });
    }
    setPasscode('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
    setAllNotes([]);
    setFilteredNotes([]);
  };

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
        setFilteredNotes(result.notes);
    }
    setLoading(false);
  };

  const handleTogglePublish = (note: Note) => {
    startTransition(async () => {
      const updatedIsPublished = !note.is_published;
      const result = await updateNoteAction(note.id, { is_published: updatedIsPublished });

      if (result.success) {
        const updatedNotes = allNotes.map((n) => (n.id === note.id ? { ...n, is_published: updatedIsPublished } : n));
        setAllNotes(updatedNotes);
        toast({
          title: 'Status Updated',
          description: `${note.topic_title} is now ${updatedIsPublished ? 'published' : 'a draft'}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error || 'Could not update the note status.',
        });
      }
    });
  };

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
  
  if (loading && typeof window !== 'undefined' && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
            <CardDescription>Please enter the passcode to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center text-lg"
            />
            <Button onClick={handleLogin} className="w-full">
              Enter Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">
                Manage all your study notes from here.
            </p>
        </div>
        <div className="flex items-center gap-2">
             <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2" />
                Logout
            </Button>
             <Link href="/admin/new">
                <Button>
                    <PlusCircle className="mr-2" />
                    Add New Note
                </Button>
            </Link>
        </div>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>All Notes</CardTitle>
            <CardDescription>A list of all notes in the database. You can search, edit, and manage them here.</CardDescription>
             <div className="relative pt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by topic, subject, or chapter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Topic</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Loading notes...</p>
                        </TableCell>
                    </TableRow>
                ) : filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <TableRow key={note.id} className="[&_td]:py-3">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <span className="font-bold">{note.topic_title}</span>
                            <span className="text-xs text-muted-foreground">{note.chapter_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{note.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Switch
                                id={`publish-switch-${note.id}`}
                                checked={note.is_published}
                                onCheckedChange={() => handleTogglePublish(note)}
                                disabled={isPending}
                                aria-label={`Toggle publish status for ${note.topic_title}`}
                            />
                            <Badge variant={note.is_published ? 'default' : 'secondary'}>
                            {note.is_published ? 'Published' : 'Draft'}
                            </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(note.created_at), 'dd MMM yyyy')}
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
                    <TableCell colSpan={5} className="h-48 text-center">
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
