
'use client';

import dynamic from 'next/dynamic';
import { Loader } from '@/components/Loader';

const AdminNotesPageClient = dynamic(() => import('@/components/admin/AdminNotesPageClient'), {
  loading: () => <div className="flex h-48 items-center justify-center"><Loader /></div>,
  ssr: false
});

export default function AdminNotesPage() {
  return <AdminNotesPageClient />;
}
