import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, ThumbsUp, ChevronRight } from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import type { PostWithRelations } from "@/lib/types";

const TYPE_META = {
  complaint:   { label: "Reclamo",         variant: "complaint"  as const, bar: "bg-red-400"     },
  experience:  { label: "Experiencia",     variant: "experience" as const, bar: "bg-emerald-400" },
  scam_report: { label: "Denuncia trucho", variant: "scam"       as const, bar: "bg-orange-400"  },
};

export default function PostCard({ post }: { post: PostWithRelations }) {
  const meta = TYPE_META[post.type as keyof typeof TYPE_META] ?? TYPE_META.complaint;
  const score = post.upvotes - post.downvotes;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-black/[0.06] bg-white",
        "shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_-2px_rgba(0,0,0,0.04)]",
        "transition-all duration-200",
        "hover:shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_12px_24px_-6px_rgba(0,0,0,0.08)]",
        "hover:-translate-y-0.5",
      )}
    >
      {/* Full-card clickable overlay — behind all interactive children */}
      <Link href={`/post/${post.id}`} className="absolute inset-0 z-0" aria-label={post.title} />

      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", meta.bar)} />

      <div className="relative z-10 pl-5 pr-4 pt-4 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {post.company && (
              <Link
                href={`/empresa/${post.company.slug}`}
                className="relative z-20 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-full px-2.5 py-0.5 transition-colors max-w-[180px]"
              >
                <Building2 size={10} className="shrink-0" />
                <span className="truncate">{post.company.name}</span>
              </Link>
            )}
          </div>
          <time className="flex items-center gap-1 text-xs text-zinc-400 shrink-0 pt-0.5">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300" />
          </time>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[15px] leading-snug text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Body preview */}
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 leading-relaxed">
          {post.body}
        </p>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-zinc-50 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            por{" "}
            <span className="font-medium text-zinc-600">
              {post.profile?.alias ?? "anónimo"}
            </span>
          </span>
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1",
              score > 0
                ? "bg-emerald-50 text-emerald-700"
                : score < 0
                  ? "bg-red-50 text-red-700"
                  : "bg-zinc-100 text-zinc-500",
            )}
          >
            <ThumbsUp size={10} />
            {score > 0 ? "+" : ""}{score} útil
          </div>
        </div>
      </div>
    </article>
  );
}
