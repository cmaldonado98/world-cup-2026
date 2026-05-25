-- ============================================================
--  Panini FIFA World Cup 2026 Album – Supabase Schema
--  Idempotente: se puede ejecutar varias veces sin errores.
--
--  ANTES de ejecutar, configurar en el Dashboard de Supabase:
--  Authentication → Providers → Email:
--    ✓ Enable Email provider
--    ✓ Minimum password length = 4        ← requerido para el PIN
--    ✓ Confirm email = OFF (recomendado para desarrollo)
--      Activar ON en producción si se desea verificación de email
--    ✓ Leaked password protection = OFF   (PINs cortos son detectados)
--
--  NOTA sobre el PIN: la app envía PIN(4 dígitos) + sufijo interno
--  para superar la longitud mínima por defecto (6). Configurar
--  "Minimum password length = 4" elimina la necesidad del sufijo.
-- ============================================================

-- ── 0. Extensiones necesarias ────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_net";     -- peticiones HTTP en triggers (opcional)

-- ── 1. Función compartida: actualizar updated_at ─────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. Tabla: profiles ───────────────────────────────────────
--  Extiende auth.users con datos públicos del usuario.
--  Se crea automáticamente vía trigger al registrarse.
create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text        not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Cada usuario gestiona su propio perfil
drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = id);

-- Cualquier usuario autenticado puede leer perfiles (feature de intercambio)
drop policy if exists "profiles_auth_read" on public.profiles;
create policy "profiles_auth_read" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Trigger: updated_at
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── 3. Trigger de auth: crear perfil al registrar usuario ────
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer                -- corre como superusuario para acceder a auth.*
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update          -- idempotente: actualiza email si cambió
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

-- Ejecutar cada vez que se crea un usuario en auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 4. Tabla: user_cards ─────────────────────────────────────
--  Almacena los cromos de cada usuario.
--  card_id sigue el formato oficial Panini: "[CÓDIGO] [N]"
--  Ejemplos: "ARG 10", "MEX 5", "FIFA 3"
create table if not exists public.user_cards (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  card_id     text        not null
                          check (card_id ~ '^([A-Z]{2,5}[0-9]{0,3}|00)$'),   -- valida formato (ej: 00, FWC1, MEX1, CC14)
  quantity    integer     default 0 not null check (quantity >= 0),
  updated_at  timestamptz default now() not null,
  constraint  uq_user_card unique (user_id, card_id)
);

-- Índices para las consultas más frecuentes
create index if not exists user_cards_user_id_idx on public.user_cards(user_id);
create index if not exists user_cards_card_id_idx  on public.user_cards(card_id);

alter table public.user_cards enable row level security;

-- El propietario puede hacer todo (INSERT / SELECT / UPDATE / DELETE)
drop policy if exists "user_cards_owner_all" on public.user_cards;
create policy "user_cards_owner_all" on public.user_cards
  for all using (auth.uid() = user_id);

-- Cualquier usuario autenticado puede LEER los cromos de otros
-- (necesario para el matcher de intercambio)
drop policy if exists "user_cards_auth_read" on public.user_cards;
create policy "user_cards_auth_read" on public.user_cards
  for select using (auth.role() = 'authenticated');

-- Trigger: updated_at
drop trigger if exists trg_user_cards_updated_at on public.user_cards;
create trigger trg_user_cards_updated_at
  before update on public.user_cards
  for each row execute function public.touch_updated_at();

-- ── 5. Vista auxiliar: estadísticas por usuario ──────────────
create or replace view public.user_album_stats as
select
  uc.user_id,
  p.email,
  p.display_name,
  count(*)                                          as owned_count,
  sum(case when uc.quantity > 1 then 1 else 0 end) as duplicates_count,
  sum(uc.quantity)                                  as total_quantity,
  max(uc.updated_at)                                as last_updated
from public.user_cards uc
join public.profiles p on p.id = uc.user_id
where uc.quantity > 0
group by uc.user_id, p.email, p.display_name;

-- Solo visible para usuarios autenticados
grant select on public.user_album_stats to authenticated;

