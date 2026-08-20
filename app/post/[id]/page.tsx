import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import VoteButtons from "@/components/VoteButtons";
import CommentsSection from "@/components/CommentsSection";
import type { PostWithRelations } from "@/lib/types";

const TYPE_LABEL: Record<string, { label: string; variant: "complaint" | "experience" | "scam" }> = {
  complaint: { label: "Reclamo", variant: "complaint" },
  experience: { label: "Experiencia", variant: "experience" },
  scam_report: { label: "Denuncia trucho", variant: "scam" },
};

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      "id, user_id, company_id, type, title, body, evidence_urls, sentiment, status, upvotes, downvotes, created_at, profile:profiles!posts_user_id_fkey(alias, trust_score), company:companies(name, slug, industry, is_legitimate)",
    )
    .eq("id", id)
    .single();

  if (postError || !post) {
    console.error("[post/page] fetch error:", JSON.stringify(postError), "id:", id);
    notFound();
  }
  const typed = post as unknown as PostWithRelations;

  let currentVote: 1 | -1 | 0 = 0;
  if (user) {
    const { data: voteRow } = await supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("post_id", id)
      .maybeSingle();
    if (voteRow) currentVote = voteRow.value as 1 | -1;
  }

  const typeMeta = TYPE_LABEL[typed.type] ?? TYPE_LABEL.complaint;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:border-accent/30 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Volver a posteos
      </Link>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
            {typed.company && (
              <Link
                href={`/empresa/${typed.company.slug}`}
                className="text-sm font-medium text-foreground/80 hover:text-accent hover:underline"
              >
                {typed.company.name}
              </Link>
            )}
            {typed.status !== "published" && (
              <Badge variant="pending">{typed.status.replace("_", " ")}</Badge>
            )}
            <span className="ml-auto text-xs text-muted">
              {formatDistanceToNow(new Date(typed.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-foreground">{typed.title}</h1>
          <p className="text-xs text-muted">por {typed.profile?.alias ?? "anónimo"}</p>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-foreground/90">{typed.body}</div>

          {typed.evidence_urls.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-foreground/80">Evidencia</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {typed.evidence_urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block aspect-square overflow-hidden rounded-md border border-border"
                  >
                    <Image src={url} alt="evidencia" fill className="object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <VoteButtons
              postId={typed.id}
              upvotes={typed.upvotes}
              downvotes={typed.downvotes}
              currentVote={currentVote}
              isLogged={!!user}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <CommentsSection postId={typed.id} isLogged={!!user} />
      </div>
    </div>
  );
}
