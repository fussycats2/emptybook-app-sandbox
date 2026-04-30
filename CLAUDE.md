# EmptyBook (책장비움) — Claude 참고 문서

> 최종 업데이트: 2026-04-30

## 프로젝트 개요

중고 도서 거래 모바일 웹 플랫폼. 책장의 책을 이웃과 사고파는 당근마켓 스타일 앱.

- **기술 스택**: Next.js 14 (App Router, TypeScript) · MUI 6 · Supabase · Vercel
- **디자인**: "도서관 그린" 테마 (`primary: #1F6F4E`), Pretendard Variable
- **레이아웃**: 모바일 퍼스트 + 데스크톱 어댑티브 (좌측 브랜드 패널 + 우측 420px 앱 카드)

자세한 기획은 [`개발기획서.md`](./개발기획서.md), 사용법은 [`README.md`](./README.md), DB 구조는 [`ERD.md`](./ERD.md), 최근 UI·코드 점검 이력은 [`디자인점검노트.md`](./디자인점검노트.md) 참고.

---

## 현재 구현 상태 (2026-04-30 기준)

### 완료된 것

| 영역 | 내용 |
|------|------|
| **라우트 구조** | 20+α 화면 라우트 (`app/` 하위) — 마이페이지 하위에 `/mypage/selling`, `/mypage/likes` 추가 |
| **공용 UI 컴포넌트** | `components/ui/` 전체 (PhoneFrame, AppHeader, BottomTabNav, BookCard, BookImage, ImageCarousel, BottomSheet, ConfirmDialog, StatusBadge, MannerTemperature, LikeButton, LocationChip, Fab, EmptyState, Skeleton, ToastProvider, Section, ImgPlaceholder). 전 컴포넌트에 한글 주석 추가 완료 |
| **MUI 테마** | `lib/theme.ts` 완성 — 색상 토큰, 라운드 스케일, 그림자 토큰 |
| **Mock 데이터 계층** | `lib/mockData.ts` + `lib/repo.ts` — Supabase 없이도 전 화면 동작. likes/reviews 인메모리 저장 포함 |
| **DB 스키마** | `0001_init.sql` 전체 + `0002_books_cover_url.sql` + `0003_review_rating_trigger.sql` + `0004_profiles_app_prefs.sql` + `0005_likes_count_trigger.sql` + `0006_notification_triggers.sql`. RLS·Realtime·Storage 포함. ERD 와 트리거 상세는 [`ERD.md`](./ERD.md) |
| **화면 UI** | 20개 화면 UI 골격 + 마이페이지 판매내역/찜한 책 화면 |
| **거래 흐름 화면** | 도서 상세 → 결제 → 구매완료 → 거래확정 → 후기 작성 흐름 화면 |
| **Supabase Auth** | 이메일/비번 로그인·회원가입·로그아웃, `AuthProvider` + `useAuth()` 훅 |
| **인증 가드** | `middleware.ts` — 액션 라우트(`/register`, `/checkout`, `/orders`, `/chat`, `/mypage`, `/notifications`)만 보호. `/home`, `/search`, `/books`는 게스트 허용 |
| **찜(좋아요) API** | `toggleLike` / `isLiked` / `listLikedBookIds` / `listLikedBooks` 완성. LikeButton 자체 토글 + 도서 상세 카운트 즉시 동기화. 마이페이지 STATS "찜" 카운트도 실데이터 |
| **후기 저장** | `createReview` / `fetchReviewContext`. 거래 컨텍스트(상대방 자동 결정) + UNIQUE 위반 시 `alreadyExists` 분기. 작성 화면 잠금 처리까지 |
| **네이버 도서 검색 API** | `app/api/books/search/route.ts` Route Handler. ISBN/키워드 자동 분기. 등록 폼에서 검색 → 결과 선택 → 폼 자동 채움 |
| **표지 이미지(cover_url)** | `books.cover_url` 컬럼 + 카드/상세 캐러셀 첫 슬라이드에 표시. 등록 시 네이버 검색 결과 이미지가 자동 저장 |
| **판매 취소 / 삭제** | `cancelBook` (status→HIDDEN) / `deleteBook` (영구 삭제, RESTRICT 막히면 자동 cancel 폴백). 도서 상세에서 본인 책일 때 MoreVert → BottomSheet(수정/판매취소/삭제) + ConfirmDialog |
| **isMine 판별** | `BookDetail.sellerId` 노출 → 도서 상세에서 `auth.uid === sellerId` 비교 (mock 모드에서는 `seller === "나"` 폴백) |
| **거래 내역 buy/sell 탭** | `listOrders` 가 `transactions` + 양쪽 profiles join → `side: "buy" \| "sell"` 채움. `/mypage/orders` 상단 구매/판매 탭으로 필터, sell 측에선 "거래 확정" 버튼 숨김 |
| **마이페이지 화면** | `/mypage/selling` (내 책 + 상태 칩 필터), `/mypage/likes` (찜한 책 그리드), `/mypage/reviews` (받은 후기 — 평균 별점 + 카드 리스트). STATS 4종 중 판매중·구매내역·찜은 `listMyBooks`/`listOrders`/`listLikedBookIds` 실데이터, "최근 본"은 placeholder |
| **받은 후기 화면** | `/mypage/reviews` — `listReceivedReviews` (reviews ⨝ reviewer profile ⨝ transactions ⨝ books). 평균 별점/후기수 요약 + 카드 리스트. 마이페이지 SECTIONS "받은 후기" 메뉴 연결 |
| **알림 읽음 서버 반영** | `markNotificationRead(id)` / `markAllNotificationsRead()` — `/notifications` 단건 클릭/모두 읽음 버튼에서 fire-and-forget 으로 `read_at` UPDATE |
| **profiles.rating_avg 트리거** | `0003_review_rating_trigger.sql` — reviews INSERT/UPDATE/DELETE 시 reviewee의 `rating_avg`(소수 둘째자리)와 `trade_count` 자동 재계산. 마이그레이션 시점에 기존 행 1회 일괄 동기화 |
| **카테고리 자동 추정** | `lib/categoryMap.ts` `inferCategory(text)` — 키워드 휴리스틱(만화/아동/경제·경영/자기계발/역사/과학/에세이/소설). 등록 폼에서 네이버 검색 결과 선택 시 제목+설명으로 추정해 chip 자동 선택 (사용자 직접 변경 가능) |
| **프로필 수정** | `/mypage/settings` — 프로필 정보(표시이름/사용자명/전화번호) UPDATE + 알림/개인정보 토글 즉시 `app_prefs` 반영. `getMyProfile`/`updateMyProfile`/`updateAppPrefs` repo |
| **채팅 Realtime** | `lib/realtime/useRealtimeChat(roomId)` 훅 — `listMessages` 초기 로드 + Supabase Realtime `messages` INSERT 구독 + `sendMessage` (INSERT + chat_rooms.last_message 동기화). dedupe by id. `/chat/[id]` 연동 + 자동 스크롤. Strict Mode 안전(채널 topic 에 random suffix). mock 모드는 in-memory store |
| **채팅방 자동 생성** | `getOrCreateChatRoom(bookId)` — 도서 상세/결제완료/주문 내역 "채팅" 버튼이 (book, 나, seller) 조합 chat_rooms 행을 조회·없으면 INSERT. UNIQUE race(23505) 시 재조회. 본인 책이면 `error: "self"`. mock 모드는 `mockGetOrCreateChatRoomByBook` |
| **mock id UUID 가드** | `isUuid()` 헬퍼 — `fetchChat`/`listMessages`/`sendMessage`/`useRealtimeChat`/`getOrCreateChatRoom` 모두 비-UUID id 면 Supabase 호출 스킵하고 mock 저장소로 라우팅. mock 시드 채팅(c-1 등)이 RLS/FK 에러를 내지 않게 함 |
| **로그인 진입 흐름** | 스플래시 "카카오로 시작" → 카카오 OAuth(미구현 → 토스트), "이메일로 로그인" → /login. /login 은 이메일 폼이 메인, SNS 버튼은 하단 보조. 이미 로그인된 상태로 스플래시 로그인 버튼 누르면 자동 signOut 후 /login 진입(middleware 자동 리다이렉트 우회) |
| **한글 IME Enter 가드** | `/chat/[id]`/`/login`/`/register`/`/search` 의 Enter 키 핸들러에 `e.nativeEvent.isComposing` 검사 추가 — 한글 조합 중 Enter(=글자 확정)에서 폼이 폭주하지 않게 함 |
| **사용자 사진 업로드** | `/register` — `<input type=file accept=image/* multiple>` + blob 미리보기. `uploadBookImages(bookId, files, { setCoverIfMissing })` 가 Storage `book-images` 버킷에 업로드 후 `book_images` INSERT. 네이버 표지를 안 골랐으면 첫 사진을 `books.cover_url` 로 채움. `fetchBook` 이 `book_images` join → public URL 배열을 `imageUrls` 로 반환, `ImageCarousel` 이 슬라이드별로 표시 (개수 동적). 단일 8MB 한도 |
| **메시지 읽음 처리** | `markRoomMessagesRead(roomId)` — 상대 메시지 중 `read_at IS NULL` 인 것을 일괄 UPDATE (idempotent). `/chat/[id]` 진입 직후 + 새 메시지 도착 시마다 호출, 갱신된 행 있으면 chat 목록 캐시 invalidate. `listChats` 가 두 번째 쿼리로 room_id 별 unread 집계 → 카드 배지/볼드 표기 |
| **채팅 목록 Realtime** | `lib/realtime/useRealtimeChatList` — 내가 buyer·seller 인 `chat_rooms` INSERT/UPDATE + `messages` INSERT 이벤트를 구독해 `listChats` 캐시를 invalidate. `AppBootstrap` 에서 전역 1회 마운트 — `/chat` 페이지가 닫혀 있어도 다음 진입 시 최신 상태. postgres_changes 가 OR/!= 필터를 못 해서 buyer/seller 두 채널 분리, mount 마다 random topic suffix(Strict Mode 안전) |
| **알림 Realtime** | `lib/realtime/useRealtimeNotifications` — `notifications` INSERT/UPDATE(`user_id=eq.me`) 구독 → 알림 목록 캐시 invalidate. `AppBootstrap` 마운트. 0006 트리거가 메시지/거래/후기 이벤트마다 `notifications` 행을 자동 INSERT 하므로 이 훅 하나로 전 도메인 알림이 실시간 반영. `useNotifications` 가 결과를 그리고 `notificationsStore` 의 unread 카운트도 자동 갱신 |
| **알림 자동 생성 트리거** | `0006_notification_triggers.sql` — `messages` INSERT(상대), `transactions` INSERT(판매자, kind=TX_NEW)/UPDATE→COMPLETED(양쪽, kind=TX_COMPLETED), `reviews` INSERT(reviewee, kind=REVIEW). 모두 SECURITY DEFINER 로 RLS 우회. payload 는 `{ title, body, ...domain_ids }` 형태로 화면이 그대로 그림 |
| **likes 카운트 트리거** | `0005_likes_count_trigger.sql` — `likes` INSERT/DELETE 시 `books.like_count` ±1 (SECURITY DEFINER). 클라이언트는 더 이상 `books` 를 직접 UPDATE 하지 않음. 마이그레이션 시점 1회 일괄 동기화 |
| **최근 본 상품** | `lib/store/recentlyViewedStore` — Zustand + localStorage persist (max 30, move-to-front, name `emptybook:recently-viewed`). `/books/[id]` 진입 시 `book.id` 로 push. `lib/repo.listBooksByIds(ids)` + `useBooksByIds(ids)` 가 입력 순서를 그대로 유지하며 Supabase/mock 양쪽에서 책을 가져옴. `/mypage/recent` 가 그리드로 표시 + "전체 삭제" 액션 + 사라진 책(HIDDEN/삭제) 은 결과에서 빠짐 + store 의 stale id 도 자동 정리. 마이페이지 STATS "최근 본" 도 store 길이 실시간 표시 |
| **정적 페이지** | `lib/staticContent.ts` (NOTICES / TERMS_SECTIONS / SUPPORT_INFO) + `/notices` 목록 + `/notices/[id]` 상세 + `/terms` 약관 + `/help` 1:1 문의(폼 → mailto: 메일 앱 호출) + `/mypage/coupons` 쿠폰함(빈 상태 안내). 마이페이지 SECTIONS 의 "준비중" 칩 4종을 모두 실링크로 교체 |

