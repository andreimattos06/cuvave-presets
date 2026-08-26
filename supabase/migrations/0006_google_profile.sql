-- Perfil criado a partir de uma conta Google.
--
-- O Supabase copia o payload do provider para raw_user_meta_data; nas contas
-- Google o avatar chega ora como `avatar_url`, ora como `picture` (o claim
-- original do OpenID), e o nome pode vir só em `name`. Sem cobrir as duas
-- grafias, quem entra pelo Google fica com avatar vazio.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := regexp_replace(
    lower(coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data->>'name'), ''),
      nullif(btrim(new.raw_user_meta_data->>'user_name'), ''),
      split_part(new.email, '@', 1)
    )),
    '[^a-z0-9]+', '-', 'g'
  );
  base_username := btrim(base_username, '-');
  -- Deixa espaço para o sufixo de desempate dentro do teto de 24.
  base_username := left(base_username, 20);

  if char_length(base_username) < 3 then
    base_username := 'musico';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '-' || suffix;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    final_username,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data->>'avatar_url'), ''),
        nullif(btrim(new.raw_user_meta_data->>'picture'), '')
      ),
      500
    )
  )
  -- Ligar uma identidade Google a um usuário que já existe não deve estourar.
  on conflict (id) do nothing;

  return new;
end;
$$;
