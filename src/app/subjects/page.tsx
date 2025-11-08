import { getSubjects } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default async function SubjectsPage() {
  const subjects = await getSubjects();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 font-headline">Subjects</h1>
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link href={`/subject/${encodeURIComponent(subject)}`} key={subject}>
              <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 group bg-card">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>{subject}</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card rounded-lg">
          <h2 className="text-xl font-semibold text-foreground">No Subjects Found</h2>
          <p className="text-muted-foreground mt-2">Subjects are being prepared. Please check back later.</p>
        </div>
      )}
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
