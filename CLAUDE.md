# EmptyBook (책장비움) — Claude 참고 문서

> 최종 업데이트: 2026-04-28

## 프로젝트 개요

중고 도서 거래 모바일 웹 플랫폼. 책장의 책을 이웃과 사고파는 당근마켓 스타일 앱.

- **기술 스택**: Next.js 14 (App Router, TypeScript) · MUI 6 · Supabase · Vercel
- **디자인**: "도서관 그린" 테마 (`primary: #1F6F4E`), Pretendard Variable
- **레이아웃**: 모바일 퍼스트 + 데스크톱 어댑티브 (좌측 브랜드 패널 + 우측 420px 앱 카드)

자세한 기획은 [`개발기획서.md`](./개발기획서.md), 사용법은 [`README.md`](./README.md), DB 구조는 [`ERD.md`](./ERD.md), 최근 UI·코드 점검 이력은 [`디자인점검노트.md`](./디자인점검노트.md) 참고.

---

## 현재 구현 상태 (2026-04-28 기준)

### 완료된 것

| 영역 | 내용 |
|------|------|
| **라우트 구조** | 20+α 화면 라우트 (`app/` 하위) — 마이페이지 하위에 `/mypage/selling`, `/mypage/likes` 추가 |
| **공용 UI 컴포넌트** | `components/ui/` 전체 (PhoneFrame, AppHeader, BottomTabNav, BookCard, BookImage, ImageCarousel, BottomSheet, ConfirmDialog, StatusBadge, MannerTemperature, LikeButton, LocationChip, Fab, EmptyState, Skeleton, ToastProvider, Section, ImgPlaceholder). 전 컴포넌트에 한글 주석 추가 완료 |
| **MUI 테마** | `lib/theme.ts` 완성 — 색상 토큰, 라운드 스케일, 그림자 토큰 |
| **Mock 데이터 계층** | `lib/mockData.ts` + `lib/repo.ts` — Supabase 없이도 전 화면 동작. likes/reviews 인메모리 저장 포함 |
| **DB 스키마** | `0001_init.sql` 전체 + `0002_books_cover_url.sql` (cover_url 컬럼) + `0003_review_rating_trigger.sql` (reviews → profiles.rating_avg/trade_count 자동 갱신). RLS·Realtime·Storage 포함 |
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

### 미완성 / 연결 안 된 것

| 항목 | 상태 | 비고 |
|------|------|------|
| **사용자 실물 사진 업로드** | 미연동 | Storage 버킷 스키마는 있으나 업로드 UI/로직 없음. 표지(cover_url)와는 별개 |
| **OAuth 로그인** | 미연동 | 카카오/네이버/Apple 버튼만 있음 (토스트로 "준비중") |
| **이메일 인증 플로우** | 부분 | 가입 시 `data.session` 없으면 `/login`으로 안내. Supabase 대시보드 "Confirm email" 정책 확정 필요 |
| **채팅 Realtime** | UI만 완성 | Supabase Realtime 구독 훅 없음, 메시지 송수신 로직 없음 |
| **결제 PG** | Mock UI | 실제 PG 연동 없음, 트랜잭션은 PAID로 즉시 기록 |
| **알림 푸시** | 없음 | 푸시 알림 Edge Functions 미작성. 단건/모두 읽음 서버 반영은 완료 |
| **프로필 수정** | UI만 | `/mypage/settings` 저장 로직 없음. 알림/개인정보 토글도 클라이언트만 |
| **최근 본 상품** | 진입점만 | view-history 추적 없음. 마이페이지 STATS "최근 본" + SECTIONS 메뉴 모두 "준비중" 처리 |
| **쿠폰 / 공지 / 문의 / 약관** | 진입점만 | 마이페이지 SECTIONS 에 "준비중" 칩으로 노출. 정적 페이지/시스템 미구현 |
| **fetchChat** | Mock 고정 | `lib/repo.ts` — 항상 mock 반환. 메시지 INSERT/Realtime 미연동 |
| **카테고리 입력** | 하드코딩 | 등록 시 무조건 "소설". 네이버 카테고리 → 우리 8개 매핑 미구현 |

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
  mypage/selling/page.tsx         # /mypage/selling — 내가 등록한 책 (신규)
  mypage/likes/page.tsx           # /mypage/likes — 찜한 책 (신규)
  mypage/settings/page.tsx        # /mypage/settings
  notifications/page.tsx          # /notifications

components/
  ui/                             # 공용 UI (상단 표 참고)
  search/FilterSheet.tsx          # 검색 필터 BottomSheet

lib/
  theme.ts                        # MUI 테마 + 색상 토큰
  mockData.ts                     # 더미 데이터 + in-memory store (likes/reviews 포함)
  repo.ts                         # 데이터 계층 — Supabase/Mock 자동 분기
  auth/
    AuthProvider.tsx              # 클라이언트 user/session Context + useAuth() 훅
  supabase/
    client.ts                     # 브라우저 클라이언트
    server.ts                     # RSC 서버 클라이언트
    middleware.ts                 # SSR 쿠키 갱신 + getUser 헬퍼
    types.ts                      # DB row 타입 정의

middleware.ts                     # 보호 라우트 가드 + 인증 페이지 리다이렉트

supabase/migrations/
  0001_init.sql                   # 전체 스키마 + RLS + Realtime + Storage
  0002_books_cover_url.sql        # books.cover_url 컬럼 추가
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
| `listOrders()` | 주문 내역 — buyer/seller 양쪽 join 후 `side: "buy" \| "sell"` 채움 |
| `fetchOrder(id)` | 주문 상세 |
| `createOrder({ bookId })` | 결제 시점 호출 |
| `completeOrder(id)` | 거래 확정 |
| `listChats()` | 채팅 목록 |
| `fetchChat(id)` | 채팅 상세 (현재 mock 고정) |
| `listNotifications()` | 알림 |
| `isLiked(bookId)` / `listLikedBookIds()` / `listLikedBooks()` / `toggleLike(bookId)` | 찜 |
| `fetchReviewContext(transactionId)` / `createReview(input)` | 후기 작성 컨텍스트 + 저장 |
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

1. **이미지 업로드** — Storage `book-images` 버킷에 업로드 후 `book_images` insert (등록 폼)
2. **채팅 Realtime 훅** — `useRealtimeChat(roomId)` + `fetchChat` 실데이터 + 메시지 송신 `repo.ts` 함수
3. **프로필 수정** — `/mypage/settings` 저장 로직 + 알림/개인정보 토글 서버 반영
4. **알림 푸시** — Supabase Edge Functions 로 푸시 발송 (단건/모두 읽음 서버 반영은 완료)
5. **결제 PG 연동** — 현재 Mock UI를 토스/카카오페이 등으로 교체
6. **카테고리 매핑** — 네이버 검색 결과 카테고리 → 우리 8개 카테고리 매핑 (현재 등록은 "소설" 고정)

---

## 개발 환경 실행

```bash
npm install
cp .env.local.example .env.local  # Supabase 키 선택 입력 (없으면 mock으로 동작)
npm run dev                         # http://localhost:3000
npm run wireframe                   # 와이어프레임 HTML (http://127.0.0.1:4173)
```
