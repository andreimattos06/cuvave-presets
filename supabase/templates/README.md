# Templates de e-mail do Auth

Onde colar: Supabase Dashboard > Authentication > Emails > Templates.

| Template          | Arquivo               | Assunto                                  |
| ----------------- | --------------------- | ---------------------------------------- |
| Confirm signup    | `confirm-signup.html` | `Confirme seu e-mail — M-Vave Presets`   |
| Reset password    | `recovery.html`       | `Redefinir sua senha — M-Vave Presets`   |

Os dois apontam para `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…`,
tratado por `src/app/auth/confirm/route.ts` via `verifyOtp`. Não troque por
`{{ .ConfirmationURL }}`: aquele fluxo é PKCE e exige que o link seja aberto no
mesmo navegador que iniciou o cadastro — abrir no celular resulta em erro.

`{{ .SiteURL }}` é o **Site URL** configurado em Authentication > URL Configuration.
Em produção ele precisa apontar para o domínio público (o mesmo valor de
`NEXT_PUBLIC_SITE_URL` no app); com `http://localhost:3000` os links só abrem na
máquina de desenvolvimento.

## Pré-requisito: SMTP próprio

O dashboard só libera a edição de assunto/corpo depois que um SMTP customizado
está configurado (Authentication > Emails > SMTP Settings) — sem ele os campos
ficam `readOnly` e o Supabase envia os templates padrão em inglês.

O serviço de e-mail embutido também não serve para produção: tem limite baixo
por hora e entrega apenas para endereços de membros da organização, então
cadastros de outras pessoas nunca receberiam o link de confirmação.
