import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/PostForm";

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/nuevo");

  const [{ data: profile }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("phone_verified, trust_score").eq("id", user.id).single(),
    supabase.from("companies").select("id, name, slug, industry").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo posteo</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Antes de publicar leé las reglas: los reclamos y denuncias requieren evidencia. Las
        experiencias positivas con empresas específicas también — para evitar que empleados
        inflen reseñas.
      </p>
      <div className="mt-8">
        <PostForm
          companies={companies ?? []}
          phoneVerified={true}
        />
      </div>
    </div>
  );
}
