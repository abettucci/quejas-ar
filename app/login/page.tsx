import LoginForm from "./LoginForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(params.redirect ?? "/");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Ingresar a quejas.ar</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Usamos Google para validar tu identidad. Si vas a postear reclamos o denuncias, después te
        pediremos verificar tu teléfono.
      </p>
      <div className="mt-8">
        <LoginForm redirectTo={params.redirect} />
      </div>
    </div>
  );
}
