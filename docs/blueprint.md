# **App Name**: HSC Hand Notes

## Core Features:

- Subject Index: Display a distinct list of available subjects fetched from the Supabase database.
- Single Subject View: Fetch and display all notes for a selected subject, grouped by chapter name.
- Note Viewer: Fetch and display a single note's content, either as an embedded PDF or rendered HTML, using DOMPurify for sanitization.
- PDF Embedding & Download: Display an embedded PDF viewer if a PDF URL exists for the note; otherwise, provide a 'Download PDF' button.
- Content Sanitization: Uses DOMPurify to sanitize and render HTML content to mitigate Cross-Site Scripting (XSS) risks.

## Style Guidelines:

- Primary color: Soft blue (#A0C4FF) to evoke a sense of calm and focus.
- Background color: Light blue (#EBF4FF), a desaturated variant of the primary, for a clean and unobtrusive backdrop.
- Accent color: Muted purple (#BDB2FF) to provide a contrasting but harmonious visual highlight.
- Body and headline font: 'PT Sans', a sans-serif font providing a modern look and readability.
- Use simple, clear icons from a library like FontAwesome or Feather to represent subjects and actions.
- Implement a clean, grid-based layout using Tailwind CSS to ensure responsiveness and ease of navigation.
- Use subtle transitions and animations to enhance user experience, such as fading in content or smoothly expanding accordion sections.