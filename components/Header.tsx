import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/Button";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const [{ data }] = await Promise.all([
      supabase.from("profiles").select("alias, is_moderator").eq("id", user.id).single(),
    ]);
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            quejas<span className="text-accent">.ar</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/denuncias" className="hidden text-sm text-muted hover:text-foreground transition-colors sm:block">
            Denuncias
          </Link>
          {user ? (
            <>
              <Link href="/nuevo">
                <Button size="sm">Nuevo posteo</Button>
              </Link>
              <Link href="/perfil" className="text-sm text-muted hover:text-foreground transition-colors">
                {profile?.alias ?? "perfil"}
              </Link>
              {profile?.is_moderator && (
                <Link href="/admin" className="text-sm text-muted hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline">
                Ingresar
              </Button>
            </Link>
          )}
          <span className="h-5 w-px bg-border mx-0.5" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