### 미완성 / 연결 안 된 것

| 항목 | 상태 | 비고 |
|------|------|------|
| **OAuth 로그인** | 미연동 | 카카오/네이버/Apple 버튼만 있음 (토스트로 "준비중") |
| **이메일 인증 플로우** | 부분 | 가입 시 `data.session` 없으면 `/login`으로 안내. Supabase 대시보드 "Confirm email" 정책 확정 필요 |
| **결제 PG** | Mock UI | 실제 PG 연동 없음, 트랜잭션은 PAID로 즉시 기록 |
| **알림 푸시(Push)** | 없음 | 인앱 알림은 트리거+Realtime 으로 완성. 디바이스 푸시(FCM/Web Push)는 Edge Functions 미작성 |
| **쿠폰 / 공지 / 문의 / 약관** | 정적 페이지 | UI 는 모두 연결됨. 쿠폰 발급·사용 시스템 + 공지 CMS 는 미구현 (현재 staticContent.ts 의 더미 데이터) |

---

## 파일 구조

```
app/                              # 화면 라우트
  page.tsx                        # 스플래시/온보딩 (/)
  layout.tsx                      # 루트 레이아웃 (ThemeProvider, ToastProvider)
  providers.tsx                   # 클라이언트 Provider 래퍼
  api/books/search/route.ts       # 네이버 도서 검색 프록시 (서버)
  login/page.tsx                  # /login
  signup/page.tsx                 # /signup
  home/page.tsx                   # /home — 홈 피드
  search/page.tsx                 # /search
  search/filter/page.tsx          # /search/filter
  books/[id]/page.tsx             # /books/[id] — 도서 상세
  books/[id]/offer/               # 가격제안 (폐기됨, /books/[id]로 redirect)
  register/page.tsx               # /register — 도서 등록 (네이버 검색 연동)
  register/complete/              # /register/complete
  checkout/[id]/page.tsx          # /checkout/[id] — 결제
  checkout/[id]/complete/         # /checkout/[id]/complete
  orders/[id]/page.tsx            # /orders/[id] — 거래 확정
  orders/[id]/review/             # /orders/[id]/review — 후기 (저장 연동)
  chat/page.tsx                   # /chat — 채팅 목록
  chat/[id]/page.tsx              # /chat/[id] — 채팅 상세
  mypage/page.tsx                 # /mypage
  mypage/orders/page.tsx          # /mypage/orders — 거래 트랜잭션 내역
  mypage/selling/page.tsx         # /mypage/selling — 내가 등록한 책
  mypage/likes/page.tsx           # /mypage/likes — 찜한 책
  mypage/recent/page.tsx          # /mypage/recent — 최근 본 책 (localStorage 기반)
  mypage/reviews/page.tsx         # /mypage/reviews — 받은 후기
  mypage/settings/page.tsx        # /mypage/settings — 프로필/알림/개인정보
  mypage/coupons/page.tsx         # /mypage/coupons — 쿠폰함 (빈 상태)
  notifications/page.tsx          # /notifications
  notices/page.tsx                # /notices — 공지사항 목록
  notices/[id]/page.tsx           # /notices/[id] — 공지사항 상세
  help/page.tsx                   # /help — 1:1 문의 (mailto)
  terms/page.tsx                  # /terms — 이용 약관

components/
  ui/                             # 공용 UI (상단 표 참고)
  search/FilterSheet.tsx          # 검색 필터 BottomSheet

lib/
  theme.ts                        # MUI 테마 + 색상 토큰
  mockData.ts                     # 더미 데이터 + in-memory store (likes/reviews/messages/profile)
  repo.ts                         # 데이터 계층 — Supabase/Mock 자동 분기
  categoryMap.ts                  # 제목/설명 → 8개 카테고리 추정 휴리스틱
  staticContent.ts                # 공지/약관/지원 안내 — 정적 컨텐츠
  auth/
    AuthProvider.tsx              # 클라이언트 user/session Context + useAuth() 훅
  realtime/
    useRealtimeChat.ts            # 채팅방 메시지 Realtime 구독 + 송신 훅
    useRealtimeChatList.ts        # 채팅 목록 Realtime — chat_rooms / messages 변경 시 캐시 invalidate
    useRealtimeNotifications.ts   # 알림 목록 Realtime — notifications INSERT/UPDATE 구독
  supabase/
    client.ts                     # 브라우저 클라이언트
    server.ts                     # RSC 서버 클라이언트
    middleware.ts                 # SSR 쿠키 갱신 + getUser 헬퍼
    types.ts                      # DB row 타입 + AppPrefs/DEFAULT_APP_PREFS

middleware.ts                     # 보호 라우트 가드 + 인증 페이지 리다이렉트

supabase/migrations/
  0001_init.sql                       # 전체 스키마 + RLS + Realtime + Storage
  0002_books_cover_url.sql            # books.cover_url 컬럼
  0003_review_rating_trigger.sql      # reviews → profiles.rating_avg/trade_count 자동 갱신
  0004_profiles_app_prefs.sql         # profiles.app_prefs jsonb 컬럼
  0005_likes_count_trigger.sql        # likes → books.like_count 자동 갱신 (RLS 우회)
  0006_notification_triggers.sql      # messages/transactions/reviews → notifications 자동 INSERT
```

