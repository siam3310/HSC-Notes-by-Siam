export function Footer() {
  return (
    <footer className="bg-card/50 py-4 mt-8 border-t">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HSC Hand Notes. All content created by Siam. For study purposes only.</p>
      </div>
    </footer>
  );
}
