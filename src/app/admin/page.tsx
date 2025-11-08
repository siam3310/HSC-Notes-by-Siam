import { getNotes } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default async function AdminPage() {
  const notes = await getNotes();

  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
        <p className="text-muted-foreground">
          A list of all the notes in the database.
        </p>
      </header>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead className="hidden md:table-cell">Subject</TableHead>
              <TableHead className="hidden lg:table-cell">Chapter</TableHead>
              <TableHead className="hidden md:table-cell">Published</TableHead>
              <TableHead className="hidden lg:table-cell">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length > 0 ? (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.topic_title}</TableCell>
                  <TableCell className="hidden md:table-cell">{note.subject}</TableCell>
                  <TableCell className="hidden lg:table-cell">{note.chapter_name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={note.is_published ? 'default' : 'secondary'}>
                      {note.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(note.created_at), 'PPP')}
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

export const revalidate = 0;
