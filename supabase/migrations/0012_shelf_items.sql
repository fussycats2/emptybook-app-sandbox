-- 0012_shelf_items.sql
-- 사용자 개인 책장(`/mypage/shelf`) — 4가지 상태로 책을 분류해 관리.
--
-- 디자인 메모:
-- - shelf_items 는 books 와 별개의 개인 컬렉션. 판매 매물(=books) 과 분리해서
--   소장/읽는 중/완독 같은 비-매물 책도 담을 수 있게 한다.
-- - 메타데이터(title/author/publisher/isbn/cover_url/category) 는 ISBN 또는 네이버
--   검색에서 받은 그대로 denormalize 해서 저장한다 — 책장이 books 테이블의 lifecycle
--   에 종속되지 않게.
-- - "판매예정 → 등록하기" 흐름에서 books 행을 만들면 linked_book_id 로 연결한다
--   (선택적 FK). 책이 삭제돼도 책장은 유지되도록 ON DELETE SET NULL.
-- - status enum: READING / FINISHED / FOR_SALE / OWNED.
-- - rating(1-5) 은 사용자가 매기는 개인 별점 (reviews 와 무관). memo 는 자유 메모.

create type shelf_status as enum ('READING', 'FINISHED', 'FOR_SALE', 'OWNED');

create table if not exists public.shelf_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- 책 메타데이터 (denormalized) — 네이버 검색/ISBN 결과를 그대로 보존
  title text not null,
  author text,
  publisher text,
  isbn text,
  category text,
  cover_url text,
  -- 사용자 책장 상태
  status shelf_status not null default 'OWNED',
  started_at date,
  finished_at date,
  rating int check (rating is null or (rating between 1 and 5)),
  memo text,
  -- 판매 등록 시 books 행과 연결 (있을 수도 없을 수도)
  linked_book_id uuid references public.books(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 같은 ISBN 을 같은 사용자가 중복으로 책장에 추가하지 않도록 — null ISBN(직접 입력)
-- 은 partial unique 로 제외해서 ISBN 모르는 책은 여러 번 추가 가능
create unique index if not exists shelf_items_user_isbn_unique
  on public.shelf_items (user_id, isbn)
  where isbn is not null;

create index if not exists shelf_items_user_status_idx
  on public.shelf_items (user_id, status, updated_at desc);

-- updated_at 자동 갱신 트리거 (books 와 동일한 패턴)
create or replace function public.touch_shelf_items_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists shelf_items_touch_updated_at on public.shelf_items;
create trigger shelf_items_touch_updated_at
before update on public.shelf_items
for each row execute procedure public.touch_shelf_items_updated_at();

-- ---------------- RLS ----------------
alter table public.shelf_items enable row level security;

-- 본인 책장만 조회/쓰기 가능 — wishlist_public 같은 공개 옵션은 추후 확장 시 추가
create policy "shelf_items_own_read" on public.shelf_items
  for select using (auth.uid() = user_id);
create policy "shelf_items_own_insert" on public.shelf_items
  for insert with check (auth.uid() = user_id);
create policy "shelf_items_own_update" on public.shelf_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shelf_items_own_delete" on public.shelf_items
  for delete using (auth.uid() = user_id);
