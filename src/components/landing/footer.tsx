export function LandingFooter() {
  return (
    <footer className="w-full max-w-5xl mx-auto flex items-center justify-between py-3 text-[11px] font-light text-muted-foreground tracking-wider z-20 select-none">
      <span>© {new Date().getFullYear()} Discows</span>
      <a
        href="https://www.instagram.com/discows.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        @discows.app
      </a>
    </footer>
  )
}
