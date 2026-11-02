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
-- Habituels du foyer (02/11/2026) : { "<nom normalisé>": { nom, rayon, n, le } }, mis à jour par le client à chaque ajout manuel.
alter table public.foyers add column if not exists habituels jsonb not null default '{}'::jsonb;
-- Achats récents (02/11/2026) : { "<nom normalisé>": { nom, rayon, le } }, notés quand le panier est vidé ; « déjà dans les placards » du formulaire Repas.
alter table public.foyers add column if not exists achats jsonb not null default '{}'::jsonb;

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

-- Droits des rôles de l'API (certains projets ne les donnent pas par défaut). Les règles RLS ci-dessus font le tri ensuite.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.foyers, public.membres, public.articles, public.menus to authenticated;
grant execute on function public.mon_foyer(), public.nouveau_code(), public.creer_foyer(), public.rejoindre_foyer(text), public.quitter_foyer(), public.renouveler_code() to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

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

-- ——— Créateur du foyer et retrait d'un membre (02/11/2026)
-- Le créateur peut retirer un autre membre ; le code est renouvelé pour qu'il ne puisse pas revenir avec l'ancien.
alter table public.foyers add column if not exists cree_par uuid references auth.users(id) on delete set null;
-- Foyers existants : le plus ancien compte du foyer passe pour le créateur.
update public.foyers f set cree_par = (select m.user_id from public.membres m where m.foyer_id = f.id order by m.created_at limit 1) where f.cree_par is null;

create or replace function public.creer_foyer() returns public.foyers language plpgsql security definer set search_path = public as $$
declare f public.foyers;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  insert into public.foyers (code, cree_par) values (public.nouveau_code(), auth.uid()) returning * into f;
  update public.membres set foyer_id = f.id where user_id = auth.uid();
  return f;
end $$;

-- Si le créateur s'en va, le membre restant le plus ancien prend la main.
create or replace function public.quitter_foyer() returns void language plpgsql security definer set search_path = public as $$
declare fid uuid := public.mon_foyer();
begin
  update public.membres set foyer_id = null where user_id = auth.uid();
  update public.foyers set cree_par = (select user_id from public.membres where foyer_id = fid order by created_at limit 1)
    where id = fid and cree_par = auth.uid();
end $$;

create or replace function public.retirer_membre(p_user uuid) returns public.foyers language plpgsql security definer set search_path = public as $$
declare f public.foyers;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into f from public.foyers where id = public.mon_foyer();
  if f.id is null or f.cree_par is distinct from auth.uid() then raise exception 'seul le créateur du foyer peut retirer un membre'; end if;
  if p_user = auth.uid() then raise exception 'pour partir, quitte le foyer'; end if;
  update public.membres set foyer_id = null where user_id = p_user and foyer_id = f.id;
  if not found then raise exception 'ce membre n''est pas dans le foyer'; end if;
  update public.foyers set code = public.nouveau_code(), code_expire_le = now() + interval '7 days' where id = f.id returning * into f;
  return f;
end $$;
grant execute on function public.retirer_membre(uuid) to authenticated;
