"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function castVote(postId: string, value: 1 | -1 | "remove") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_logged_in" as const };

  if (value === "remove") {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("votes")
      .upsert({ user_id: user.id, post_id: postId, value });
    if (error) return { error: error.message };
  }

  // Recalculate and persist aggregates in posts table via service role
  const svc = createServiceClient();
  const [{ count: newUp }, { count: newDown }] = await Promise.all([
    svc.from("votes").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("value", 1),
    svc.from("votes").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("value", -1),
  ]);
  await svc.from("posts").update({ upvotes: newUp ?? 0, downvotes: newDown ?? 0 }).eq("id", postId);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { ok: true };
}
