import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import type { PostWithRelations } from "@/lib/types";

export const revalidate = 60;

export default async function DenunciasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, user_id, company_id, type, title, body, evidence_urls, sentiment, status, upvotes, downvotes, created_at, profile:profiles!posts_user_id_fkey(alias, trust_score), company:companies(name, slug, industry, is_legitimate)",
    )
    .eq("type", "scam_report")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (data ?? []) as unknown as PostWithRelations[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Denuncias de páginas truchas</h1>
        <p className="mt-1 text-sm text-muted">
          Cuentas, sitios o perfiles que venden productos truchos o no entregan. Si caíste, dejá
          tu testimonio con evidencia para advertir a otros y empujar el bajado de la página.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">Sin denuncias publicadas todavía.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
