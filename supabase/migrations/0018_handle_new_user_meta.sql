-- 0018_handle_new_user_meta.sql
-- handle_new_user() 트리거가 raw_user_meta_data 에서 phone / preferred_genres 까지 가져가도록 확장.
--
-- 배경: 기존 트리거는 display_name 만 채웠고 phone / preferred_genres 는 /signup 의 후속
-- profiles.update(...) 가 채웠다. 그런데 Supabase Auth "Confirm email" 이 ON 이면 가입 직후
-- 클라이언트에 세션이 없어 익명 상태로 UPDATE 가 호출되고 profiles_update_own 정책이 막아
-- silent 로 데이터가 누락됐다 (phone 빈 칸, 추천 장르가 기본값 "소설" 로 떨어짐).
--
-- 해결: 트리거(SECURITY DEFINER) 가 단일 출처로 모든 메타를 채운다. /signup 이 options.data 에
-- name / phone / preferred_genres 를 함께 담아 보내면 트리거가 전부 흡수.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, phone, preferred_genres)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_user_meta_data ? 'preferred_genres'
        and jsonb_typeof(new.raw_user_meta_data->'preferred_genres') = 'array'
      then array(select jsonb_array_elements_text(new.raw_user_meta_data->'preferred_genres'))
      else '{}'::text[]
    end
  );
  return new;
end $$;
