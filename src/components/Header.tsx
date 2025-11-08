import Link from 'next/link';
import { BookOpen, Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <BookOpen className="h-6 w-6" />
            <h1 className="font-headline">HSC Hand Notes by Siam</h1>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/subjects" className="text-muted-foreground hover:text-foreground transition-colors">
              Subjects
            </Link>
            <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
