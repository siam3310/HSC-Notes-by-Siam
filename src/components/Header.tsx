import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <BookOpen className="h-6 w-6" />
            <h1 className="font-headline">HSC Hand Notes by Siam</h1>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/subjects" className="text-foreground/80 hover:text-foreground transition-colors">
              Subjects
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
