import Link from "next/link";

export default function HeaderFallback() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          quejas<span className="text-accent">.ar</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/denuncias" className="hidden text-sm text-muted hover:text-foreground sm:block">
            Denuncias
          </Link>
          <div className="h-8 w-20 rounded-md bg-surface-hover animate-pulse" />
        </nav>
      </div>
    </header>
  );
}
