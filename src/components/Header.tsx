
'use client';

import Link from 'next/link';
import { Menu, BookText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-card sticky top-0 z-50 border-b-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-foreground bg-secondary px-3 py-1 rounded-lg"
          >
            <BookText className="h-6 w-6 text-primary"/>
            <h1>HSC Notes</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/subjects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Subjects
            </Link>
          </nav>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        </div>
      </div>

       {/* Mobile Collapsible Menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          isMenuOpen ? 'max-h-48 border-t' : 'max-h-0'
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors text-lg p-3 rounded-md hover:bg-secondary"
          >
            Home
          </Link>
          <Link
            href="/subjects"
            className="text-muted-foreground hover:text-foreground transition-colors text-lg p-3 rounded-md hover:bg-secondary"
          >
            Subjects
          </Link>
        </nav>
      </div>
    </header>
  );
}
