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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { deleteNoteAction, updateNoteAction, getNotesAction } from './actions';
import { useRouter } from 'next/navigation';

const ADMIN_PASSCODE = 'siam3310';
const SESSION_STORAGE_KEY = 'admin_authenticated';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
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

  const handleLogin = () => {
    if (passcode === ADMIN_PASSCODE) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      fetchNotes();
      toast({ title: 'Login successful!', description: 'Welcome to the admin panel.' });
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
        setNotes([]);
    } else {
        setNotes(result.notes);
    }
    setLoading(false);
  };

  const handleTogglePublish = (note: Note) => {
    startTransition(async () => {
      const updatedIsPublished = !note.is_published;
      const result = await updateNoteAction(note.id, { is_published: updatedIsPublished });

      if (result.success) {
        setNotes(notes.map((n) => (n.id === note.id ? { ...n, is_published: updatedIsPublished } : n)));
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
        setNotes(notes.filter((note) => note.id !== noteId));
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
  
  if (loading && !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-lg border">
          <div className="text-center">
            <h1 className="text-2xl font-bold font-headline">Admin Login</h1>
            <p className="text-muted-foreground">Please enter the passcode to continue.</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center"
            />
            <Button onClick={handleLogin} className="w-full">
              Enter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
            <p className="text-muted-foreground">
                A list of all the notes in the database.
            </p>
        </div>
        <div className="flex items-center gap-4">
             <Link href="/admin/new">
                <Button>
                    <PlusCircle className="mr-2" />
                    Add Note
                </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="hidden lg:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Loading notes...
                    </TableCell>
                </TableRow>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.topic_title}</TableCell>
                  <TableCell>{note.subject}</TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <Switch
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
                    {format(new Date(note.created_at), 'PPP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                        <Link href={`/admin/edit/${note.id}`}>
                            <Button variant="ghost" size="icon" aria-label="Edit" disabled={isPending}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete" disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the note titled &quot;{note.topic_title}&quot;.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(note.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
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
                <TableCell colSpan={5} className="h-24 text-center">
                  No notes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
