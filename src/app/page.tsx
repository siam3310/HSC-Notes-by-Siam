import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="text-center flex flex-col items-center justify-center pt-16 pb-24 space-y-6">
      <div className="bg-secondary border border-border rounded-full px-4 py-1.5 text-sm text-foreground/80 font-medium">
        Your One-Stop Study Hub
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight mb-4 text-foreground">
        Welcome to HSC Hand Notes
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
        Discover a comprehensive collection of handwritten notes by Siam, designed to help you excel in your HSC exams. All notes are organized by subject and chapter for your convenience.
      </p>
      <Link href="/subjects">
        <Button size="lg" className="transition-transform duration-300 ease-in-out hover:scale-105">
          Browse Subjects
          <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
}
