"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function VoteButtons({
  postId,
  upvotes,
  downvotes,
  currentVote,
  isLogged,
}: {
  postId: string;
  upvotes: number;
  downvotes: number;
  currentVote: 1 | -1 | 0;
  isLogged: boolean;
}) {
  const router = useRouter();
  const [up, setUp] = useState(upvotes);
  const [down, setDown] = useState(downvotes);
  const [vote, setVote] = useState(currentVote);
  const [pending, setPending] = useState(false);

  async function cast(value: 1 | -1) {
    if (!isLogged) {
      router.push(`/login?redirect=/post/${postId}`);
      return;
    }
    if (pending) return;

    setPending(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      return;
    }

    if (vote === value) {
      await supabase.from("votes").delete().eq("user_id", user.id).eq("post_id", postId);
      if (value === 1) setUp((n) => n - 1);
      else setDown((n) => n - 1);
      setVote(0);
    } else {
      await supabase.from("votes").upsert({ user_id: user.id, post_id: postId, value });
      if (vote === 1) setUp((n) => n - 1);
      if (vote === -1) setDown((n) => n - 1);
      if (value === 1) setUp((n) => n + 1);
      else setDown((n) => n + 1);
      setVote(value);
    }
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => cast(1)}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
          vote === 1
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
        )}
      >
        <ThumbsUp size={14} />
        <span>{up}</span>
      </button>
      <button
        onClick={() => cast(-1)}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
          vote === -1
            ? "border-red-300 bg-red-50 text-red-800 shadow-sm"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700",
        )}
      >
        <ThumbsDown size={14} />
        <span>{down}</span>
      </button>
    </div>
  );
}
