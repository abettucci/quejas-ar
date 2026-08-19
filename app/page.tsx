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
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="relative -mx-4 mb-0 overflow-hidden bg-zinc-900 px-6 py-10 sm:px-8">
        {/* Subtle red radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_120%,rgba(239,68,68,0.18)_0%,transparent_70%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              Plataforma independiente · Argentina
            </div>
            <h1 className="max-w-lg text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tu reclamo,{" "}
              <span className="text-red-400">tu denuncia.</span>
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              Reclamos, trucos y denuncias de empresas argentinas.
              Sumá tu experiencia y ayudá a otros consumidores.
            </p>
          </div>
          <Link
            href="/nuevo"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            + Publicar ahora
          </Link>
        </div>
      </section>

      {/* Filter bar — sticky below header */}
      <div className="sticky top-14 z-40 -mx-4 border-b border-black/[0.06] bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <FilterLink href={buildHref(params, { type: undefined, industry: undefined })} label="Todo" active={!params.type && !params.industry} />
            <FilterLink href={buildHref(params, { type: "complaint", industry: undefined })} label="Reclamos" active={params.type === "complaint"} accent="red" />
            <FilterLink href={buildHref(params, { type: "experience", industry: undefined })} label="Experiencias" active={params.type === "experience"} accent="green" />
            <FilterLink href={buildHref(params, { type: "scam_report", industry: undefined })} label="Denuncias trucho" active={params.type === "scam_report"} accent="orange" />
            <span className="mx-1 text-zinc-200">|</span>
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
          <p className="text-xs text-zinc-400">
            {totalPosts} posteo{totalPosts !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">Ordenar:</span>
            <SortLink href={buildHref(params, { sort: undefined })} label="Recientes" active={sort === "recent"} />
            <SortLink href={buildHref(params, { sort: "util" })} label="Más útiles" active={sort === "util"} />
            <SortLink href={buildHref(params, { sort: "empresa" })} label="Empresa A–Z" active={sort === "empresa"} />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <p className="text-zinc-500">No hay posteos en esta categoría.</p>
            <Link
              href="/nuevo"
              className="mt-3 inline-block rounded-full border border-zinc-900 bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Sé el primero en cargar uno
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
  accent,
}: {
  href: string;
  label: string;
  active: boolean;
  accent?: "red" | "green" | "orange";
}) {
  const accentActive = {
    red: "border-red-600 bg-red-600 text-white",
    green: "border-emerald-600 bg-emerald-600 text-white",
    orange: "border-orange-500 bg-orange-500 text-white",
  };

  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? (accent ? accentActive[accent] : "border-zinc-900 bg-zinc-900 text-white")
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
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
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-500 hover:text-zinc-700"
      }`}
    >
      {label}
    </Link>
  );
}
