import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, ChevronUp } from "lucide-react";
import { Badge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import type { PostWithRelations } from "@/lib/types";

const TYPE_META = {
  complaint:   { label: "Reclamo",         variant: "complaint"  as const },
  experience:  { label: "Experiencia",     variant: "experience" as const },
  scam_report: { label: "Denuncia trucho", variant: "scam"       as const },
};

export default function PostCard({ post }: { post: PostWithRelations }) {
  const meta = TYPE_META[post.type as keyof typeof TYPE_META] ?? TYPE_META.complaint;
  const score = post.upvotes - post.downvotes;
  const initial = (post.profile?.alias ?? "A")[0]?.toUpperCase();

  return (
    <article
      className={cn(
        "group relative flex gap-0 overflow-hidden rounded-xl border border-border bg-surface",
        "shadow-[0px_1px_2px_rgba(31,26,21,0.04),0px_1px_1px_rgba(31,26,21,0.03)]",
        "dark:shadow-none",
        "transition-all duration-200",
        "hover:border-accent/25 hover:shadow-[0px_8px_24px_-8px_rgba(31,26,21,0.14)]",
        "dark:hover:shadow-[0px_8px_24px_-8px_rgba(0,0,0,0.5)]",
      )}
    >
      <Link href={`/post/${post.id}`} className="absolute inset-0 z-10" aria-label={post.title} />

      {/* Vote rail */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border bg-surface-hover/40 py-3">
        <ChevronUp
          size={16}
          className={cn(
            score > 0 ? "text-accent" : "text-muted/50",
          )}
        />
        <span className={cn(
          "font-mono text-sm font-medium tabular-nums",
          score > 0 ? "text-accent" : score < 0 ? "text-muted" : "text-muted/70",
        )}>
          {score}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {post.company && (
            <Link
              href={`/empresa/${post.company.slug}`}
              className="relative z-20 inline-flex items-center gap-1 text-xs font-medium text-muted bg-surface-hover hover:bg-border rounded-full px-2.5 py-0.5 transition-colors max-w-[160px]"
            >
              <Building2 size={10} className="shrink-0" />
              <span className="truncate">{post.company.name}</span>
            </Link>
          )}
        </div>

        <h3 className="font-display font-semibold text-[16px] leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
          {post.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-[13.5px] text-muted leading-relaxed">
          {post.body}
        </p>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
            {initial}
          </span>
          <span className="font-medium text-foreground/70">{post.profile?.alias ?? "anónimo"}</span>
          <span className="text-muted/50">·</span>
          <time className="font-mono text-[11px]">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
          </time>
        </div>
      </div>
    </article>
  );
}
