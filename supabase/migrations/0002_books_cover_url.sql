-- 표지 이미지 URL — 네이버 도서 검색 등 외부에서 가져온 공식 표지를 보관
-- 사용자 실물 사진(book_images)과는 별개. 카드/상세에서 placeholder 대용으로 사용한다.
alter table public.books
  add column if not exists cover_url text;
