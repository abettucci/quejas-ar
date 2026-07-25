import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { POINTS } from "@/lib/constants";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", user.id)
    .single();
  if (!profile?.is_moderator) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { post_id, user_id, action } = await request.json();
  if (!post_id || !user_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const service = createServiceClient();
  const newStatus = action === "approve" ? "published" : "rejected";

  const { error: updateErr } = await service
    .from("posts")
    .update({ status: newStatus })
    .eq("id", post_id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (action === "approve") {
    // Bump author trust_score + award points
    const { data: post } = await service.from("posts").select("type").eq("id", post_id).single();
    const pointsMap: Record<string, number> = {
      complaint: POINTS.COMPLAINT_PUBLISHED,
      experience: POINTS.EXPERIENCE_PUBLISHED,
      scam_report: POINTS.SCAM_REPORT_PUBLISHED,
    };
    const delta = pointsMap[post?.type ?? "complaint"] ?? POINTS.EXPERIENCE_PUBLISHED;

    await service.from("points_events").insert({
      user_id,
      delta,
      reason: `${post?.type}_published`,
      post_id,
    });

    const { data: prof } = await service
      .from("profiles")
      .select("trust_score")
      .eq("id", user_id)
      .single();
    if (prof) {
      await service
        .from("profiles")
        .update({ trust_score: (prof.trust_score ?? 0) + 1 })
        .eq("id", user_id);
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
