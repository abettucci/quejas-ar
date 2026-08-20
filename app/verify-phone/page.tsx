import VerifyPhoneForm from "./VerifyPhoneForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function VerifyPhonePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/verify-phone");

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_verified")
    .eq("id", user.id)
    .single();

  if (profile?.phone_verified) redirect("/nuevo");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Verificá tu teléfono</h1>
      <p className="mt-2 text-sm text-muted">
        Para postear reclamos o denuncias necesitamos validar tu número (1 cuenta = 1 número). Esto
        nos ayuda a evitar bots y posteos coordinados de empleados de empresas.
      </p>
      <div className="mt-8">
        <VerifyPhoneForm />
      </div>
    </div>
  );
}
