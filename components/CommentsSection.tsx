"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  profile: { alias: string } | null;
};

export default function CommentsSection({ postId, isLogged }: { postId: string; isLogged: boolean }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("comments")
      .select("id, body, created_at, profile:profiles(alias)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []) as unknown as CommentRow[]);
        setLoading(false);
      });
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: user.id, body })
      .select("id, body, created_at, profile:profiles(alias)")
      .single();
    if (!error && data) {
      setComments((c) => [...c, data as unknown as CommentRow]);
      setBody("");
    }
    setSubmitting(false);
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Comentarios ({comments.length})</h2>
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay comentarios.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border border-zinc-200 bg-white p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                <span>{c.profile?.alias ?? "anónimo"}</span>
                <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-800">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        {isLogged ? (
          <form onSubmit={submit} className="space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Sumá tu comentario"
              rows={3}
            />
            <Button type="submit" disabled={submitting || !body.trim()} size="sm">
              {submitting ? "Enviando…" : "Comentar"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-zinc-500">
            <Link href={`/login?redirect=/post/${postId}`} className="font-medium text-zinc-900 underline">
              Ingresá
            </Link>{" "}
            para comentar.
          </p>
        )}
      </div>
    </section>
  );
}
