-- =====================================================================
-- SISTEMA POS CAFETERÍA — SCHEMA DE SUPABASE (PostgreSQL)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PERFILES (extiende auth.users con rol y nombre)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'cajero' check (role in ('admin', 'cajero', 'barista')),
  created_at timestamptz not null default now()
);

-- Crea automáticamente un perfil cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'admin');
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
-- 3. ÓRDENES (POS)
-- ---------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number bigserial,
  customer_name text,
  status text not null default 'open' check (status in ('open', 'paid', 'cancelled')),
  payment_method text check (payment_method in ('cash', 'card', 'transfer')),
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

-- ---------------------------------------------------------------------
-- 4. INVENTARIO
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
-- 5. FINANZAS (gastos)
-- ---------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  concept text not null,
  category text not null default 'otros'
    check (category in ('insumos', 'servicios', 'nomina', 'renta', 'mantenimiento', 'otros')),
  amount numeric(10,2) not null check (amount >= 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on expenses(date);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- Cualquier usuario autenticado (empleado de la cafetería) puede
-- leer y escribir. Ajusta las políticas según tus roles si necesitas
-- restringir, por ejemplo, que solo 'admin' borre productos.
-- =====================================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
alter table expenses enable row level security;

-- Perfiles: cada quien ve y edita el suyo, todos pueden ver todos (para mostrar nombre en header)
create policy "profiles_select_all" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Resto de tablas: acceso completo para usuarios autenticados
create policy "categories_all" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "products_all" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "orders_all" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "order_items_all" on order_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "inventory_items_all" on inventory_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "inventory_movements_all" on inventory_movements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "expenses_all" on expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =====================================================================
-- DATOS DE EJEMPLO (opcional, cómodo para empezar a probar)
-- =====================================================================

insert into categories (name, icon, sort_order) values
  ('Café caliente', '☕', 1),
  ('Café frío', '🧊', 2),
  ('Repostería', '🥐', 3),
  ('Bebidas', '🥤', 4)
on conflict do nothing;

-- Productos de ejemplo (usa los ids de categorías recién creadas)
insert into products (name, description, price, category_id, is_active)
select 'Espresso', 'Shot doble de espresso', 2.50, id, true from categories where name = 'Café caliente'
union all
select 'Cappuccino', 'Espresso con leche vaporizada', 3.50, id, true from categories where name = 'Café caliente'
union all
select 'Latte', 'Espresso con leche cremosa', 3.75, id, true from categories where name = 'Café caliente'
union all
select 'Cold Brew', 'Café frío de extracción lenta', 4.00, id, true from categories where name = 'Café frío'
union all
select 'Frappé de vainilla', 'Bebida helada batida', 4.50, id, true from categories where name = 'Café frío'
union all
select 'Croissant', 'Croissant de mantequilla', 2.75, id, true from categories where name = 'Repostería'
union all
select 'Muffin de arándano', 'Muffin casero', 2.90, id, true from categories where name = 'Repostería'
union all
select 'Agua embotellada', 'Agua natural 500ml', 1.50, id, true from categories where name = 'Bebidas'
on conflict do nothing;

insert into inventory_items (name, unit, quantity, min_quantity, cost_per_unit) values
  ('Café en grano', 'kg', 8, 3, 12.00),
  ('Leche entera', 'lt', 15, 5, 1.10),
  ('Vasos desechables 12oz', 'unidad', 300, 100, 0.08),
  ('Azúcar', 'kg', 6, 2, 0.90),
  ('Harina', 'kg', 10, 4, 0.75)
on conflict do nothing;

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
