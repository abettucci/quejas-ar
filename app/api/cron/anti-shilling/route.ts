import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Heurísticas anti-shilling. Corre 1x/día via Vercel Cron.
 * Inserta filas en post_flags para que el moderador revise.
 *
 * Reglas (V1):
 * 1. Usuarios creados <7 días cuyos posteos son ≥80% sobre una misma empresa.
 * 2. Cuentas <7 días que solo postean elogios (sentiment='positive').
 *
 * (Detección por IP/dispositivo se difiere — Supabase no expone IP del cliente
 *  en row metadata sin una columna adicional.)
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Cuentas nuevas con sus posteos publicados
  const { data: profiles } = await service
    .from("profiles")
    .select("id, created_at")
    .gte("created_at", sevenDaysAgo);

  type ShortPost = {
    id: string;
    type: string;
    sentiment: string | null;
    company_id: string | null;
    status: string;
  };

  let flaggedCount = 0;
  for (const profile of (profiles ?? []) as { id: string; created_at: string }[]) {
    const { data: userPosts } = await service
      .from("posts")
      .select("id, type, sentiment, company_id, status")
      .eq("user_id", profile.id);

    const posts = (userPosts ?? []) as ShortPost[];
    if (posts.length < 3) continue;

    // Regla 1: ≥80% sobre la misma empresa
    const byCompany: Record<string, number> = {};
    for (const p of posts) {
      if (!p.company_id) continue;
      byCompany[p.company_id] = (byCompany[p.company_id] ?? 0) + 1;
    }
    const dominant = Object.entries(byCompany).find(
      ([, count]) => count / posts.length >= 0.8,
    );
    if (dominant) {
      for (const p of posts.filter((x) => x.company_id === dominant[0])) {
        await service.from("post_flags").upsert({
          post_id: p.id,
          reason: "concentración sospechosa sobre una sola empresa",
          system_reason: `${dominant[1]}/${posts.length} posts cuenta <7d`,
        });
        flaggedCount++;
      }
    }

    // Regla 2: nueva cuenta que solo postea elogios
    const positives = posts.filter((p) => p.sentiment === "positive").length;
    if (positives > 0 && positives === posts.length) {
      for (const p of posts) {
        await service.from("post_flags").upsert({
          post_id: p.id,
          reason: "cuenta nueva que solo postea elogios",
          system_reason: `${positives}/${posts.length} positivos`,
        });
        flaggedCount++;
      }
    }
  }

  return NextResponse.json({ ok: true, flagged: flaggedCount });
}
