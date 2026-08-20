import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { INDUSTRIES } from "@/lib/constants";
import type { PostWithRelations } from "@/lib/types";

export const revalidate = 60;

type Params = { industry?: string; type?: string; sort?: string };

function buildHref(current: Params, patch: Partial<Params>): string {
  const merged = { ...current, ...patch };
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return qs ? `/?${qs}` : "/";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const sort = params.sort ?? "recent";

  let query = supabase
    .from("posts")
    .select(
      "id, user_id, company_id, type, title, body, evidence_urls, sentiment, status, upvotes, downvotes, created_at, profile:profiles!posts_user_id_fkey(alias, trust_score), company:companies(name, slug, industry, is_legitimate)",
    )
    .eq("status", "published")
    .limit(50);

  if (sort === "util") {
    query = query.order("upvotes", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (params.type) query = query.eq("type", params.type);

  const { data: postsData } = await query;
  let posts = (postsData ?? []) as unknown as PostWithRelations[];

  if (params.industry) {
    posts = posts.filter((p) => p.company?.industry === params.industry);
  }

  if (sort === "empresa") {
    posts = [...posts].sort((a, b) =>
      (a.company?.name ?? "").localeCompare(b.company?.name ?? "", "es"),
    );
  }

  const totalPosts = posts.length;

  return (
    <div>
      {/* Hero */}
      <section className="bg-grain relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_0%,color-mix(in_oklab,var(--accent)_12%,transparent)_0%,transparent_65%)]" />
        <div className="relative z-[1] mx-auto max-w-5xl px-4 pt-14 pb-10 sm:pt-20 sm:pb-14">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Plataforma independiente · Argentina
          </div>
          <h1 className="font-display max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Tu reclamo,{" "}
            <span className="italic font-medium text-accent">tu voz</span>{" "}
            frente a las empresas.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Centralizamos reclamos contra empresas argentinas, trucos para
            conseguir mejor atención, y denuncias de páginas truchas.
          </p>
          <Link
            href="/nuevo"
            className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0px_4px_14px_-4px_color-mix(in_oklab,var(--accent)_60%,transparent)] transition-all hover:bg-accent-hover hover:shadow-[0px_6px_18px_-4px_color-mix(in_oklab,var(--accent)_70%,transparent)] active:scale-[0.98]"
          >
            Publicar un reclamo →
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* Filter bar — sticky below header */}
        <div className="sticky top-16 z-40 -mx-4 border-b border-border bg-background/90 backdrop-blur-sm px-4 py-3">
          <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <FilterLink href={buildHref(params, { type: undefined, industry: undefined })} label="Todo" active={!params.type && !params.industry} />
              <FilterLink href={buildHref(params, { type: "complaint", industry: undefined })} label="Reclamos" active={params.type === "complaint"} />
              <FilterLink href={buildHref(params, { type: "experience", industry: undefined })} label="Experiencias" active={params.type === "experience"} />
              <FilterLink href={buildHref(params, { type: "scam_report", industry: undefined })} label="Denuncias trucho" active={params.type === "scam_report"} />
              <span className="mx-1 text-border">|</span>
              {INDUSTRIES.map((i) => (
                <FilterLink
                  key={i.value}
                  href={buildHref(params, { industry: i.value, type: undefined })}
                  label={i.label}
                  active={params.industry === i.value}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="py-5">
          {/* Sort + count row */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="font-mono text-xs text-muted">
              {totalPosts} posteo{totalPosts !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted">Ordenar:</span>
              <SortLink href={buildHref(params, { sort: undefined })} label="Recientes" active={sort === "recent"} />
              <SortLink href={buildHref(params, { sort: "util" })} label="Más útiles" active={sort === "util"} />
              <SortLink href={buildHref(params, { sort: "empresa" })} label="Empresa A–Z" active={sort === "empresa"} />
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
              <p className="text-muted">No hay posteos en esta categoría.</p>
              <Link
                href="/nuevo"
                className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Sé el primero en cargar uno
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-muted hover:border-accent/30 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function SortLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-surface-hover text-foreground"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
