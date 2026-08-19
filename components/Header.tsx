import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/Button";
import LogoutButton from "./LogoutButton";

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
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-zinc-900">quejas.ar</span>
          <span className="hidden sm:inline-block rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
            beta
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/denuncias" className="hidden text-sm text-zinc-500 hover:text-zinc-900 transition-colors sm:block">
            Denuncias
          </Link>
          {user ? (
            <>
              <Link href="/nuevo">
                <Button size="sm">+ Nuevo posteo</Button>
              </Link>
              <Link href="/perfil" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                {profile?.alias ?? "perfil"}
              </Link>
              {profile?.is_moderator && (
                <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
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
        </nav>
      </div>
    </header>
  );
}
