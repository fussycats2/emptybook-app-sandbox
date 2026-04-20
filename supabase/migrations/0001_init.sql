-- ============================================================
-- EmptyBook (책장비움) — Initial schema
-- 기획서 §3 엔티티 관계 + §4-A Backend & Database 기준
-- ============================================================

-- ---------------- profiles (auth.users 1:1) -----------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  phone text,
  avatar_url text,
  rating_avg numeric(3, 2) default 0,
  trade_count int default 0,
  preferred_genres text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------------- books -------------------------------------
create type book_state as enum ('A_PLUS', 'A', 'B', 'C');
create type trade_method as enum ('DIRECT', 'PARCEL', 'BOTH');
create type book_status as enum ('SELLING', 'RESERVED', 'SOLD', 'HIDDEN');

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text,
  publisher text,
  isbn text,
  category text,
  state book_state not null,
  price int not null check (price >= 0),
  original_price int,
  trade_method trade_method not null default 'DIRECT',
  region text,
  description text,
  status book_status not null default 'SELLING',
  view_count int default 0,
  like_count int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists books_seller_idx on public.books (seller_id);
create index if not exists books_created_idx on public.books (created_at desc);
create index if not exists books_category_idx on public.books (category);
create index if not exists books_status_idx on public.books (status);

create table if not exists public.book_images (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists book_images_book_idx on public.book_images (book_id, sort_order);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- ---------------- transactions ------------------------------
create type tx_status as enum (
  'OFFERED', 'ACCEPTED', 'PAID', 'SHIPPING', 'COMPLETED', 'CANCELED'
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  offered_price int not null,
  trade_method trade_method not null,
  status tx_status not null default 'OFFERED',
  meet_at timestamptz,
  shipping_address jsonb,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tx_book_idx on public.transactions (book_id);
create index if not exists tx_buyer_idx on public.transactions (buyer_id);
create index if not exists tx_seller_idx on public.transactions (seller_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  method text not null,
  amount int not null,
  shipping_fee int default 0,
  coupon_discount int default 0,
  paid_at timestamptz,
  status text not null default 'PENDING'
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  match_level text,
  tags text[] default '{}',
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------- chat / messages ---------------------------
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (book_id, buyer_id, seller_id)
);
create index if not exists chat_rooms_buyer_idx on public.chat_rooms (buyer_id, last_message_at desc);
create index if not exists chat_rooms_seller_idx on public.chat_rooms (seller_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  type text not null default 'TEXT',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_room_idx on public.messages (room_id, created_at);

-- ---------------- notifications -----------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------- realtime ----------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_rooms;
alter publication supabase_realtime add table public.notifications;

-- ---------------- RLS ---------------------------------------
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.book_images enable row level security;
alter table public.likes enable row level security;
alter table public.transactions enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- profiles: read all, modify own
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- books: public read, owner write
create policy "books_read_public" on public.books for select using (true);
create policy "books_insert_own" on public.books for insert with check (auth.uid() = seller_id);
create policy "books_update_own" on public.books for update using (auth.uid() = seller_id);
create policy "books_delete_own" on public.books for delete using (auth.uid() = seller_id);

create policy "book_images_read_public" on public.book_images for select using (true);
create policy "book_images_write_own" on public.book_images for all using (
  exists (select 1 from public.books b where b.id = book_id and b.seller_id = auth.uid())
);

-- likes: own only
create policy "likes_own" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions: buyer or seller can read; buyer creates; both can update status
create policy "tx_read_party" on public.transactions for select using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "tx_insert_buyer" on public.transactions for insert with check (auth.uid() = buyer_id);
create policy "tx_update_party" on public.transactions for update using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

create policy "payments_read_party" on public.payments for select using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
  )
);
create policy "payments_write_buyer" on public.payments for all using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_id and t.buyer_id = auth.uid()
  )
);

create policy "reviews_read_public" on public.reviews for select using (true);
create policy "reviews_write_reviewer" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- chat / messages: room participants only
create policy "chat_rooms_party" on public.chat_rooms for select using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "chat_rooms_insert_party" on public.chat_rooms for insert with check (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

create policy "messages_read_party" on public.messages for select using (
  exists (
    select 1 from public.chat_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  )
);
create policy "messages_insert_sender" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.chat_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  )
);

create policy "notifications_own" on public.notifications for all using (auth.uid() = user_id);

-- ---------------- storage bucket ----------------------------
insert into storage.buckets (id, name, public)
values ('book-images', 'book-images', true)
on conflict (id) do nothing;

create policy "book_images_storage_read"
on storage.objects for select using (bucket_id = 'book-images');

create policy "book_images_storage_upload"
on storage.objects for insert with check (
  bucket_id = 'book-images' and auth.uid() is not null
);

create policy "book_images_storage_delete"
on storage.objects for delete using (
  bucket_id = 'book-images' and owner = auth.uid()
);
