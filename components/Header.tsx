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
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          quejas.ar
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/denuncias" className="hidden text-sm text-zinc-700 hover:text-zinc-950 sm:block">
            Denuncias
          </Link>
          {user ? (
            <>
              <Link href="/nuevo">
                <Button size="sm">Nuevo posteo</Button>
              </Link>
              <Link href="/perfil" className="text-sm text-zinc-700 hover:text-zinc-950">
                {profile?.alias ?? "perfil"}
              </Link>
              {profile?.is_moderator && (
                <Link href="/admin" className="text-sm text-zinc-700 hover:text-zinc-950">
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
