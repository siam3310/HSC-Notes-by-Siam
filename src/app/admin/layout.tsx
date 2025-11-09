
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookCopy,
  BookOpen,
  LogOut,
  BookText,
  Loader2,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const ADMIN_PASSCODE = 'siam3310';
const SESSION_STORAGE_KEY = 'admin_authenticated';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session storage is only available on the client.
    try {
      const sessionAuth = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Could not access session storage:", e);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    if (passcode === ADMIN_PASSCODE) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
        toast({ title: 'Login successful!', description: 'Welcome to the admin dashboard.' });
      } catch (e) {
         console.error("Could not access session storage:", e);
         toast({
           variant: 'destructive',
           title: 'Login Failed',
           description: 'Could not save session. Please enable cookies/session storage.',
         });
      }
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
    try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setIsAuthenticated(false);
        router.push('/');
    } catch(e) {
        console.error("Could not access session storage:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Please enter the passcode to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center text-lg"
            />
            <Button onClick={handleLogin} className="w-full">
              Enter Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="justify-between">
          <div className="flex items-center gap-2 p-2">
             <BookText className="h-6 w-6 text-primary"/>
             <span className="font-semibold text-lg">Admin Panel</span>
          </div>
           <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/admin" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/admin'}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/notes" passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith('/admin/notes') || pathname.startsWith('/admin/edit') || pathname.startsWith('/admin/new')}
                  tooltip="Notes"
                >
                  <BookCopy />
                  <span>Notes</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/subjects" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/admin/subjects'}
                  tooltip="Subjects"
                >
                  <BookOpen />
                  <span>Subjects</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-card/50 px-4 md:hidden">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <BookText className="h-6 w-6 text-primary"/>
                <span className="">HSC Hand Notes</span>
            </Link>
            <SidebarTrigger />
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
