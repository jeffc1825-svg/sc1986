-- ============================================================
-- SC1986 0001_init — schema、RLS、RPC、storage bucket
-- 重放條件:乾淨資料庫由上而下執行成功
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- enums ----------
create type product_price_mode as enum ('public_price', 'quote_only', 'login_or_quote');
create type product_stock_status as enum ('in_stock', 'preorder', 'quote_required', 'discontinued');
create type product_status as enum ('draft', 'active', 'archived');
create type quote_status as enum ('new', 'reviewing', 'quoted', 'closed', 'cancelled');
create type admin_role as enum ('owner', 'admin', 'staff');
create type import_batch_status as enum ('pending', 'processing', 'completed', 'failed');
create type notification_status as enum ('pending', 'sent', 'failed', 'skipped');

-- ---------- updated_at trigger ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- tables ----------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_brands_updated before update on brands
  for each row execute function set_updated_at();

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_parent on categories(parent_id);
create trigger trg_categories_updated before update on categories
  for each row execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  brand_id uuid references brands(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  short_description text,
  description text,
  ordering_notice text,
  pricing_note text,
  price numeric(12,2) check (price is null or price >= 0),
  price_mode product_price_mode not null default 'quote_only',
  stock_status product_stock_status not null default 'quote_required',
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_status on products(status);
create index idx_products_category on products(category_id);
create index idx_products_brand on products(brand_id);
create index idx_products_created on products(created_at desc);
create index idx_products_sku_trgm on products using gin (sku gin_trgm_ops);
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_images_product on product_images(product_id, sort_order);

create table product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  value text not null,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_specs_product on product_specs(product_id, sort_order);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  role admin_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_admin_users_updated before update on admin_users
  for each row execute function set_updated_at();

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  customer_name text not null,
  company text,
  email text not null,
  phone text,
  message text,
  status quote_status not null default 'new',
  admin_note text,
  notification_status notification_status not null default 'pending',
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_quote_requests_status on quote_requests(status);
create index idx_quote_requests_created on quote_requests(created_at desc);
create trigger trg_quote_requests_updated before update on quote_requests
  for each row execute function set_updated_at();

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references quote_requests(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  sku text not null,
  name text not null,
  quantity integer not null check (quantity > 0 and quantity <= 9999),
  note text,
  created_at timestamptz not null default now()
);
create index idx_quote_items_request on quote_items(quote_request_id);

create table product_import_batches (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references admin_users(id) on delete set null,
  original_filename text not null,
  status import_batch_status not null default 'pending',
  row_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_import_batches_created on product_import_batches(created_at desc);
create trigger trg_import_batches_updated before update on product_import_batches
  for each row execute function set_updated_at();

create table product_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references product_import_batches(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb,
  error_message text,
  product_id uuid references products(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_import_rows_batch on product_import_rows(batch_id, row_number);

-- ---------- is_admin() ----------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where auth_user_id = auth.uid() and is_active = true
  );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- ---------- RLS ----------
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_specs enable row level security;
alter table admin_users enable row level security;
alter table quote_requests enable row level security;
alter table quote_items enable row level security;
alter table product_import_batches enable row level security;
alter table product_import_rows enable row level security;

-- 公開讀取
create policy "public read brands" on brands for select using (true);
create policy "public read categories" on categories for select using (true);

create policy "public read active products" on products
  for select using (status = 'active' or is_admin());

create policy "public read images of active products" on product_images
  for select using (
    exists (
      select 1 from products p
      where p.id = product_id and (p.status = 'active' or is_admin())
    )
  );

create policy "public read specs of active products" on product_specs
  for select using (
    exists (
      select 1 from products p
      where p.id = product_id and (p.status = 'active' or is_admin())
    )
  );

-- 管理者全權(公開寫入一律不開;詢價寫入走 SECURITY DEFINER RPC)
create policy "admin write brands" on brands
  for all using (is_admin()) with check (is_admin());
create policy "admin write categories" on categories
  for all using (is_admin()) with check (is_admin());
create policy "admin write products" on products
  for all using (is_admin()) with check (is_admin());
create policy "admin write product_images" on product_images
  for all using (is_admin()) with check (is_admin());
create policy "admin write product_specs" on product_specs
  for all using (is_admin()) with check (is_admin());

-- admin_users:管理者可讀全部;只有 owner 可異動(第一階段先以 service role / SQL 維護)
create policy "admin read admin_users" on admin_users
  for select using (is_admin());

-- 詢價:管理者可讀寫;anon 無直接存取(寫入只經 RPC)
create policy "admin read quotes" on quote_requests
  for select using (is_admin());
create policy "admin update quotes" on quote_requests
  for update using (is_admin()) with check (is_admin());
create policy "admin read quote_items" on quote_items
  for select using (is_admin());

-- 匯入:管理者全權
create policy "admin all import_batches" on product_import_batches
  for all using (is_admin()) with check (is_admin());
create policy "admin all import_rows" on product_import_rows
  for all using (is_admin()) with check (is_admin());

-- ---------- 詢價 RPC(原子寫入) ----------
-- p_contact: {"customer_name","company","email","phone","message"}
-- p_items:   [{"product_id","quantity","note"}, ...]
-- 回傳: {"id","reference_code"}
create or replace function create_quote_request(p_contact jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(p_contact->>'customer_name', '')), '');
  v_email text := nullif(trim(coalesce(p_contact->>'email', '')), '');
  v_company text := nullif(trim(coalesce(p_contact->>'company', '')), '');
  v_phone text := nullif(trim(coalesce(p_contact->>'phone', '')), '');
  v_message text := nullif(trim(coalesce(p_contact->>'message', '')), '');
  v_item jsonb;
  v_count integer;
  v_quote_id uuid;
  v_ref text;
  v_product products%rowtype;
  v_qty integer;
  v_note text;
  v_attempt integer := 0;
begin
  -- 聯絡資料驗證
  if v_name is null or char_length(v_name) > 100 then
    raise exception 'INVALID_CONTACT: customer_name';
  end if;
  if v_email is null or char_length(v_email) > 255 or position('@' in v_email) = 0 then
    raise exception 'INVALID_CONTACT: email';
  end if;
  if char_length(coalesce(v_company, '')) > 100
     or char_length(coalesce(v_phone, '')) > 50
     or char_length(coalesce(v_message, '')) > 2000 then
    raise exception 'INVALID_CONTACT: length';
  end if;

  -- 品項數量驗證
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS: not array';
  end if;
  v_count := jsonb_array_length(p_items);
  if v_count < 1 or v_count > 50 then
    raise exception 'INVALID_ITEMS: count';
  end if;

  -- 產生唯一案件編號 Q + 台北日期 + 4 碼
  loop
    v_attempt := v_attempt + 1;
    v_ref := 'Q' || to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDD') || '-'
      || upper(substr(md5(gen_random_uuid()::text), 1, 4));
    exit when not exists (select 1 from quote_requests where reference_code = v_ref);
    if v_attempt > 5 then
      v_ref := 'Q' || to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDD') || '-'
        || upper(substr(md5(gen_random_uuid()::text), 1, 8));
      exit;
    end if;
  end loop;

  insert into quote_requests (reference_code, customer_name, company, email, phone, message, status)
  values (v_ref, v_name, v_company, v_email, v_phone, v_message, 'new')
  returning id into v_quote_id;

  -- 逐項驗證:必須是 active 商品;sku/name 以資料庫當下值快照
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    v_note := nullif(trim(coalesce(v_item->>'note', '')), '');
    if v_qty < 1 or v_qty > 9999 then
      raise exception 'INVALID_ITEM: quantity';
    end if;
    if char_length(coalesce(v_note, '')) > 500 then
      raise exception 'INVALID_ITEM: note length';
    end if;

    select * into v_product
    from products
    where id = (v_item->>'product_id')::uuid and status = 'active';

    if not found then
      raise exception 'INVALID_ITEM: product % not available', v_item->>'product_id';
    end if;

    insert into quote_items (quote_request_id, product_id, sku, name, quantity, note)
    values (v_quote_id, v_product.id, v_product.sku, v_product.name, v_qty, v_note);
  end loop;

  return jsonb_build_object('id', v_quote_id, 'reference_code', v_ref);
end;
$$;

revoke all on function create_quote_request(jsonb, jsonb) from public;
grant execute on function create_quote_request(jsonb, jsonb) to anon, authenticated;

-- ---------- Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
