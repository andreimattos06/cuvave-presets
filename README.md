# M-Vave Music Presets

Plataforma para músicos catalogarem e compartilharem presets de pedaleiras M-Vave, com uma réplica gráfica interativa da pedaleira e votação comunitária para ordenar contribuições.

Cada música pode receber vários envios. Um envio tem nome próprio e até **10 instrumentos** ("guitarra principal", "guitarra ritmo"…); cada instrumento guarda até **8 presets** ("solo", "ponte"…), e cada preset pode ser descrito em até **4 pedaleiras** diferentes — quem for ver escolhe em qual aparelho quer olhar. O autor pode editar ou excluir os próprios envios pelo perfil.

Stack: Next.js 16 (App Router) + TypeScript, Supabase (Auth/Postgres/Storage), Tailwind CSS v4 + shadcn/ui, Framer Motion, Zustand, react-hook-form + zod.

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie `Project URL` e `anon public key` para `.env.local` (baseado em `.env.local.example`).
3. Rode as migrations em **SQL Editor**, na ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_create_upload.sql`
   - `supabase/migrations/0003_upload_shape.sql`
   - `supabase/migrations/0004_security_limits.sql`
   - `supabase/seed/0001_pedal_models.sql`
   - `supabase/migrations/0005_arc_labels.sql` (depois do seed — ajusta a serigrafia dos footswitches)
   - `supabase/migrations/0006_google_profile.sql`
4. Em **Authentication > Providers**, habilite **Email** (com confirmação de e-mail, se desejar) e **Google** (ver seção abaixo).
5. Em **Authentication > URL Configuration**, defina `Site URL` para `http://localhost:3000` em dev (e a URL de produção depois), e adicione `http://localhost:3000/auth/callback` em Redirect URLs.

## Login com Google

O app já tem tudo do lado do código: botão em `/login` e `/signup`
(`src/components/site/google-button.tsx`), retorno em `src/app/auth/callback/route.ts`
e criação automática do perfil pelo trigger `handle_new_user` — o username sai do
nome da conta Google (`joao-silva`, com sufixo numérico se já existir) e o avatar
vem de `avatar_url`/`picture`. Falta apenas ligar as credenciais:

1. **Google Cloud Console** > APIs & Services > **OAuth consent screen**: tipo *External*, preencha nome do app, e-mail de suporte e domínio. Enquanto o app estiver em *Testing*, só as contas listadas em *Test users* conseguem entrar — publique quando for abrir ao público.
2. **Credentials > Create credentials > OAuth client ID**, tipo **Web application**:
   - *Authorized JavaScript origins*: `http://localhost:3000` e a URL de produção.
   - *Authorized redirect URIs*: `https://<ref>.supabase.co/auth/v1/callback` (é o Supabase que recebe o retorno do Google, não o app).
3. **Supabase > Authentication > Providers > Google**: ligue o provider e cole *Client ID* e *Client Secret*.
4. **Supabase > Authentication > URL Configuration**: `Site URL` = domínio de produção, e em *Redirect URLs* `http://localhost:3000/auth/callback`, `https://<seu-dominio>/auth/callback` e, se usar previews, `https://*-<seu-escopo>.vercel.app/auth/callback`.
   O `Site URL` é o destino de fallback: quando o `redirect_to` do pedido não bate com nenhuma entrada da lista, o Supabase manda a pessoa para lá em silêncio — deixar `http://localhost:3000` é o motivo clássico de "loguei em produção e caí no localhost". Por isso o botão usa `NEXT_PUBLIC_SITE_URL` (`src/lib/public-url.ts`) em vez do endereço aberto no navegador: cada deploy da Vercel também responde numa URL com hash, que nunca estaria na lista.

Quem já tem conta de e-mail/senha com o mesmo endereço do Google cai na mesma
conta: o Supabase liga as identidades automaticamente quando os dois e-mails
estão verificados.

Enquanto o provider estiver desligado, o botão leva a uma página de erro do
próprio Supabase (`provider is not enabled`) — o clique sai do app direto para
`/auth/v1/authorize`, então não há como avisar antes. Se a pessoa cancelar na
tela do Google, aí sim ela volta para `/login` com o aviso traduzido e o
`?next=` preservado.

## Segurança

- **Limites de tamanho** de cada campo em `src/lib/validations/limits.ts`, aplicados três vezes: `maxLength` no formulário, zod na Server Action e `check` no banco (`0004_security_limits.sql`).
- **Rate limit** por IP, usuário ou e-mail em todas as Server Actions (`src/lib/rate-limit.ts`), contado no Postgres via `consume_rate_limit` — memória de processo não serviria com várias instâncias serverless.
  Defina `RATE_LIMIT_SALT` em produção: sem o sal, quem tem a anon key consegue calcular o balde de outra pessoa e estourá-lo de fora.
- **Presets sanitizados** no servidor (`sanitizePresetSettings`): só entram blocos e knobs que existem no painel daquele modelo, com valor preso entre min e max.
- **Headers** (CSP, HSTS, `frame-ancestors`, Permissions-Policy) em `next.config.ts`; corpo das Server Actions limitado a 256 KB.

## Deploy na Vercel

1. **Importe o repositório** em [vercel.com/new](https://vercel.com/new). O preset Next.js já cobre build (`next build`) e output — não é preciso `vercel.json`.
2. **Variáveis de ambiente** (Project Settings > Environment Variables), nos três ambientes (Production, Preview, Development):

   | Variável | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key do projeto |
   | `NEXT_PUBLIC_SITE_URL` | URL pública do site (ex.: `https://cuvave-presets.vercel.app`) — **só em Production**; deixe vazia nos previews para os links de e-mail caírem no host do próprio deploy |
   | `RATE_LIMIT_SALT` | string longa e aleatória, exclusiva do servidor |

   Sem `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` o build falha na coleta de dados das páginas.
3. **Supabase > Authentication > URL Configuration**: `Site URL` = a URL de produção; em **Redirect URLs** adicione `https://<seu-dominio>/auth/callback`, `https://<seu-dominio>/auth/confirm` e, para os previews, `https://*-<seu-escopo>.vercel.app/auth/callback`.
4. **Google OAuth**: siga a seção "Login com Google" — em produção, acrescente a URL do site às *Authorized JavaScript origins* do OAuth client.
5. **Migrations**: rode as do passo anterior no projeto de produção antes do primeiro acesso — sem a `0004`, `consume_rate_limit` não existe e o rate limit fica inerte (falha aberta, apenas registra aviso no log).

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
- `src/lib/mvave/tkg.ts` — leitura e escrita do arquivo `.tkg` (formato de preset do app oficial da Tank-G), com o mapa dos 21 bytes comentado
- `src/lib/pedals/availability.ts` — quais pedaleiras aparecem para escolha (hoje só a Tank-G)
- `src/lib/store` — estado client-side (Zustand) do wizard de envio
- `src/lib/supabase` — clientes Supabase (browser/server)
- `src/actions` — Server Actions (mutations)
- `src/types` — tipos do banco (`database.ts`) e da pedaleira (`pedal.ts`)
- `src/proxy.ts` — Proxy do Next.js 16 (equivalente ao antigo Middleware) para sessão Supabase
- `supabase/migrations` e `supabase/seed` — SQL do schema, RLS e catálogo inicial de pedaleiras
