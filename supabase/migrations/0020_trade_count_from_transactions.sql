-- 0020_trade_count_from_transactions.sql
-- profiles.trade_count 의 source 를 reviews → transactions(COMPLETED) 로 변경
--
-- 배경: 0003 트리거가 trade_count 를 "받은 후기 개수" 로 정의했었다. 그런데 UI 라벨은
-- "거래 N회" 라 의미가 어긋났다. 거래완료해도 상대가 후기를 안 쓰면 trade_count=0
-- 으로 남아 모든 셀러 카드의 거래수/매너온도가 0/36.5 로 고정되는 문제.
--
-- 변경:
--   - recalc_profile_rating(uid) 함수가 trade_count 를 transactions(COMPLETED) 기준으로 계산
--     · 사용자가 buyer 또는 seller 인 거래완료 건수 (= 양방향 합산)
--   - rating_avg 는 그대로 reviews 기반
--   - transactions 의 status 가 COMPLETED 로 전이될 때 양쪽(buyer/seller) trade_count 재계산
--   - reviews 트리거(0003)는 그대로 유지 — 같은 함수 사용, rating_avg 갱신 책임만 가짐
--   - 마이그레이션 시점에 기존 COMPLETED 거래 양당사자에 대해 일괄 백필

create or replace function public.recalc_profile_rating(target_user uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles p
  set
    rating_avg = coalesce(
      (select round(avg(rating)::numeric, 2)
       from public.reviews
       where reviewee_id = target_user),
      0
    ),
    -- 거래수 = 내가 buyer 또는 seller 인 transactions 의 COMPLETED 건수
    -- 후기 작성 여부와 무관 (UI 라벨 "거래 N회" 의 의미와 일치)
    trade_count = (
      select count(*)
      from public.transactions
      where (buyer_id = target_user or seller_id = target_user)
        and status = 'COMPLETED'
    ),
    updated_at = now()
  where p.id = target_user;
end;
$$;

-- transactions.status 가 COMPLETED 로 전이될 때 양쪽 trade_count 갱신
create or replace function public.handle_transaction_complete()
returns trigger
language plpgsql
security definer
as $$
begin
  -- INSERT 로 바로 COMPLETED 가 들어오는 경로는 0010 FSM 이 막지만 안전망으로 처리
  if (tg_op = 'INSERT' and new.status = 'COMPLETED')
     or (tg_op = 'UPDATE'
         and new.status = 'COMPLETED'
         and (old.status is null or old.status <> 'COMPLETED')) then
    perform public.recalc_profile_rating(new.buyer_id);
    perform public.recalc_profile_rating(new.seller_id);
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_completion_sync on public.transactions;
create trigger transactions_completion_sync
after insert or update of status on public.transactions
for each row execute procedure public.handle_transaction_complete();

-- 백필 — 이미 COMPLETED 인 거래의 양당사자에 대해 trade_count / rating_avg 재계산
do $$
declare uid uuid;
begin
  for uid in
    select distinct user_id from (
      select buyer_id as user_id from public.transactions where status = 'COMPLETED'
      union
      select seller_id as user_id from public.transactions where status = 'COMPLETED'
    ) s
    where user_id is not null
  loop
    perform public.recalc_profile_rating(uid);
  end loop;
end $$;
