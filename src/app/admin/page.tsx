'use client';

import { getDashboardStats } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, LayoutList, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from '@/components/Loader';

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

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your website&apos;s content.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{stats?.noteCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total number of notes created.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{stats?.subjectCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Number of subjects available.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <LayoutList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{stats?.chapterCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total chapters across all subjects.
            </p>
          </CardContent>
        </Card>
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
