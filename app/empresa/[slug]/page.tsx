import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { Badge } from "@/components/ui/Badge";
import { INDUSTRIES } from "@/lib/constants";
import type { PostWithRelations } from "@/lib/types";

export const revalidate = 60;

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase.from("companies").select("*").eq("slug", slug).single();
  if (!company) notFound();

  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, user_id, company_id, type, title, body, evidence_urls, sentiment, status, upvotes, downvotes, created_at, profile:profiles(alias, trust_score), company:companies(name, slug, industry, is_legitimate)",
    )
    .eq("company_id", company.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (postsData ?? []) as unknown as PostWithRelations[];
  const counts = {
    complaints: posts.filter((p) => p.type === "complaint").length,
    experiences: posts.filter((p) => p.type === "experience").length,
    scams: posts.filter((p) => p.type === "scam_report").length,
  };
  const industryLabel = INDUSTRIES.find((i) => i.value === company.industry)?.label ?? company.industry;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="default">{industryLabel}</Badge>
            {!company.is_legitimate && (
              <Badge variant="scam" className="ml-2">
                Reportada como trucha
              </Badge>
            )}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{company.name}</h1>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-zinc-500 hover:underline"
              >
                {company.website}
              </a>
            )}
            {company.instagram && (
              <p className="text-sm text-zinc-500">@{company.instagram}</p>
            )}
          </div>
          <div className="text-right text-sm text-zinc-600">
            <p>{counts.complaints} reclamos</p>
            <p>{counts.experiences} experiencias</p>
            <p>{counts.scams} denuncias trucho</p>
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin posteos publicados todavía.</p>
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
