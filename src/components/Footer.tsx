
import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card/50 py-4 mt-8 border-t">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} <span className="font-bold text-foreground">HSC Notes</span>. Some rights reserved.</p>
        </div>
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
