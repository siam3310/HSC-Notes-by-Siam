import subjectsData from '@/lib/data/subjects.json';

export const subjects = subjectsData.map(s => s.name);

export const subjectChapters: Record<string, string[]> = subjectsData.reduce((acc, subject) => {
    acc[subject.name] = subject.chapters;
    return acc;
}, {} as Record<string, string[]>);
