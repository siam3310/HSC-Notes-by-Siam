
'use client';

import { subjectChapters, subjects } from '@/lib/subjects';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SubjectsPage() {
  return (
    <div className="w-full space-y-6">
       <header>
        <h1 className="text-3xl font-bold">Subjects & Chapters</h1>
        <p className="text-muted-foreground">
          A list of all subjects and their corresponding chapters in the system.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {subjects.map((subject) => (
              <AccordionItem value={subject} key={subject}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <span>{subject}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-1 pt-2 ml-4 border-l pl-6">
                    {(subjectChapters[subject as keyof typeof subjectChapters] || []).map(
                      (chapter) => (
                        <li key={chapter} className="flex items-center gap-3 p-2">
                           <FileText className="h-4 w-4 text-muted-foreground" />
                           <span className="text-foreground/90">{chapter}</span>
                        </li>
                      )
                    )}
                     {(subjectChapters[subject as keyof typeof subjectChapters] || []).length === 0 && (
                        <li className="text-muted-foreground p-2">No chapters defined for this subject.</li>
                     )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
