# Cuvave Music Presets

Plataforma para músicos catalogarem e compartilharem presets de pedaleiras Cuvave, com uma réplica gráfica interativa da pedaleira e votação comunitária para ordenar contribuições.

Cada música pode receber vários envios. Um envio tem nome próprio e até **10 instrumentos** ("guitarra principal", "guitarra ritmo"…); cada instrumento usa **uma pedaleira** e guarda até **8 presets** ("solo", "ponte"…) daquele aparelho.

Stack: Next.js 16 (App Router) + TypeScript, Supabase (Auth/Postgres/Storage), Tailwind CSS v4 + shadcn/ui, Framer Motion, Zustand, react-hook-form + zod.

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie `Project URL` e `anon public key` para `.env.local` (baseado em `.env.local.example`).
3. Rode as migrations em **SQL Editor**, na ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_create_upload.sql`
   - `supabase/migrations/0003_upload_shape.sql`
   - `supabase/seed/0001_pedal_models.sql`
4. Em **Authentication > Providers**, habilite **Email** (com confirmação de e-mail, se desejar) e **Google** (crie um OAuth Client ID no Google Cloud Console e cole Client ID/Secret).
5. Em **Authentication > URL Configuration**, defina `Site URL` para `http://localhost:3000` em dev (e a URL de produção depois), e adicione `http://localhost:3000/auth/callback` em Redirect URLs.

## Desenvolvimento

```bash
npm install
cp .env.local.example .env.local # preencha com as credenciais do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

- `src/app` — rotas (App Router)
- `src/components/pedalboard` — motor data-driven da réplica virtual da pedaleira
- `src/components/site` — navegação, hero, cards de banda/música/upload
- `src/lib/supabase` — clientes Supabase (browser/server)
- `src/actions` — Server Actions (mutations)
- `src/stores` — estado client-side (Zustand), usado no wizard de envio
- `src/types` — tipos do banco (`database.ts`) e da pedaleira (`pedal.ts`)
- `src/proxy.ts` — Proxy do Next.js 16 (equivalente ao antigo Middleware) para sessão Supabase
- `supabase/migrations` e `supabase/seed` — SQL do schema, RLS e catálogo inicial de pedaleiras
