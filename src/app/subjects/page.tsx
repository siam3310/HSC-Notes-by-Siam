import { getSubjects } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default async function SubjectsPage() {
  const subjects = await getSubjects();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 tracking-tight">Subjects</h1>
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Link href={`/subject/${encodeURIComponent(subject)}`} key={subject}>
              <Card className="hover:border-primary/80 transition-all duration-300 ease-in-out group bg-card">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-xl font-semibold">
                    <span>{subject}</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold text-foreground">No Subjects Found</h2>
          <p className="text-muted-foreground mt-2">Subjects are being prepared. Please check back later.</p>
        </div>
      )}
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
