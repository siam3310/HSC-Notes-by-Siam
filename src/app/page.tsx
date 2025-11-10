import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 flex-grow">
      <div className="bg-secondary border border-border rounded-full px-4 py-1.5 text-sm text-foreground/80 font-medium">
        Your Central Notes Hub
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-4 text-foreground">
        Welcome to HSC Notes
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
        Discover a comprehensive collection of notes designed to help you excel in your HSC exams. All notes are collected & organized by <span className="font-mono text-foreground">Mahamudun Nabi Siam</span>.
      </p>
      <Link href="/subjects">
        <Button size="lg" className="group rounded-full pl-4 pr-6 h-12 bg-foreground text-background hover:bg-foreground/80 transition-all duration-300 ease-in-out">
            <svg className="h-6 w-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[250deg]" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" /></svg>
            Browse Subjects
        </Button>
      </Link>
    </div>
  );
}
