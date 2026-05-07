-- 0021_more_coupons.sql
-- 베타 시연용으로 쿠폰 템플릿을 다양화하고, 기존 사용자에게도 일괄 발급.
--
-- 0017 의 3종(WELCOME1000 / SPRING3000 / PERCENT10) 만으로는 쿠폰함이 비어 보여서
-- 결제 화면 적용 흐름을 시연하기 어려웠다. 액수/할인 방식/만료/최소주문을 다양하게
-- 한 5종을 추가한다. 관리자 대시보드 없이 SQL 시드로만 운용.
--
-- 정책:
--   - 신규 추가는 ON CONFLICT (code) DO NOTHING — 이미 존재하는 코드는 건드리지 않음
--   - 백필은 모든 active 템플릿을 모든 기존 사용자에게 한 번씩 발급
--     · user_coupons partial unique (user_id, template_id) where status in (AVAILABLE, USED)
--       이미 가지고 있는 사람은 ON CONFLICT 로 스킵 (재발급 안 됨)
--     · 0017 의 SIGNUP 백필과 겹치지만 ON CONFLICT 로 안전
--   - 신규 가입자에게는 0017 의 issue_signup_coupons 트리거가 SIGNUP 종류만 발급 — 변경 없음

insert into public.coupon_templates
  (code, name, description, discount_type, discount_value, min_order_amount, max_discount, issue_kind, valid_days)
values
  ('WELCOME_PLUS', '신규가입 추가 환영 쿠폰',
   '15% 할인 (최대 5,000원). 첫 거래 부담을 더 덜어드릴게요.',
   'PERCENT', 15, 7000, 5000, 'SIGNUP', 90),
  ('EVERY3000', '아무 책에나 쓸 수 있는 3,000원',
   '최소 주문 금액 없음. 무료나눔 빼고 어디든 사용 가능.',
   'FIXED', 3000, 0, null, 'EVENT', 60),
  ('BIGSALE7000', '대형 할인 7,000원',
   '20,000원 이상 결제 시 사용 가능. 두꺼운 책 들이실 때.',
   'FIXED', 7000, 20000, null, 'EVENT', 30),
  ('PERCENT20', '20% 할인 쿠폰',
   '10,000원 이상, 최대 8,000원까지 할인돼요.',
   'PERCENT', 20, 10000, 8000, 'EVENT', 14),
  ('FREESHIP2500', '택배비 부담 해소 2,500원',
   '택배 거래의 작은 부담을 덜어드려요. 최소 주문 금액 없음.',
   'FIXED', 2500, 0, null, 'EVENT', 90)
on conflict (code) do nothing;

-- 백필: 모든 active 템플릿을 모든 기존 사용자에게 일괄 발급
-- 이미 가지고 있는 사람은 partial unique 로 스킵
insert into public.user_coupons (user_id, template_id, expires_at)
select p.id, t.id, now() + make_interval(days => t.valid_days)
  from public.profiles p
 cross join public.coupon_templates t
 where t.active = true
on conflict (user_id, template_id) where status in ('AVAILABLE', 'USED')
do nothing;
