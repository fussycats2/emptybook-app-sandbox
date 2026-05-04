-- ============================================================
-- transactions 상태 머신 강제
-- ------------------------------------------------------------
-- 확정 정책 (옵션 A-1 / B-권장 / C-1 / D-1)
--   허용 전이:   PAID → COMPLETED   (단 buyer 만)
--   금지:        CANCELED 로의 직접 전이 (사용자 직접 취소 불가)
--   금지:        COMPLETED / CANCELED 이후 어떤 변경도 (종결 상태)
--   기존 INSERT: status='PAID' 로 시작 (createOrder 의 현 흐름)
--
-- 강제 방식
--   - INSERT: RLS 의 with check 로 status='PAID' 강제
--   - UPDATE: BEFORE UPDATE 트리거에서 OLD/NEW 와 auth.uid() 검증
--
-- 운영 우회
--   취소/환불이 필요하면 SECURITY DEFINER 함수(추후 admin_*)로 별도 RPC 를 만든다.
--   본 트리거는 클라이언트의 직접 UPDATE 만 차단한다.
-- ============================================================

-- INSERT 정책 — status='PAID' 만 허용
drop policy if exists "tx_insert_buyer" on public.transactions;
create policy "tx_insert_buyer" on public.transactions for insert
  with check (
    auth.uid() = buyer_id
    and status = 'PAID'
  );

-- UPDATE 정책 — buyer/seller 만 행을 수정 대상으로 볼 수 있고, 그 자체로는 status 검증 X
-- (실제 전이 검증은 아래 BEFORE UPDATE 트리거에서)
drop policy if exists "tx_update_party" on public.transactions;
create policy "tx_update_party" on public.transactions for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- BEFORE UPDATE 트리거 — FSM 강제
create or replace function public.enforce_transaction_status()
returns trigger
language plpgsql
as $$
begin
  -- status 가 변하지 않은 UPDATE 는 통과 (다른 컬럼만 수정한 경우)
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- 이미 종결된 거래(COMPLETED/CANCELED) 의 status 변경 금지
  if old.status in ('COMPLETED', 'CANCELED') then
    raise exception 'transaction is already finalized (status=%)', old.status
      using errcode = '22023';
  end if;

  -- 허용 전이: PAID -> COMPLETED, buyer 만
  if old.status = 'PAID' and new.status = 'COMPLETED' then
    if auth.uid() <> new.buyer_id then
      raise exception 'only buyer can confirm a transaction'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- 그 외 모든 전이 거부 (CANCELED 직행 포함)
  raise exception 'transaction status transition % -> % is not allowed',
    old.status, new.status using errcode = '22023';
end;
$$;

drop trigger if exists transactions_enforce_status on public.transactions;
create trigger transactions_enforce_status
before update on public.transactions
for each row execute procedure public.enforce_transaction_status();
