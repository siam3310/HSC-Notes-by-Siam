
import { getLatestNotes } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, BookCopy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const latestNotes = await getLatestNotes(5);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12 flex-grow">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 flex-grow min-h-[60vh]">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight">
          WELCOME to HSC ICT NOTES
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground pt-4">
          Your ultimate destination for HSC ICT notes. Find everything you need to ace your exams, meticulously organized by <span>Mahamudun Nabi Siam</span>.
        </p>
        <Link href="/subjects">
          <Button size="lg" className="group pl-4 pr-6 h-12 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 ease-in-out">
              <svg className="h-6 w-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[250deg]" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" /></svg>
              Browse Subjects
          </Button>
        </Link>
      </div>
      
      {/* Latest Notes Section */}
      {latestNotes.length > 0 && (
        <div className="w-full max-w-5xl mx-auto text-left py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BookCopy className="h-7 w-7 text-primary" />
              Recently Added Notes
            </h2>
             <Link href="/subjects" passHref>
                <Button variant="ghost">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestNotes.map(note => (
              <Link href={`/note/${note.id}`} key={note.id}>
                <Card className="border-2 hover:border-primary/80 transition-all duration-300 ease-in-out group bg-card h-full flex flex-col">
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-xl font-semibold leading-snug">
                      {note.topic_title}
                    </CardTitle>
                    <CardDescription className="pt-2">{note.chapter_name || 'General'}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Badge variant="secondary">{note.subject_name}</Badge>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
