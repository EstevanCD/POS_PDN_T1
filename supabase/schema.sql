-- =====================================================================
-- SISTEMA POS CAFETERÍA — SCHEMA CONSOLIDADO DE SUPABASE (PostgreSQL)
-- Refleja el estado real de la base de datos en producción a la fecha.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
--
-- ⚠️ NOTA DE SEGURIDAD: las políticas RLS de este archivo son las
-- "amplias" (cualquier usuario autenticado puede escribir en casi
-- todo). Los roles (admin/cajero/barista/mesero/cocinero) HOY solo
-- se validan en el frontend (Angular), no en la base de datos.
-- Ver sección final "PENDIENTE: endurecimiento de seguridad" para
-- el script que lo corrige cuando decidas aplicarlo.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PERFILES (extiende auth.users con rol y nombre)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'mesero' check (role in ('admin', 'cajero', 'barista', 'mesero', 'cocinero')),
  created_at timestamptz not null default now()
);

-- El primer usuario que se registre queda como admin; los siguientes, como mesero
create or replace function public.handle_new_user()
returns trigger as $$
declare
  existing_count int;
begin
  select count(*) into existing_count from public.profiles;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case when existing_count = 0 then 'admin' else 'mesero' end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. CATEGORÍAS Y PRODUCTOS (Menú)
-- ---------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text default '☕',
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category_id uuid references categories(id) on delete set null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);

-- ---------------------------------------------------------------------
-- 3. INVENTARIO (se crea antes que product_recipe porque la referencia)
-- ---------------------------------------------------------------------
create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  unit text not null default 'unidad',
  quantity numeric(10,2) not null default 0,
  min_quantity numeric(10,2) not null default 0,
  cost_per_unit numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity numeric(10,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. RECETAS (relación producto ↔ insumo, con conversión de unidades)
-- ---------------------------------------------------------------------
create table if not exists product_recipe (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity_used numeric(10,3) not null check (quantity_used > 0),
  unit text not null default 'g' check (unit in ('g', 'kg', 'lb', 'oz', 'ml', 'l', 'unidad')),
  created_at timestamptz not null default now(),
  unique(product_id, inventory_item_id)
);

-- ---------------------------------------------------------------------
-- 5. ÓRDENES (POS) — pago dividido, mesa, teléfono, estado de cocina
-- ---------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number bigserial,
  customer_name text,
  customer_phone text,
  table_number text,
  status text not null default 'open' check (status in ('open', 'paid', 'cancelled')),
  payment_method text check (payment_method in ('cash', 'card', 'transfer', 'mixed')),
  payments jsonb,
  kitchen_status text not null default 'pending' check (kitchen_status in ('pending', 'preparing', 'ready')),
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(10,2) not null
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_orders_created_at on orders(created_at);
create index if not exists idx_orders_status on orders(status);

-- ---------------------------------------------------------------------
-- 6. FINANZAS (gastos) — con método de pago
-- ---------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  concept text not null,
  category text not null default 'otros'
    check (category in ('insumos', 'servicios', 'nomina', 'renta', 'mantenimiento', 'otros')),
  payment_method text check (payment_method in ('cash', 'card', 'transfer', 'other')),
  amount numeric(10,2) not null check (amount >= 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on expenses(date);

-- ---------------------------------------------------------------------
-- 7. CONFIGURACIÓN GENERAL (nombre, logo, moneda, tasa de lealtad)
-- ---------------------------------------------------------------------
create table if not exists app_settings (
  id uuid primary key default uuid_generate_v4(),
  cafe_name text not null default 'Mi Cafetería',
  logo_url text,
  currency text not null default 'COP' check (currency in ('COP', 'USD', 'EUR')),
  loyalty_rate numeric(10,4) not null default 0.001,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. PROGRAMA DE LEALTAD (clientes y puntos)
-- ---------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text,
  phone text unique not null,
  points numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) — nivel actual: "amplio" para operadores.
-- Cualquier usuario autenticado puede leer y escribir la mayoría de
-- tablas. Solo profiles/app_settings/storage validan rol admin.
-- =====================================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_recipe enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
alter table expenses enable row level security;
alter table app_settings enable row level security;
alter table customers enable row level security;

-- Perfiles: todos pueden ver todos (para mostrar nombre/rol en header);
-- cada quien edita el suyo, o un admin puede editar cualquiera.
create policy "profiles_select_all" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own_or_admin" on profiles
  for update using (
    auth.uid() = id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Resto de tablas: acceso completo para cualquier usuario autenticado
create policy "categories_all" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "products_all" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "product_recipe_all" on product_recipe for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "orders_all" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "order_items_all" on order_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "inventory_items_all" on inventory_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "inventory_movements_all" on inventory_movements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "expenses_all" on expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "customers_all" on customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- app_settings: lectura pública (necesaria para mostrar el nombre/logo
-- en la pantalla de Login, antes de iniciar sesión); escritura solo admin.
create policy "app_settings_select_public" on app_settings for select using (true);
create policy "app_settings_update_admin" on app_settings
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- ---------------------------------------------------------------------
-- Storage: bucket para el logo de la cafetería
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'branding'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "branding_admin_update" on storage.objects
  for update using (
    bucket_id = 'branding'
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- =====================================================================
-- DATOS DE EJEMPLO (opcional — solo si empiezas desde una base vacía)
-- =====================================================================

insert into app_settings (cafe_name, currency) values ('Mi Cafetería', 'COP')
on conflict do nothing;

insert into categories (name, icon, sort_order) values
  ('Café caliente', '☕', 1),
  ('Café frío', '🧊', 2),
  ('Repostería', '🥐', 3),
  ('Bebidas', '🥤', 4)
on conflict do nothing;

insert into inventory_items (name, unit, quantity, min_quantity, cost_per_unit) values
  ('Café en grano', 'kg', 8, 3, 12.00),
  ('Leche entera', 'lt', 15, 5, 1.10),
  ('Vasos desechables 12oz', 'unidad', 300, 100, 0.08),
  ('Azúcar', 'kg', 6, 2, 0.90),
  ('Harina', 'kg', 10, 4, 0.75)
on conflict do nothing;

-- =====================================================================
-- FIN DEL SCHEMA CONSOLIDADO — estado reflejado: producción actual
-- =====================================================================


-- =====================================================================
-- PENDIENTE: endurecimiento de seguridad (NO aplicado en producción)
-- Reemplaza las políticas "_all" de arriba por políticas que validan
-- el rol real desde `profiles`, no solo "está autenticado". Guardado
-- aquí como referencia para cuando decidas aplicarlo — no lo ejecutes
-- junto con el resto del script de arriba sin antes decidirlo.
-- =====================================================================

-- (Contactarme cuando quieras retomar esto — lo dejamos pausado por el
--  problema de "estado de cocina no avanza" que estábamos depurando.
--  La causa más probable era la función set_kitchen_status sin permisos
--  correctos, no las políticas en sí. Se puede resolver con calma.)