import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/perfil");

  const [{ data: profile }, { data: posts }, { data: pointsRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("posts")
      .select("id, title, type, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("points_events").select("delta").eq("user_id", user.id),
  ]);

  const totalPoints = (pointsRows ?? []).reduce((sum, r) => sum + (r.delta ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold tracking-tight">{profile?.alias}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Trust score: {profile?.trust_score}</span>
            <span>·</span>
            <span>Puntos: {totalPoints}</span>
            <span>·</span>
            <span>{profile?.phone_verified ? "Teléfono verificado" : "Teléfono no verificado"}</span>
            {profile?.is_moderator && <Badge variant="default">Moderador</Badge>}
          </div>
          {!profile?.phone_verified && (
            <Link
              href="/verify-phone"
              className="mt-2 text-sm font-medium text-foreground underline"
            >
              Verificar teléfono →
            </Link>
          )}
        </CardHeader>
      </Card>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Tus posteos</h2>
      {!posts || posts.length === 0 ? (
        <p className="text-sm text-muted">Todavía no posteaste nada.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/post/${p.id}`}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-3 text-sm hover:bg-background"
              >
                <span className="flex-1 truncate font-medium">{p.title}</span>
                <Badge
                  variant={
                    p.status === "published"
                      ? "published"
                      : p.status === "pending_moderation"
                      ? "pending"
                      : "rejected"
                  }
                >
                  {p.status === "published"
                    ? "publicado"
                    : p.status === "pending_moderation"
                    ? "en moderación"
                    : "rechazado"}
                </Badge>
                <span className="ml-3 hidden text-xs text-muted sm:inline">
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
