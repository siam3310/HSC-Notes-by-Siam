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

export interface NoteImage {
  id: number;
  note_id: number;
  image_url: string;
  created_at: string;
}

export interface NotePdf {
  id: number;
  note_id: number;
  pdf_url: string;
  created_at: string;
}

export interface Note {
  id: number;
  subject_id: number;
  chapter_id: number | null;
  topic_title: string;
  content?: string | null;
  is_published: boolean;
  created_at: string;
  display_order: number;
}

// Used for displaying notes with their relations
export interface NoteWithRelations extends Omit<Note, 'content' | 'subject_id' | 'chapter_id'>{
  subject_name: string;
  chapter_name: string | null;
  images?: NoteImage[];
  pdfs?: NotePdf[];
  // content is optional because we don't always query for it
  content?: string | null; 
}
