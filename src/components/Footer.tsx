import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card/50 py-4 mt-12 border-t">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-center sm:text-left text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} HSC Notes. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 ease-in-out">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
        </div>
      </div>
    </footer>
  );
}