---

## 데이터 계층 규칙

**페이지에서 `lib/mockData.ts`를 직접 import 하지 않는다.** 모든 데이터 접근은 `lib/repo.ts`를 통해서만.

`repo.ts` 자동 분기 규칙:
1. `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 + 클라이언트 정상 → Supabase
2. 환경변수 미설정 / 인증 없음 / 쿼리 결과 없음 → mock store 자동 폴백

| 함수 | 설명 |
|------|------|
| `listRecentBooks(limit?)` | 홈 피드 |
| `searchBooks({ q?, category?, state? })` | 검색 |
| `fetchBook(id)` | 도서 상세 |
| `createBook(input)` | 도서 등록 (coverUrl 포함) |
| `listMyBooks()` | 내가 등록한 책 (`/mypage/selling`, 마이페이지 STATS) |
| `cancelBook(bookId)` | 판매 취소 (status → HIDDEN) |
| `deleteBook(bookId)` | 영구 삭제. 거래 이력으로 RESTRICT 막히면 호출자가 `cancelBook` 으로 폴백 |
| `listBooksByIds(ids)` | id 배열로 책 일괄 조회 — 입력 순서 유지, HIDDEN/없는 책은 자동 skip. 최근 본 상품용 |
| `uploadBookImages(bookId, files, { setCoverIfMissing })` | Storage `book-images` 업로드 + `book_images` INSERT. setCoverIfMissing 시 `books.cover_url` 비어 있으면 첫 사진 URL 로 채움. mock/비로그인이면 no-op |
| `listOrders()` | 주문 내역 — buyer/seller 양쪽 join 후 `side: "buy" \| "sell"` 채움 |
| `fetchOrder(id)` | 주문 상세 |
| `createOrder({ bookId })` | 결제 시점 호출 |
| `completeOrder(id)` | 거래 확정 |
| `listChats()` | 채팅 목록 |
| `fetchChat(id)` | 채팅 상세 (chat_rooms + 책 + 양쪽 프로필 join, 상대방 자동 결정) |
| `getOrCreateChatRoom(bookId)` | (book, 나, seller) chat_rooms 조회·생성 → "채팅" 버튼 진입점. 본인 책이면 `error:"self"` |
| `listMessages(roomId)` / `sendMessage(roomId, body)` | 채팅 메시지 조회/전송 (전송 시 chat_rooms.last_message 동기화) |
| `markRoomMessagesRead(roomId)` | 채팅방 진입 시 상대 메시지 일괄 read_at 갱신. 갱신된 행 수 반환 (0 이면 캐시 invalidate 스킵 가능) |
| `useRealtimeChat(roomId)` *(훅)* | 초기 로드 + Realtime INSERT 구독 + send. dedupe by id, channel topic 에 random suffix (Strict Mode 안전) |
| `isUuid(s)` | UUID 형식 검사 — mock 시드 id 가 Supabase 쿼리로 흘러가지 않게 가드 |
| `listNotifications()` | 알림 |
| `markNotificationRead(id)` / `markAllNotificationsRead()` | 알림 read_at 단건/일괄 갱신 |
| `isLiked(bookId)` / `listLikedBookIds()` / `listLikedBooks()` / `toggleLike(bookId)` | 찜 |
| `fetchReviewContext(transactionId)` / `createReview(input)` | 후기 작성 컨텍스트 + 저장 |
| `listReceivedReviews(userId?)` | 받은 후기 목록 (`/mypage/reviews`) |
| `getMyProfile()` / `updateMyProfile(input)` / `updateAppPrefs(prefs)` | 내 프로필 조회/수정 + app_prefs 토글 |
| `withDefaultPrefs(prefs?)` | app_prefs 누락 키를 DEFAULT_APP_PREFS 로 채워서 반환 |
| `meta.{CATEGORIES, …}` | 정적 메타데이터 |

---

## DB 테이블 요약

| 테이블 | 핵심 컬럼 |
|--------|----------|
| `profiles` | `id(=auth.uid)`, `display_name`, `rating_avg`, `trade_count` |
| `books` | `seller_id`, `title`, `state(A_PLUS/A/B/C)`, `price`, `status(SELLING/RESERVED/SOLD/HIDDEN)`, `trade_method(DIRECT/PARCEL/BOTH)` |
| `book_images` | `book_id`, `storage_path`, `sort_order` |
| `likes` | `(user_id, book_id)` PK |
| `transactions` | `book_id`, `buyer_id`, `seller_id`, `status(OFFERED→ACCEPTED→PAID→SHIPPING→COMPLETED/CANCELED)` |
| `payments` | `transaction_id(1:1)`, `method`, `amount` |
| `reviews` | `transaction_id(1:1)`, `reviewer_id`, `reviewee_id`, `rating(1-5)`, `tags[]` |
| `chat_rooms` | `book_id`, `buyer_id`, `seller_id`, `last_message_at` |
| `messages` | `room_id`, `sender_id`, `body`, `type`, `read_at` |
| `notifications` | `user_id`, `kind`, `payload(jsonb)`, `read_at` |

Realtime 구독: `messages`, `chat_rooms`, `notifications`  
Storage 버킷: `book-images` (public read, 인증된 사용자 upload)

---

## 다음 개발 단계 우선순위

> 남은 항목은 모두 외부 키/계약/콘솔 작업이 필요한 통합 작업이다.

1. **푸시 알림(디바이스)** — 인앱(Realtime) 은 완성. FCM/Web Push 발송용 Edge Function + service worker
2. **결제 PG 연동** — 현재 Mock UI를 토스/카카오페이 등으로 교체
3. **OAuth 로그인** — 카카오/네이버/Apple 실연동 (현재는 토스트로 "준비중")
4. **쿠폰 시스템** — `user_coupons` 테이블 + 발급/사용 플로우. 현재 `/mypage/coupons` 는 빈 상태 안내만

---

## 개발 환경 실행

```bash
npm install
cp .env.local.example .env.local  # Supabase 키 선택 입력 (없으면 mock으로 동작)
npm run dev                         # http://localhost:3000
npm run wireframe                   # 와이어프레임 HTML (http://127.0.0.1:4173)
```
