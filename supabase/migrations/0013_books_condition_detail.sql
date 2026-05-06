-- 0013_books_condition_detail.sql
-- 도서 상태 상세 체크리스트 — 분쟁 발생 시 객관적 근거가 되도록 항목별 체크 결과를 보관.
--
-- 데이터 형태(`condition_detail`):
--   {
--     "cover":  { "fold": true, "scratch": true, "discolor": false },   // 표지
--     "spine":  { "bend": true, "fade": false },                          // 책등
--     "corner": { "wear": true },                                          // 모서리
--     "body":   { "pen": false, "highlight": false, "stain": false,
--                 "missing": false },                                      // 본문
--     "extras": { "band_missing": true, "postcard_missing": false,
--                 "cd_missing": false }                                    // 부속(띠지/엽서/CD)
--   }
--
-- 등급(`books.state`) 은 별도 컬럼이고, 클라이언트의 `lib/conditionGrade.ts` 가
-- `inferGrade(condition_detail)` 로 추정해 사용자에게 자동 추천하면 사용자가 최종 결정한
-- 값을 books.state 에 저장한다. 두 컬럼을 분리해 둔 이유는 추정 규칙이 바뀌어도
-- 과거 데이터의 판매자 의도(state) 는 보존되도록.
--
-- NULL 허용 — 기존 등록 데이터 / 사용자가 상세 체크를 건너뛴 경우.

alter table public.books
  add column if not exists condition_detail jsonb;

-- 인덱스는 두지 않음 — 본 컬럼은 조회 / 정렬 / 필터 키가 아니라 표시용 부속 정보.
