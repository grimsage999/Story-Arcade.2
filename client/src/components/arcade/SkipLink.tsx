export function SkipLink() {
  return (
    <a 
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:border-2 focus:border-cyan-400 focus:outline-none font-mono text-sm"
      data-testid="link-skip-to-content"
    >
      Skip to main content
    </a>
  );
}
