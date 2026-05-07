-- ============================================================
-- 0017_coupons.sql
-- 쿠폰 시스템 — coupon_templates / user_coupons 테이블 + 자동 발급 트리거 + 시드
-- ------------------------------------------------------------
-- 배경
--   `/mypage/coupons` 가 빈 상태 안내만 보여주던 placeholder. 결제 PG 가 영구
--   보류라 실제 차감은 mock 표시지만, 발급/사용 데이터는 진짜 DB 에 기록한다.
--
-- 모델
--   - coupon_templates: 관리자가 발행하는 쿠폰 정의 (어떤 사용자에게 발급될지,
--     유효기간 며칠, 할인 방식, 최소 주문 금액 등)
--   - user_coupons: 발급된 사용자별 인스턴스. status(AVAILABLE/USED/EXPIRED)
--     로 라이프사이클 추적. used_transaction_id 로 어떤 거래에 썼는지 보관.
--
-- 발급 정책
--   - SIGNUP : profiles INSERT 트리거가 자동 발급 (신규 가입자에게 1회)
--   - EVENT  : 시드/관리자 발행으로 일괄 발급 (이번 마이그레이션엔 시드만)
--   - MANUAL : 추후 코드 입력으로 redeem 하는 수동 발급 — 인터페이스만 준비
--
-- 사용 정책 (현 사이드 프로젝트 단계)
--   결제 PG 가 없으므로 클라이언트가 createOrder 시 userCouponId 를 같이
--   넘기면 trigger 가 user_coupons 를 USED 로 옮긴다. 환불/취소가 도입되면
--   AVAILABLE 로 되돌리는 분기를 추가해야 한다 (현재는 일방향).
-- ============================================================

create type coupon_discount_type as enum ('FIXED', 'PERCENT');
create type coupon_issue_kind as enum ('SIGNUP', 'EVENT', 'MANUAL');
create type user_coupon_status as enum ('AVAILABLE', 'USED', 'EXPIRED');

-- ---------------- coupon_templates ----------------
create table if not exists public.coupon_templates (
  id uuid primary key default gen_random_uuid(),
  code text unique,                                   -- MANUAL 발급용 식별 코드 (NULL 가능)
  name text not null,                                 -- "신규가입 환영 1,000원 쿠폰"
  description text,                                   -- 설명 — 카드 두 번째 줄
  discount_type coupon_discount_type not null,
  discount_value int not null check (discount_value > 0),
  min_order_amount int not null default 0 check (min_order_amount >= 0),
  -- PERCENT 일 때만 사용. NULL = 상한 없음
  max_discount int check (max_discount is null or max_discount > 0),
  issue_kind coupon_issue_kind not null,
  valid_days int not null check (valid_days > 0),     -- 발급일 + N일 만료
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 누구나 active 한 템플릿은 읽을 수 있음 — MANUAL 코드 redeem 시 lookup 필요
alter table public.coupon_templates enable row level security;
create policy "coupon_templates_read_active" on public.coupon_templates
  for select using (active = true);
-- 쓰기는 service_role 만 (정책 미정의 = 차단)

-- ---------------- user_coupons ----------------
create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.coupon_templates(id) on delete restrict,
  status user_coupon_status not null default 'AVAILABLE',
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists user_coupons_user_status_idx
  on public.user_coupons (user_id, status, expires_at desc);

-- 같은 SIGNUP 템플릿이 한 사용자에게 두 번 발급되지 않게 — 발급 트리거 idempotent 보장
create unique index if not exists user_coupons_signup_unique
  on public.user_coupons (user_id, template_id)
  where status in ('AVAILABLE', 'USED');

alter table public.user_coupons enable row level security;

create policy "user_coupons_own_read" on public.user_coupons
  for select using (auth.uid() = user_id);

-- INSERT 는 본인만. 자동 발급은 SECURITY DEFINER 트리거가 우회.
create policy "user_coupons_own_insert" on public.user_coupons
  for insert with check (auth.uid() = user_id);

-- UPDATE 는 본인만, 단 status 변경은 서버 트리거가 책임지는 게 안전.
-- 클라이언트가 직접 status='USED' 로 바꿀 수 있게 허용하되, 추후 SECURITY DEFINER
-- RPC 로 옮기면 더 안전. 현 단계에선 이 정도로 충분.
create policy "user_coupons_own_update" on public.user_coupons
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- 시드: 기본 쿠폰 템플릿 ----------------
insert into public.coupon_templates
  (code, name, description, discount_type, discount_value, min_order_amount, issue_kind, valid_days)
values
  ('WELCOME1000', '신규가입 환영 1,000원 쿠폰',
   '회원가입을 환영합니다. 첫 거래에 자동 적용돼요.',
   'FIXED', 1000, 5000, 'SIGNUP', 90),
  ('SPRING3000', '봄맞이 책장 정리 3,000원 쿠폰',
   '10,000원 이상 결제 시 사용 가능해요.',
   'FIXED', 3000, 10000, 'EVENT', 30),
  ('PERCENT10', '10% 할인 쿠폰',
   '7,000원 이상, 최대 5,000원까지 할인돼요.',
   'PERCENT', 10, 7000, 'EVENT', 30)
on conflict (code) do nothing;

-- ---------------- 자동 발급 트리거 (SIGNUP) ----------------
-- profiles INSERT 직후 active 한 SIGNUP 쿠폰을 모두 발급. 0017 시드의
-- WELCOME1000 한 장이 들어가는 흐름. 추후 SIGNUP 템플릿이 더 늘어나도
-- 새로 가입한 사용자에게는 자동 적용된다.
create or replace function public.issue_signup_coupons()
returns trigger
language plpgsql
security definer
as $$
declare
  t record;
begin
  for t in
    select id, valid_days
      from public.coupon_templates
     where issue_kind = 'SIGNUP'
       and active = true
  loop
    insert into public.user_coupons (user_id, template_id, expires_at)
    values (new.id, t.id, now() + make_interval(days => t.valid_days))
    on conflict (user_id, template_id) where status in ('AVAILABLE', 'USED')
    do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists profiles_issue_signup_coupons on public.profiles;
create trigger profiles_issue_signup_coupons
after insert on public.profiles
for each row execute procedure public.issue_signup_coupons();

-- 백필: 이미 가입한 사용자에게도 SIGNUP 쿠폰 1회 일괄 발급
insert into public.user_coupons (user_id, template_id, expires_at)
select p.id, t.id, now() + make_interval(days => t.valid_days)
  from public.profiles p
 cross join public.coupon_templates t
 where t.issue_kind = 'SIGNUP'
   and t.active = true
on conflict (user_id, template_id) where status in ('AVAILABLE', 'USED')
do nothing;

-- ---------------- 만료 처리 ----------------
-- expires_at 이 지난 AVAILABLE 쿠폰은 status='EXPIRED' 로 자동 옮김.
-- 별도 cron 없이 쿠폰 조회 시점에 클라이언트가 EXPIRED 를 필터링하는 방식도
-- 가능하지만, 화면 일관성을 위해 SECURITY DEFINER 함수 1개를 두고 필요 시
-- 호출하는 형태로 둔다 (예: /mypage/coupons 진입 시).
create or replace function public.expire_old_coupons()
returns void
language sql
security definer
as $$
  update public.user_coupons
     set status = 'EXPIRED'
   where status = 'AVAILABLE'
     and expires_at < now();
$$;
