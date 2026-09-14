-- Launchr: execute this file in Supabase SQL Editor or as a migration.
-- Authentication users are managed by Supabase Auth; never create passwords here.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer', 'creator', 'admin');
create type public.landing_status as enum ('draft', 'pending_review', 'published', 'rejected', 'archived');
create type public.order_status as enum ('pending', 'paid', 'refunded', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  username text unique check (username ~ '^[a-z0-9-]{3,30}$'),
  phone text,
  avatar_url text,
  bio text check (char_length(bio) <= 400),
  contact_email text,
  website_url text,
  role public.user_role not null default 'creator',
  stripe_account_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.landings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 100),
  tagline text check (char_length(tagline) <= 180),
  description text check (char_length(description) <= 5000),
  category text not null default 'other',
  technologies text[] not null default '{}',
  price_cents integer not null check (price_cents >= 0 and price_cents <= 100000),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  preview_url text,
  cover_image_url text,
  demo_url text,
  repository_url text,
  status public.landing_status not null default 'draft',
  featured boolean not null default false,
  sales_count integer not null default 0 check (sales_count >= 0),
  view_count integer not null default 0 check (view_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.landing_assets (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.landings(id) on delete cascade,
  path text not null,
  kind text not null check (kind in ('cover', 'screenshot', 'source', 'documentation')),
  device text check (device in ('desktop', 'mobile')),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (landing_id, path)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'pending',
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  landing_id uuid not null references public.landings(id) on delete restrict,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  created_at timestamptz not null default now(),
  unique(order_id, landing_id)
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  stripe_transfer_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index landings_creator_idx on public.landings(creator_id);
create index landings_public_idx on public.landings(status, featured desc, published_at desc);
create index landing_assets_preview_idx on public.landing_assets(landing_id, kind, device, position);
create index order_items_creator_idx on public.order_items(creator_id);
create index orders_buyer_idx on public.orders(buyer_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger landings_updated_at before update on public.landings for each row execute procedure public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, phone)
  values (new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- The function is security definer so policy checks do not recurse through profiles.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.landings enable row level security;
alter table public.landing_assets enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payouts enable row level security;

revoke all on public.profiles, public.landings, public.landing_assets, public.orders, public.order_items, public.payouts from anon, authenticated;
grant select on public.profiles, public.landings, public.landing_assets to anon;
grant select, insert, update, delete on public.profiles, public.landings, public.landing_assets to authenticated;
grant select on public.orders, public.order_items, public.payouts to authenticated;

create policy "Public profiles are readable" on public.profiles for select to anon, authenticated using (true);
create policy "Users create only their profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update only their profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Admins can delete profiles" on public.profiles for delete to authenticated using ((select public.is_admin()));

create policy "Published landings are public" on public.landings for select to anon, authenticated using (status = 'published' or creator_id = (select auth.uid()) or (select public.is_admin()));
create policy "Creators create their own landings" on public.landings for insert to authenticated with check (creator_id = (select auth.uid()));
create policy "Creators update their own landings" on public.landings for update to authenticated using (creator_id = (select auth.uid()) or (select public.is_admin())) with check (creator_id = (select auth.uid()) or (select public.is_admin()));
create policy "Creators delete their own drafts" on public.landings for delete to authenticated using (creator_id = (select auth.uid()) or (select public.is_admin()));

create policy "Public assets of published landings are readable" on public.landing_assets for select to anon, authenticated using (exists (select 1 from public.landings l where l.id = landing_id and (l.status = 'published' or l.creator_id = (select auth.uid()) or (select public.is_admin()))));
create policy "Creators add their assets" on public.landing_assets for insert to authenticated with check (exists (select 1 from public.landings l where l.id = landing_id and l.creator_id = (select auth.uid())));
create policy "Creators update their assets" on public.landing_assets for update to authenticated using (exists (select 1 from public.landings l where l.id = landing_id and l.creator_id = (select auth.uid()))) with check (exists (select 1 from public.landings l where l.id = landing_id and l.creator_id = (select auth.uid())));
create policy "Creators delete their assets" on public.landing_assets for delete to authenticated using (exists (select 1 from public.landings l where l.id = landing_id and l.creator_id = (select auth.uid())));

-- Orders, payments and payouts are created by a trusted Stripe webhook using service_role.
create policy "Buyers read their own orders" on public.orders for select to authenticated using (buyer_id = (select auth.uid()) or (select public.is_admin()));
create policy "Creators read orders involving their landings" on public.orders for select to authenticated using (exists (select 1 from public.order_items oi where oi.order_id = id and oi.creator_id = (select auth.uid())));
create policy "Buyers read their own items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())) or creator_id = (select auth.uid()) or (select public.is_admin()));
create policy "Creators read their payouts" on public.payouts for select to authenticated using (creator_id = (select auth.uid()) or (select public.is_admin()));

-- Storage: public image previews and private source files, isolated by creator id.
insert into storage.buckets (id, name, public) values ('landing-previews', 'landing-previews', true), ('landing-files', 'landing-files', false) on conflict (id) do nothing;
create policy "Preview images are public" on storage.objects for select to anon, authenticated using (bucket_id = 'landing-previews');
create policy "Creators upload their preview images" on storage.objects for insert to authenticated with check (bucket_id = 'landing-previews' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Creators update their preview images" on storage.objects for update to authenticated using (bucket_id = 'landing-previews' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'landing-previews' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Creators delete their preview images" on storage.objects for delete to authenticated using (bucket_id = 'landing-previews' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Creators manage their source files" on storage.objects for select to authenticated using (bucket_id = 'landing-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Creators upload their source files" on storage.objects for insert to authenticated with check (bucket_id = 'landing-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Creators update their source files" on storage.objects for update to authenticated using (bucket_id = 'landing-files' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'landing-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Creators delete their source files" on storage.objects for delete to authenticated using (bucket_id = 'landing-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Run these statements once when upgrading an existing Launchr database.
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists phone text;
alter table public.landing_assets add column if not exists device text check (device in ('desktop', 'mobile'));

-- Refresh the signup trigger when upgrading an existing database.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, phone)
  values (new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;
