
'use client';

import { getDashboardStats } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, LayoutList, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Stats {
  noteCount: number;
  subjectCount: number;
  chapterCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const result = await getDashboardStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        // Handle error case, maybe show a toast
        console.error("Failed to fetch stats:", result.error);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const DashboardCard = ({ href, title, value, icon, description, isLoading }: { href: string, title: string, value?: number, icon: React.ReactNode, description: string, isLoading: boolean }) => (
    <Link href={href}>
      <Card className="hover:border-primary/80 hover:bg-secondary/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-1/4" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your website&apos;s content.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard 
            href="/admin/notes"
            title="Total Notes"
            value={stats?.noteCount}
            icon={<BookCopy className="h-4 w-4 text-muted-foreground" />}
            description="Total number of notes created."
            isLoading={loading}
        />
        <DashboardCard 
            href="/admin/subjects"
            title="Total Subjects"
            value={stats?.subjectCount}
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            description="Number of subjects available."
            isLoading={loading}
        />
        <DashboardCard 
            href="/admin/subjects"
            title="Total Chapters"
            value={stats?.chapterCount}
            icon={<LayoutList className="h-4 w-4 text-muted-foreground" />}
            description="Total chapters across all subjects."
            isLoading={loading}
        />
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                You can manage all your notes and subjects from the sidebar menu.
                Use the &quot;Notes&quot; section to create, edit, or delete notes.
                Use the &quot;Subjects&quot; section to view all available subjects and chapters.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
