export interface Note {
  id: number;
  subject: string;
  chapter_name: string;
  topic_title: string;
  content_html?: string | null;
  pdf_url?: string | null;
  is_published: boolean;
  created_at: string;
}
