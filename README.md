# quejas.ar

Plataforma argentina para centralizar reclamos contra empresas con mal servicio, compartir trucos de atención al cliente y denunciar páginas truchas (Instagrams/sitios que estafan).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (DB + Auth + Storage) · Vercel.

---

## Setup local

### 1. Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá:

```bash
cp .env.local.example .env.local
```

### 2. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com/dashboard).
2. En **Settings → API**, copiá `URL`, `anon key` y `service_role key` a `.env.local`.
3. En **Authentication → Providers**:
   - Habilitá **Google** (necesitás OAuth credentials de Google Cloud Console — usar `https://<tu-proyecto>.supabase.co/auth/v1/callback` como redirect URI).
   - Habilitá **Phone** (Twilio o un provider equivalente; ver docs de Supabase).
4. En **SQL Editor**, corré en orden:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_storage.sql`
   - `supabase/seed.sql` (empresas seed)
5. Para volverte moderador inicial, después de loguearte una vez, en SQL Editor:
   ```sql
   update public.profiles set is_moderator = true where alias = 'tu_alias';
   ```

### 3. Cron (anti-shilling)

Generá un secret aleatorio y guardalo en `CRON_SECRET`:

```bash
openssl rand -hex 32
```

El cron está configurado en `vercel.json` para correr 03:00 UTC diario. En Vercel, agregá `CRON_SECRET` en las env vars del proyecto.

### 4. Correr

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

---

## Estructura

```
app/
  page.tsx                        # home (feed + filtros)
  login/                          # Google OAuth
  verify-phone/                   # SMS OTP
  nuevo/                          # crear posteo
  post/[id]/                      # detalle
  empresa/[slug]/                 # ficha
  denuncias/                      # feed scam_reports
  perfil/                         # mi cuenta + mis posts
  admin/                          # cola moderación (is_moderator)
  api/
    admin/moderate/               # aprobar/rechazar
    cron/anti-shilling/           # heurísticas (Vercel Cron)
    auth/callback/                # OAuth callback
components/
  ui/                             # Button, Input, Card, Badge, Select, Textarea
  Header, Footer, PostForm, PostCard, VoteButtons,
  EvidenceUploader, CommentsSection, ModerationActions
lib/
  supabase/                       # browser, server, middleware
  constants.ts                    # industrias, tipos, puntos
  types.ts                        # tipos TS de la DB
  utils.ts                        # cn helper
supabase/
  migrations/                     # SQL versionado
  seed.sql                        # empresas iniciales
middleware.ts                     # refresca sesión y protege rutas
vercel.json                       # cron jobs
```

---

## Flujo de moderación

1. Usuario nuevo postea → status `pending_moderation`.
2. Moderador (con `is_moderator=true` en `profiles`) va a `/admin`.
3. Aprueba → status `published` + se otorgan puntos (`points_events`) + bump de `trust_score`.
4. Rechaza → status `rejected` (sin puntos).

Cron diario corre heurísticas anti-shilling y deja flags en `post_flags` (visibles en `/admin`).

---

## Reglas anti-shilling

- **Google OAuth obligatorio** (anti-abuse de Google).
- **SMS OTP** para postear reclamos o denuncias (1 cuenta = 1 número).
- **Simetría de evidencia:** elogios a empresas específicas requieren la misma evidencia que reclamos negativos → rompe el incentivo de empleados a inflar reseñas positivas.
- **Rate limit DB:** máx 3 posteos / 24h por usuario (trigger Postgres).
- **Cron heurístico:** flagea cuentas <7 días que concentran ≥80% de aportes sobre una sola empresa, o que solo postean elogios.

---

## Roadmap rewards (todavía silencioso en V1)

Los eventos se persisten en `points_events` desde día 1, sin UI.

| Fase | Mecanismo | Costo |
|---|---|---|
| V2 | Niveles + badges + leaderboard | $0 |
| V3 | Boost de visibilidad gastando puntos | $0 |
| V4 | Sorteo mensual de giftcard MP | ~$10k ARS/mes |
| V5 | Sponsorships de empresas top-ranked | monetiza |
| V6 | Alianzas ADELCO / Defensa del Consumidor | $0 |

---

## Riesgos legales

Los posteos son opiniones de los autores. La plataforma:

1. Exige evidencia para reclamos y denuncias.
2. Modera antes de publicar.
3. Permite a las empresas responder con cuenta verificada (todavía no implementado — Fase 2).
4. Tiene términos claros que deslindan responsabilidad (pendiente: redactar con abogado especializado).

---

## Deploy

```bash
npm run build
```

Vercel: conectá el repo, agregá las env vars del `.env.local.example`, deploy.

Acordate de configurar el **OAuth redirect** de Google y de Supabase a tu dominio de producción.
