export interface Note {
  id: number;
  subject: string;
  chapter_name: string;
  topic_title: string;
  content?: string | null;
  pdf_url?: string | null;
  is_published: boolean;
  created_at: string;
}
