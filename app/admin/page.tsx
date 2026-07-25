import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ModerationActions from "@/components/ModerationActions";
import type { PostWithRelations } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", user.id)
    .single();
  if (!profile?.is_moderator) notFound();

  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, user_id, company_id, type, title, body, evidence_urls, sentiment, status, upvotes, downvotes, created_at, profile:profiles(alias, trust_score), company:companies(name, slug, industry, is_legitimate)",
    )
    .eq("status", "pending_moderation")
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: flagsData } = await supabase
    .from("post_flags")
    .select("post_id, reason, system_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const posts = (postsData ?? []) as unknown as PostWithRelations[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Cola de moderación</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Posts pendientes ({posts.length}). Aprobá los legítimos, rechazá spam o sin evidencia.
      </p>

      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay posts pendientes.</p>
        ) : (
          posts.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={p.type === "scam_report" ? "scam" : p.type === "complaint" ? "complaint" : "experience"}>
                    {p.type}
                  </Badge>
                  {p.company && <span className="text-sm text-zinc-700">{p.company.name}</span>}
                  <span className="ml-auto text-xs text-zinc-500">
                    por {p.profile?.alias} · trust {p.profile?.trust_score} ·{" "}
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{p.body}</p>
                {p.evidence_urls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.evidence_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-600 underline"
                      >
                        Ver evidencia
                      </a>
                    ))}
                  </div>
                )}
                <ModerationActions postId={p.id} userId={p.user_id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {flagsData && flagsData.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">Posts flagged por heurísticas</h2>
          <ul className="space-y-2 text-sm">
            {flagsData.map((f, i) => (
              <li key={i} className="rounded-md border border-zinc-200 bg-white p-3">
                <p>
                  Post <code className="text-xs">{f.post_id}</code>
                </p>
                <p className="text-xs text-zinc-600">
                  {f.reason} {f.system_reason && `(${f.system_reason})`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
