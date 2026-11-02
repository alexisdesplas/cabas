-- Cabas — 02/11/2026: rename the whole schema from French to English, keeping the data.
-- Run once in the SQL editor of a project created with the French schema. One transaction: all or nothing.
begin;

-- Policies and the trigger depend on the old functions: drop them first.
drop policy if exists foyers_lire on public.foyers;
drop policy if exists foyers_modifier on public.foyers;
drop policy if exists membres_lire on public.membres;
drop policy if exists membres_modifier on public.membres;
drop policy if exists articles_tout on public.articles;
drop policy if exists menus_tout on public.menus;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.retirer_membre(uuid), public.renouveler_code(), public.quitter_foyer(), public.rejoindre_foyer(text), public.creer_foyer(), public.nouveau_membre(), public.mon_foyer(), public.nouveau_code();

-- Tables
alter table public.foyers rename to households;
alter table public.membres rename to members;
alter table public.articles rename to items;
alter table public.menus rename to meal_plans;

-- Columns
alter table public.households rename column nom to name;
alter table public.households rename column code to invite_code;
alter table public.households rename column code_expire_le to code_expires_at;
alter table public.households rename column rayons to aisles;
alter table public.households rename column habituels to frequent_items;
alter table public.households rename column achats to recent_purchases;
alter table public.households rename column cree_par to created_by;
alter table public.members rename column foyer_id to household_id;
alter table public.members rename column prenom to first_name;
alter table public.items rename column foyer_id to household_id;
alter table public.items rename column nom to name;
alter table public.items rename column quantite to quantity;
alter table public.items rename column rayon to aisle;
alter table public.items rename column coche to is_checked;
alter table public.items rename column ajoute_par to added_by;
alter table public.meal_plans rename column foyer_id to household_id;
alter table public.meal_plans rename column semaine to week_start;
alter table public.meal_plans rename column demande to request;
alter table public.meal_plans rename column repas to meals;
alter table public.meal_plans rename column ajoute to added_to_list;

-- Indexes and constraints (primary keys, foreign keys, unique code)
alter index if exists public.articles_foyer rename to items_household_idx;
alter index if exists public.menus_foyer rename to meal_plans_household_idx;
do $$
declare r record; n text;
begin
  for r in select c.conname, c.conrelid::regclass as t from pg_constraint c
           where c.conrelid in ('public.households'::regclass, 'public.members'::regclass, 'public.items'::regclass, 'public.meal_plans'::regclass) loop
    n := r.conname;
    n := replace(n, 'foyer_id', 'household_id');
    n := replace(n, 'ajoute_par', 'added_by');
    n := replace(n, 'cree_par', 'created_by');
    n := regexp_replace(n, '_code_key$', '_invite_code_key');
    n := regexp_replace(n, '^foyers_', 'households_');
    n := regexp_replace(n, '^membres_', 'members_');
    n := regexp_replace(n, '^articles_', 'items_');
    n := regexp_replace(n, '^menus_', 'meal_plans_');
    if n <> r.conname then execute format('alter table %s rename constraint %I to %I', r.t, r.conname, n); end if;
  end loop;
end $$;

-- A member row is created at sign-up, with the first name passed in the user metadata.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (user_id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'prenom', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Household of the signed-in user (null if none).
create or replace function public.my_household_id() returns uuid language sql stable security definer set search_path = public as $$
  select household_id from public.members where user_id = auth.uid()
$$;

-- Invite code: 6 characters without O, 0, I, 1, written XXX-XXX.
create or replace function public.generate_invite_code() returns text language plpgsql as $$
declare alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text := ''; i int;
begin
  for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
  return substr(c, 1, 3) || '-' || substr(c, 4, 3);
end $$;

-- Error messages stay in French: the app shows them as they are.
create or replace function public.create_household() returns public.households language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  insert into public.households (invite_code, created_by) values (public.generate_invite_code(), auth.uid()) returning * into h;
  update public.members set household_id = h.id where user_id = auth.uid();
  return h;
end $$;

create or replace function public.join_household(p_code text) returns public.households language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into h from public.households where upper(replace(invite_code, '-', '')) = upper(replace(p_code, '-', '')) and code_expires_at > now();
  if h.id is null then raise exception 'code inconnu ou expiré'; end if;
  update public.members set household_id = h.id where user_id = auth.uid();
  return h;
end $$;

-- If the creator leaves, the oldest remaining member takes over.
create or replace function public.leave_household() returns void language plpgsql security definer set search_path = public as $$
declare hid uuid := public.my_household_id();
begin
  update public.members set household_id = null where user_id = auth.uid();
  update public.households set created_by = (select user_id from public.members where household_id = hid order by created_at limit 1)
    where id = hid and created_by = auth.uid();
end $$;

create or replace function public.renew_invite_code() returns public.households language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  update public.households set invite_code = public.generate_invite_code(), code_expires_at = now() + interval '7 days' where id = public.my_household_id() returning * into h;
  return h;
end $$;

-- Only the creator can remove another member; the invite code is renewed so the old one stops working.
create or replace function public.remove_member(p_user_id uuid) returns public.households language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  select * into h from public.households where id = public.my_household_id();
  if h.id is null or h.created_by is distinct from auth.uid() then raise exception 'seul le créateur du foyer peut retirer un membre'; end if;
  if p_user_id = auth.uid() then raise exception 'pour partir, quitte le foyer'; end if;
  update public.members set household_id = null where user_id = p_user_id and household_id = h.id;
  if not found then raise exception 'ce membre n''est pas dans le foyer'; end if;
  update public.households set invite_code = public.generate_invite_code(), code_expires_at = now() + interval '7 days' where id = h.id returning * into h;
  return h;
end $$;

-- Row level security: each user only sees their own household.
alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.items enable row level security;
alter table public.meal_plans enable row level security;

drop policy if exists households_select on public.households;
create policy households_select on public.households for select using (id = public.my_household_id());
drop policy if exists households_update on public.households;
create policy households_update on public.households for update using (id = public.my_household_id());

drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (user_id = auth.uid() or (household_id is not null and household_id = public.my_household_id()));
drop policy if exists members_update on public.members;
create policy members_update on public.members for update using (user_id = auth.uid());

drop policy if exists items_all on public.items;
create policy items_all on public.items for all using (household_id = public.my_household_id()) with check (household_id = public.my_household_id());

drop policy if exists meal_plans_all on public.meal_plans;
create policy meal_plans_all on public.meal_plans for all using (household_id = public.my_household_id()) with check (household_id = public.my_household_id());

-- API role grants (some projects do not grant them by default). RLS filters rows afterwards.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.households, public.members, public.items, public.meal_plans to authenticated;
grant execute on function public.my_household_id(), public.generate_invite_code(), public.create_household(), public.join_household(text), public.leave_household(), public.renew_invite_code(), public.remove_member(uuid) to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- Realtime: the other phone sees changes without reloading.
do $$ begin alter publication supabase_realtime add table public.items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.meal_plans; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.members; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.households; exception when duplicate_object then null; end $$;

commit;
