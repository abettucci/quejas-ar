import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { PostWithRelations } from "@/lib/types";

const TYPE_LABEL: Record<string, { label: string; variant: "complaint" | "experience" | "scam" }> = {
  complaint: { label: "Reclamo", variant: "complaint" },
  experience: { label: "Experiencia", variant: "experience" },
  scam_report: { label: "Denuncia trucho", variant: "scam" },
};

export default function PostCard({ post }: { post: PostWithRelations }) {
  const typeMeta = TYPE_LABEL[post.type] ?? TYPE_LABEL.complaint;
  const score = post.upvotes - post.downvotes;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
            {post.company && (
              <Link
                href={`/empresa/${post.company.slug}`}
                className="text-sm font-medium text-zinc-700 hover:underline"
              >
                {post.company.name}
              </Link>
            )}
          </div>
          <span className="text-xs text-zinc-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
          </span>
        </div>
        <Link href={`/post/${post.id}`} className="mt-1 block">
          <h3 className="text-lg font-semibold text-zinc-900 hover:underline">{post.title}</h3>
        </Link>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-zinc-700">{post.body}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>por {post.profile?.alias ?? "anónimo"}</span>
          <span>
            {score >= 0 ? "+" : ""}
            {score} útil
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
