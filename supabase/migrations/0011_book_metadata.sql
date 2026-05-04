-- 0011_book_metadata.sql
-- 네이버 도서 검색 API 에서 받아오는 추가 메타데이터를 저장하기 위한 컬럼들.
-- - synopsis    : 책 줄거리/소개 (네이버 description). books.description(=사용자 코멘트) 와 분리.
-- - pub_date    : 발행일 (YYYY-MM-DD). 네이버 pubdate(YYYYMMDD) 를 정규화해 저장.
-- - source_url  : 외부 정보 출처 URL — 보통 네이버 도서 상세 페이지 링크.
--
-- 기존 컬럼은 그대로 활용:
-- - original_price : 정가 (이미 0001 에 있음)
-- - description    : 사용자 코멘트 (이미 0001 에 있음, "유의사항/판매자 한 마디")

alter table public.books
  add column if not exists synopsis   text,
  add column if not exists pub_date   date,
  add column if not exists source_url text;

-- (선택) 발행일로 정렬/필터할 일이 잦으면 인덱스 — 지금은 도서 상세 표시용으로만 쓰므로 스킵
