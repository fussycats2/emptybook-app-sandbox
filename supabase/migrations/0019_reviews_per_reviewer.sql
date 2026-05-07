-- 0019_reviews_per_reviewer.sql
-- reviews UNIQUE 제약 변경 — 한 거래에 한 후기 → 한 거래에 reviewer 별로 한 후기
--
-- 배경: 0001 의 `transaction_id uuid not null unique` 가 단독 UNIQUE 라서 buyer 가 후기를
-- 쓰면 seller 가 후기를 더 못 썼다. 양쪽이 서로에게 후기를 남길 수 있어야 정상이고,
-- 0003 트리거(rating_avg / trade_count 자동 갱신) 도 양방향 입력을 가정한 설계였음.
--
-- 변경:
--   - 기존 implicit unique key (`reviews_transaction_id_key`) 제거
--   - 새 unique key (transaction_id, reviewer_id) 로 교체
--   - reviewer 한 명이 같은 거래에 두 번 쓰는 건 여전히 차단 (UNIQUE composite)
-- 클라이언트는 INSERT 시 23505 가 떨어지면 "이미 작성한 후기" 로 분기 (변경 없음).
-- fetchReviewContext 의 alreadyReviewed 판정도 reviewer_id=auth.uid 로 좁혀야 한다 (코드에서 처리).

alter table public.reviews
  drop constraint if exists reviews_transaction_id_key;

alter table public.reviews
  add constraint reviews_one_per_reviewer
  unique (transaction_id, reviewer_id);
