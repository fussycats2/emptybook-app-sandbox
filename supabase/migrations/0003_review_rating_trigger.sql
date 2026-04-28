-- ============================================================
-- reviews INSERT/UPDATE/DELETE 시 profiles.rating_avg / trade_count 자동 갱신
-- ------------------------------------------------------------
-- 정책
--   rating_avg  : 해당 사용자가 받은(reviewee) 모든 후기의 rating 평균 (소수 둘째자리)
--   trade_count : 해당 사용자가 reviewee 인 후기 개수 (= 거래완료 + 후기 작성된 거래 수)
-- 트리거 한 번 실행으로 영향받는 reviewee_id 만 다시 계산 → O(N_for_user)
-- ============================================================

-- 한 사용자(reviewee)의 통계만 다시 계산
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
    trade_count = (
      select count(*)
      from public.reviews
      where reviewee_id = target_user
    ),
    updated_at = now()
  where p.id = target_user;
end;
$$;

-- reviews 변경 시 호출되는 트리거 본체
-- INSERT/UPDATE 시에는 NEW 의 reviewee_id, DELETE 시에는 OLD 의 reviewee_id
-- UPDATE로 reviewee_id 가 바뀌는 비정상 케이스도 양쪽 다 갱신
create or replace function public.handle_review_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_profile_rating(old.reviewee_id);
    return old;
  elsif tg_op = 'UPDATE' then
    if old.reviewee_id is distinct from new.reviewee_id then
      perform public.recalc_profile_rating(old.reviewee_id);
    end if;
    perform public.recalc_profile_rating(new.reviewee_id);
    return new;
  else -- INSERT
    perform public.recalc_profile_rating(new.reviewee_id);
    return new;
  end if;
end;
$$;

drop trigger if exists reviews_rating_sync on public.reviews;
create trigger reviews_rating_sync
after insert or update or delete on public.reviews
for each row execute procedure public.handle_review_change();

-- 기존 후기에 대해 한 번 일괄 동기화 (마이그레이션 시점에 누락 방지)
do $$
declare uid uuid;
begin
  for uid in select distinct reviewee_id from public.reviews loop
    perform public.recalc_profile_rating(uid);
  end loop;
end $$;
