export interface Subject {
  id: number;
  name: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  subject_id: number;
  name: string;
  created_at: string;
}

export interface Note {
  id: number;
  subject_id: number;
  chapter_id: number;
  topic_title: string;
  content?: string | null;
  pdf_url?: string | null;
  is_published: boolean;
  created_at: string;
}

// Used for displaying notes with their relations
export interface NoteWithRelations extends Note {
  subject_name: string;
  chapter_name: string;
}
