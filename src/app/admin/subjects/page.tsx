
'use client';

import dynamic from 'next/dynamic';
import { Loader } from '@/components/Loader';

const SubjectsPageClient = dynamic(() => import('@/components/admin/SubjectsPageClient'), {
    loading: () => <div className="flex h-48 items-center justify-center"><Loader /></div>,
    ssr: false
});


export default function SubjectsPage() {
  return <SubjectsPageClient />;
}
