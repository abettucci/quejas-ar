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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Tu reclamo, tu experiencia, tu denuncia.
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Centralizamos reclamos contra empresas argentinas con mal servicio, trucos para
          conseguir mejor atención, y denuncias de páginas truchas. Sumá tu aporte y ayudá a que
          se conozca.
        </p>
      </section>

      {/* Filtros de tipo / industria */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <FilterLink href={buildHref(params, { type: undefined, industry: undefined })} label="Todo" active={!params.type && !params.industry} />
        <FilterLink href={buildHref(params, { type: "complaint", industry: undefined })} label="Reclamos" active={params.type === "complaint"} />
        <FilterLink href={buildHref(params, { type: "experience", industry: undefined })} label="Experiencias / Trucos" active={params.type === "experience"} />
        <FilterLink href={buildHref(params, { type: "scam_report", industry: undefined })} label="Denuncias de truchos" active={params.type === "scam_report"} />
        <span className="mx-2 text-zinc-300">|</span>
        {INDUSTRIES.map((i) => (
          <FilterLink
            key={i.value}
            href={buildHref(params, { industry: i.value, type: undefined })}
            label={i.label}
            active={params.industry === i.value}
          />
        ))}
      </div>

      {/* Ordenamiento */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className="text-xs text-zinc-400">Ordenar:</span>
        <FilterLink href={buildHref(params, { sort: undefined })} label="Recientes" active={sort === "recent"} />
        <FilterLink href={buildHref(params, { sort: "util" })} label="Más útiles" active={sort === "util"} />
        <FilterLink href={buildHref(params, { sort: "empresa" })} label="Empresa A–Z" active={sort === "empresa"} />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
          <p>Todavía no hay posteos.</p>
          <Link href="/nuevo" className="mt-2 inline-block font-medium text-zinc-900 underline">
            Sé el primero en cargar uno
          </Link>
        </div>
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

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 ${
        active ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}
