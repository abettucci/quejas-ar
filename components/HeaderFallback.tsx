import Link from "next/link";

export default function HeaderFallback() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          quejas.ar
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/denuncias" className="hidden text-sm text-zinc-700 hover:text-zinc-950 sm:block">
            Denuncias
          </Link>
          <div className="h-8 w-20 rounded-md bg-zinc-100 animate-pulse" />
        </nav>
      </div>
    </header>
  );
}
