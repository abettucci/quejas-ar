"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Select } from "./ui/Select";
import EvidenceUploader from "./EvidenceUploader";
import { POST_TYPES, INDUSTRIES, type PostType } from "@/lib/constants";

type CompanyOpt = { id: string; name: string; slug: string; industry: string };

export default function PostForm({
  companies,
  phoneVerified,
}: {
  companies: CompanyOpt[];
  phoneVerified: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState<PostType>("complaint");
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sentiment, setSentiment] = useState<"negative" | "positive" | "neutral">("negative");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresPhone = type === "complaint" || type === "scam_report";
  const requiresEvidence =
    type === "complaint" ||
    type === "scam_report" ||
    (type === "experience" && sentiment === "positive");

  if (requiresPhone && !phoneVerified) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium text-amber-900">Necesitás verificar tu teléfono</p>
        <p className="mt-1 text-amber-800">
          Para postear reclamos o denuncias pedimos verificación por SMS (1 cuenta = 1 número).
          Esto bloquea bots y posteos coordinados.
        </p>
        <Link
          href="/verify-phone"
          className="mt-3 inline-block font-medium text-amber-900 underline"
        >
          Verificar ahora →
        </Link>
        <p className="mt-3 text-xs text-amber-700">
          O cambiá el tipo a &quot;Experiencia / Truco&quot; sin nombrar empresa para postear sin
          verificación.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (requiresEvidence && evidenceUrls.length === 0) {
      setError("Necesitás adjuntar al menos una imagen como evidencia.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión expirada — volvé a entrar.");
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        company_id: companyId || null,
        type,
        title,
        body,
        sentiment: type === "experience" ? sentiment : type === "complaint" ? "negative" : "negative",
        evidence_urls: evidenceUrls,
      })
      .select("id")
      .single();

    if (error) {
      setError(
        error.message.includes("rate_limit_exceeded")
          ? "Llegaste al límite de 3 posteos por día. Probá mañana."
          : error.message,
      );
      setSubmitting(false);
      return;
    }

    router.push(`/post/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Tipo de posteo">
        <div className="grid gap-2 sm:grid-cols-3">
          {POST_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded-md border p-3 text-left text-sm transition-colors ${
                type === t.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className={`mt-1 text-xs ${type === t.value ? "text-zinc-200" : "text-zinc-500"}`}>
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Empresa / página" hint={type === "experience" ? "Opcional para experiencias genéricas" : "Obligatorio"}>
        <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required={type !== "experience"}>
          <option value="">— Elegir —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({INDUSTRIES.find((i) => i.value === c.industry)?.label})
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-zinc-500">
          ¿No encontrás la empresa? Por ahora pedinos sumarla por mail.
        </p>
      </Field>

      {type === "experience" && (
        <Field label="Tono de la experiencia">
          <Select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value as "negative" | "positive" | "neutral")}
          >
            <option value="negative">Negativa / quejosa</option>
            <option value="neutral">Neutra / informativa</option>
            <option value="positive">Positiva / elogio (requiere evidencia)</option>
          </Select>
        </Field>
      )}

      <Field label="Título">
        <Input
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resumí en una línea"
        />
      </Field>

      <Field label="Descripción / detalles">
        <Textarea
          required
          minLength={30}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Contá qué pasó, fechas, intentos de contacto, etc."
          rows={6}
        />
      </Field>

      {requiresEvidence && (
        <Field
          label="Evidencia"
          hint="Capturas, comprobantes, fotos. Mínimo 1, máximo 5."
        >
          <EvidenceUploader value={evidenceUrls} onChange={setEvidenceUrls} max={5} />
        </Field>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "Publicando…" : "Publicar"}
        </Button>
        <p className="text-xs text-zinc-500">
          Tu posteo puede quedar en moderación si sos cuenta nueva o si nombrás una empresa.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-900">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
