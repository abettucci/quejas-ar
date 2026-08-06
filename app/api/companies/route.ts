import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, industry, website, instagram } = body;

  if (!name?.trim() || !industry) {
    return NextResponse.json({ error: "name e industry son requeridos" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const slug = slugify(name.trim());

  // Si ya existe con ese slug, devolvemos la existente
  const { data: existing } = await supabase
    .from("companies")
    .select("id, name, slug, industry")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ company: existing, existed: true });
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: name.trim(),
      slug,
      industry,
      is_legitimate: true,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
    })
    .select("id, name, slug, industry")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ company: data });
}
