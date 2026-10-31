-- Cabas — schéma Supabase. À exécuter une fois dans l'éditeur SQL du projet.
-- Un foyer regroupe des membres (un par compte) ; articles et menus appartiennent au foyer.

create extension if not exists pgcrypto;

create table if not exists public.foyers (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Chez nous',
  code text not null unique,
  code_expire_le timestamptz not null default now() + interval '7 days',
  rayons text[] not null default array['Fruits et légumes','Crèmerie','Boucherie et poisson','Épicerie','Boissons','Surgelés','Hygiène et maison'],
  created_at timestamptz not null default now()
);

create table if not exists public.membres (
  user_id uuid primary key references auth.users(id) on delete cascade,
  foyer_id uuid references public.foyers(id) on delete set null,
  prenom text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references public.foyers(id) on delete cascade,
  nom text not null,
  quantite text not null default '',
  rayon text not null default 'Épicerie',
  coche boolean not null default false,
  ajoute_par uuid references auth.users(id) on delete set null,
  source text not null default '',          -- '' (à la main) ou le plat du menu qui l'a demandé
  note text not null default '',            -- précision libre : « bien mûrs », « la marque bleue »
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.articles add column if not exists note text not null default '';
create index if not exists articles_foyer on public.articles(foyer_id, coche, created_at);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references public.foyers(id) on delete cascade,
  semaine date not null,                    -- lundi de la semaine
  demande jsonb not null,                   -- le formulaire envoyé à Claude
  repas jsonb not null,                     -- la réponse de Claude
  ajoute boolean not null default false,    -- les articles ont été ajoutés à la liste
  created_at timestamptz not null default now()
);
create index if not exists menus_foyer on public.menus(foyer_id, semaine desc);

-- Un membre est créé à l'inscription, avec le prénom passé dans les métadonnées.
create or replace function public.nouveau_membre() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.membres (user_id, prenom) values (new.id, coalesce(new.raw_user_meta_data->>'prenom', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.nouveau_membre();

-- Le foyer de la personne connectée (null si elle n'en a pas).
create or replace function public.mon_foyer() returns uuid language sql stable security definer set search_path = public as $$
  select foyer_id from public.membres where user_id = auth.uid()
$$;

-- Code d'invitation : 6 caractères sans O, 0, I, 1, écrit XXX-XXX.
create or replace function public.nouveau_code() returns text language plpgsql as $$
declare alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text := ''; i int;
begin
  for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
  return substr(c, 1, 3) || '-' || substr(c, 4, 3);
end $$;

create or replace function public.creer_foyer() returns public.foyers language plpgsql security definer set search_path = public as $$
declare f public.foyers;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  insert into public.foyers (code) values (public.nouveau_code()) returning * into f;
  update public.membres set foyer_id = f.id where user_id = auth.uid();
  return f;
end $$;

create or replace function public.rejoindre_foyer(p_code text) returns public.foyers language plpgsql security definer set search_path = public as $$
declare f public.foyers;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into f from public.foyers where upper(replace(code, '-', '')) = upper(replace(p_code, '-', '')) and code_expire_le > now();
  if f.id is null then raise exception 'code inconnu ou expiré'; end if;
  update public.membres set foyer_id = f.id where user_id = auth.uid();
  return f;
end $$;

create or replace function public.quitter_foyer() returns void language sql security definer set search_path = public as $$
  update public.membres set foyer_id = null where user_id = auth.uid()
$$;

create or replace function public.renouveler_code() returns public.foyers language plpgsql security definer set search_path = public as $$
declare f public.foyers;
begin
  update public.foyers set code = public.nouveau_code(), code_expire_le = now() + interval '7 days' where id = public.mon_foyer() returning * into f;
  return f;
end $$;

-- Règles d'accès : on ne voit que son foyer.
alter table public.foyers enable row level security;
alter table public.membres enable row level security;
alter table public.articles enable row level security;
alter table public.menus enable row level security;

drop policy if exists foyers_lire on public.foyers;
create policy foyers_lire on public.foyers for select using (id = public.mon_foyer());
drop policy if exists foyers_modifier on public.foyers;
create policy foyers_modifier on public.foyers for update using (id = public.mon_foyer());

drop policy if exists membres_lire on public.membres;
create policy membres_lire on public.membres for select using (user_id = auth.uid() or (foyer_id is not null and foyer_id = public.mon_foyer()));
drop policy if exists membres_modifier on public.membres;
create policy membres_modifier on public.membres for update using (user_id = auth.uid());

drop policy if exists articles_tout on public.articles;
create policy articles_tout on public.articles for all using (foyer_id = public.mon_foyer()) with check (foyer_id = public.mon_foyer());

drop policy if exists menus_tout on public.menus;
create policy menus_tout on public.menus for all using (foyer_id = public.mon_foyer()) with check (foyer_id = public.mon_foyer());

-- Temps réel : l'autre téléphone voit les changements sans recharger.
do $$ begin
  alter publication supabase_realtime add table public.articles;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.menus;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.membres;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.foyers;
exception when duplicate_object then null; end $$;
