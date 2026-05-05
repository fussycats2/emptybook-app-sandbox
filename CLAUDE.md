# EmptyBook (책장비움) — Claude 참고 문서

> 최종 업데이트: 2026-05-05 (v8.1 — 채팅 unread 뱃지 / 홈 찜 카운트 즉시 반영 픽스)

## 프로젝트 개요

중고 도서 거래 모바일 웹 플랫폼. 책장의 책을 이웃과 사고파는 당근마켓 스타일 앱.

- **기술 스택**: Next.js 14 (App Router, TypeScript) · MUI 6 · Supabase · Vercel
- **디자인**: "라이브러리 / 매거진" 톤 (`primary: #2D5F4A` deep sage, bg `#F7F4ED` warm cream, accent `#D9695A` terracotta), Pretendard Variable
- **레이아웃**: 모바일 퍼스트 + 데스크톱 어댑티브 (좌측 브랜드 패널 + 우측 420px 앱 카드)

자세한 기획은 [`개발기획서.md`](./개발기획서.md), 사용법은 [`README.md`](./README.md), DB 구조는 [`ERD.md`](./ERD.md), 최근 UI·코드 점검 이력은 [`디자인점검노트.md`](./디자인점검노트.md) 참고.

---

## 현재 구현 상태 (2026-05-05 기준)

### 완료된 것

| 영역 | 내용 |
|------|------|
| **라우트 구조** | 20+α 화면 라우트 (`app/` 하위) — 마이페이지 하위에 `/mypage/selling`, `/mypage/likes` 추가 |
| **공용 UI 컴포넌트** | `components/ui/` 전체 (PhoneFrame, AppHeader, BottomTabNav, BookCard, BookImage, ImageCarousel, BottomSheet, ConfirmDialog, StatusBadge, MannerTemperature, LikeButton, LocationChip, Fab, EmptyState, Skeleton, ToastProvider, Section, ImgPlaceholder). 전 컴포넌트에 한글 주석 추가 완료 |
| **MUI 테마** | `lib/theme.ts` 완성 — 색상 토큰, 라운드 스케일, 그림자 토큰 |
| **Mock 데이터 계층** | `lib/mockData.ts` + `lib/repo.ts` — Supabase 없이도 전 화면 동작. likes/reviews 인메모리 저장 포함 |
| **DB 스키마** | `0001_init.sql` ~ `0008_anonymize_notification_names.sql`. RLS·Realtime·Storage 포함. ERD 와 트리거 상세는 [`ERD.md`](./ERD.md) |
| **화면 UI** | 20개 화면 UI 골격 + 마이페이지 판매내역/찜한 책 화면 |
| **거래 흐름 화면** | 도서 상세 → 결제 → 구매완료 → 거래확정 → 후기 작성 흐름 화면 |
| **Supabase Auth** | 이메일/비번 로그인·회원가입·로그아웃, `AuthProvider` + `useAuth()` 훅 |
| **OAuth 로그인 (v5)** | 카카오·구글 — Supabase 내장 Provider 로 `signInWithOAuth` + `/auth/callback` 라우트(=`exchangeCodeForSession`). 카카오는 비즈니스앱 미전환이라 `/login` 에서 disabled. 네이버 — Supabase 가 미지원이라 커스텀 구현: `/api/auth/naver/start`(state CSRF 쿠키 + 네이버 authorize 302) → `/api/auth/naver/callback`(token 교환 + nid/me 프로필 조회 + `admin.createUser` idempotent + `admin.generateLink({ type:"magiclink" })` 의 **hashed_token 을 받아 곧바로 `verifyOtp` 서버사이드 호출**, `createServerClient.setAll` 콜백으로 NextResponse 에 세션 쿠키 직접 심고 `/home` redirect). 초기 시도에서 action_link 로 redirect 했더니 Supabase verify 가 hash fragment(`#access_token=…`)로 토큰을 돌려줘 서버에서 안 보였던 문제 — 외부 hop 자체를 제거함. 네이버 email 누락 시 `naver_<id>@naver.users.emptybook.local` 합성 이메일 폴백. service_role 키는 `lib/supabase/admin.ts` 헬퍼에서만 사용 (서버 전용). 실패 시 `/login?error=oauth&provider=naver&reason=state\|config\|token\|profile\|create\|link\|verify\|service_role` 단서 부착 + 서버 콘솔에 `[naver-oauth]` 로그. 마이페이지 설정 "연동 계정" 행이 `user.app_metadata.provider` 기반으로 동적 표시 |
| **네이버 도서 메타데이터 통합 (v6, 운영 가동)** | 네이버 도서 검색 API 의 응답을 최대한 보존해 `books` 테이블에 저장: 정가(`original_price`, 0001 부터 존재), 책 줄거리(`synopsis`, 0011 신규), 발행일(`pub_date`, 0011 신규), 외부 페이지 URL(`source_url`, 0011 신규). `BookSearchItem` 에 `link` 필드 추가, `normalize()` 가 그대로 보존. `createBook` 인자 + INSERT 가 새 4개 필드(originalPriceNumber/synopsis/pubDate/sourceUrl) 받음. `rowToDetail` 에서 정가>판매가 일 때 할인율 자동 계산해 `discount` 채움(5% 미만은 노이즈라 표시 생략). **UI 반영**: ① 등록 폼 검색 결과 카드에 "정가 19,800원 · 2024-01-15 발행" 한 줄 추가 ② 도서 상세의 가격 영역 — 기존 originalPrice/discount 표시 로직이 자동 활성화 (정가에 line-through + 할인율 칩) ③ 도서 정보 섹션에 "발행일" InfoRow + 하단에 "네이버에서 자세히 보기 ↗" 외부 링크 ④ 판매자 코멘트 섹션 위에 "책 소개"(synopsis) 별도 섹션. mockCreateBook 도 새 필드 받음 |
| **아이디·비밀번호 찾기 (v5)** | `/find-account?tab=email\|password` 단일 탭 페이지 — `/login` 의 "아이디 찾기 / 비밀번호 찾기" 링크가 각 탭으로 라우팅. **이메일 찾기**: 휴대폰 번호 입력 → `POST /api/auth/find-email` 이 service_role 로 `profiles.phone` 매칭 후 `auth.users.email` 을 마스킹("ab****@gmail.com") 반환. 휴대폰 번호는 숫자만 추출해 정규화 비교. enumeration 방지를 위해 모든 실패 케이스가 동일하게 `{ found: false }` 응답. SMS OTP 본인 인증은 미구현 — 마스킹으로만 1차 보호. **비밀번호 찾기**: 이메일 입력 → `supabase.auth.resetPasswordForEmail(email, { redirectTo: /auth/callback?next=/reset-password })` → 메일 발송 후 안내 카드. 사용자가 메일 링크 클릭 → 기존 `/auth/callback` 의 PKCE 흐름 재사용 → `/reset-password` 도착, recovery 세션이 있으면 `updateUser({ password })` 로 변경 후 `/home`. 세션이 없으면 "링크 만료/오류" 안내 |
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
| **정적 페이지** | `lib/staticContent.ts` (NOTICES / TERMS_SECTIONS / PRIVACY_SECTIONS / SUPPORT_INFO) + `/notices` 목록 + `/notices/[id]` 상세 + `/terms` 약관 + `/privacy` 개인정보 처리방침 + `/help` 1:1 문의(폼 → mailto: 메일 앱 호출) + `/mypage/coupons` 쿠폰함(빈 상태 안내). 마이페이지 SECTIONS 의 "준비중" 칩 4종을 모두 실링크로 교체. v6 에서 settings 의 "비밀번호 변경" → /find-account?tab=password, "이용 약관" → /terms, "개인정보 처리방침" → /privacy 라우팅 연결 (그 전엔 모두 "준비중" 토스트였음) |
| **실명 마스킹** | 회원가입 시 입력한 실명이 그대로 `profiles.display_name` 에 저장돼 다른 사용자 화면에 노출되던 버그 픽스. `anonymizeName(name)` 헬퍼(첫 글자만 노출, 나머지는 `*`. "김민주" → "김**") 추가 + `fetchChat`/`listOrders`/`fetchOrder`/`fetchReviewContext`/`listReceivedReviews` 모두 적용. DB 트리거(`notify_on_message`/`notify_on_transaction_insert`/`notify_on_review`) 도 0008 에서 `mask_display_name(text)` SQL 함수로 마스킹 + 기존 알림 행 backfill |
| **채팅 읽음 RLS 픽스** | 0001 에 `messages` UPDATE RLS 정책이 빠져 있어 `markRoomMessagesRead` 의 read_at UPDATE 가 조용히 차단(0행 영향) → 채팅방 들어가서 읽어도 unread 배지가 안 사라지던 버그. 0007 에서 채팅방 참여자(buyer/seller) 가 `messages` UPDATE 가능하도록 정책 추가 |
| **UI 테마 리프레시 (v3)** | `lib/theme.ts` 의 `palette` / `radius` / `shadow` 토큰을 새 톤으로 일괄 교체 — primary `#1F6F4E → #2D5F4A` (sage), bg `#FAF7F2 → #F7F4ED` (warm cream), accent `#FF6B5E → #D9695A` (terracotta). 새 토큰 추가: `primaryTint`, `surfaceAlt`, `accentSoft`, `warn` / `warnSoft`, `radius.xl`, `shadow.pop`. 버튼/Input/Switch/Card 기본 hover·focus·disabled 정리. `globals.css` 의 body bg, skeleton 색도 새 라인에 맞춰 정리. 컴포넌트(`StatusBadge`, `MannerTemperature`, `BookCard`, `BookImage` 자리표시 6색, `app/notifications` 아이콘 매핑)에 박혀 있던 직접 hex 도 모두 토큰으로 치환 |
| **스플래시 페이지 리디자인 (v7)** | `app/page.tsx` — 이전 v3 의 떠다니는 책 표지 SVG 데코를 폐기하고 **천천히 흐르는 오로라 블롭 3장**(라디얼 그라데이션 + `mixBlendMode: screen`)으로 교체. 어두운 배경(`#0A1714`) 위에 mint/peach/sage 톤이 빛처럼 합성되며 14~17s 주기로 드리프트. 모바일 카드 폭(420px) 안에서도 보이도록 blob 크기 360–420px, 위치는 안쪽 당김, blur 60px. 상단 워드마크는 영문 `EmptyBook` → **한글 `책장비움`** (모바일에서 PhoneFrame 좌측 브랜드 패널이 안 보이므로 모바일 유일 브랜드 텍스트). Hero 카피는 무게 대비(200 ↔ 800)로 `책장은 비우고, / 이야기는 잇다.`(녹색 마침표) — 카드 폭에서 단어 분리되지 않게 `fontSize xs:46/sm:56` + `whiteSpace: nowrap`. 서브카피는 `당신의 책 한 권이, / 누군가의 첫 페이지가 됩니다.` — `<br />` 로 의도된 위치 줄바꿈. 미세 그레인 노이즈(opacity 0.16 + overlay) 로 평면 그라데이션 균질화 방지. 라이브 활동 칩 ("3,250명이 책장을 비우고 있어요"), 키프레임 `splashRise` / `auroraDrift1~3` / `splashPulse` (globals.css). 이전 `splashFloat` / `splashGlow` / `splashShimmer` 키프레임은 제거됨 |
| **PhoneFrame 데스크톱 패널 리프레시** | `components/ui/PhoneFrame.tsx` — 라디얼 그라데이션 배경 + 글래스 통계 박스(borders + backdrop-blur), 카드 라운드 28 → `radius.xl`, EYEBROW 키커 추가 |
| **홈 비주얼 다듬기** | 이벤트 배너의 거대 📚 이모지 제거 → 추상 라디얼/링 데코로 교체. 카테고리 칩 hover lift, 인기 판매자 카드 hover 정리. **중복되던 등록 Fab 제거** — `BottomTabNav` 가운데 + 버튼과 동일 동작이라 두 번 떠 있던 문제. 헤더 알림 Badge 의 `invisible={unreadCount === 0}` 연결 |
| **하단 탭 강조 버튼** | `components/ui/BottomTabNav.tsx` 가운데 + 버튼: 그라데이션 + `shadow.pop`, 52px 로 살짝 키움 |
| **채팅 말풍선 너비 버그 픽스** | `app/chat/[id]/page.tsx` — 상대 메시지 쪽에서 `maxWidth: "70%"` 가 wrapper Box(시간 포함)의 콘텐츠 너비 기반으로 깎이는 순환 구조였음. "안녕하세요" 같은 짧은 글이 한 글자 폭으로 깨지던 원인. wrapper 를 column Stack 으로 만들고 `maxWidth: "75%"` + `minWidth: 0` + `alignItems` 를 wrapper 로 hoist, bubble 은 `maxWidth: 100%`. mine/!mine 양쪽 통일 + `wordBreak: break-word` / `overflowWrap: anywhere` / `pre-wrap` 일관 적용 |
| **알림 → 라우팅 + 읽음 처리** | `NotificationRow` 에 `roomId` / `transactionId` / `bookId` 노출 (0006 트리거 payload key 와 매핑: `room_id` / `transaction_id` / `book_id`). `app/notifications/page.tsx` 에 `handleClick` — 종류별로 `/chat/{roomId}` · `/orders/{transactionId}` · `/books/{bookId}` · `/mypage/orders` · `/notices` 폴백 라우팅. mock seed (n-1: bookId=1, n-2: roomId=c-1, n-3: bookId=3) 도 라우팅 가능하게 채움 |
| **알림 빨간점 안 사라짐 픽스** | (1) mock 모드의 `markNotificationRead` / `markAllNotificationsRead` 가 no-op 이라 옵티미스틱 업데이트가 다음 refetch 에 덮였음 → `mockMarkNotificationRead` / `mockMarkAllNotificationsRead` 추가. (2) `AppBootstrap` 이 `useNotifications()` 를 호출하지 않아 알림 페이지에 들어가기 전엔 `notificationsStore.unreadCount` 가 0 이었음 → 부트스트랩에서 알림 목록을 hydrate 하도록 추가. (3) 홈 헤더의 `<Badge variant="dot">` 에 `invisible` 조건 누락 → 항상 켜져 있던 빨간점을 store 와 연결 |
| **로그인 페이지 정리** | `app/login/page.tsx` — 👋 이모지 제거, "WELCOME BACK" eyebrow + 위계 정리 |
| **마이페이지 디테일** | 프로필 ✓ 체크마크 → `VerifiedRoundedIcon`, 통계 카드 hover 시 `primaryTint` |
| **HIDDEN 책 일관성 픽스 (v4)** | `bookStatusToUI(status, {free})` 헬퍼 신설(`lib/repo.ts`). `rowToSummary` / `rowToDetail` / `listChats` / `fetchChat` 가 모두 같은 매핑 — DB의 HIDDEN 이 UI 의 "canceled" 로 정상 변환. 기존엔 매핑이 빠져 "selling" 으로 폴백 → 홈에선 `.neq("status","HIDDEN")` 으로 빠지지만 마이페이지·찜·채팅·도서 상세에서는 "판매중"으로 잘못 표기되던 버그. mock 폴백(`listRecentBooks` / `searchBooks` / `listBooksByIds` / `listLikedBooks`) 도 `status === "canceled"` 인 책을 공개 목록에서 제외. `mockCancelBook` 이 "sold" 위장 → "canceled" 로 정상화. `/mypage/selling` 에 "취소됨" 필터 칩 추가. `/books/[id]` 와 `/checkout/[id]` 가 취소된 책의 CTA 비활성 + 안내 라벨 ("판매 종료") |
| **거래 status PAID 매핑 (v4)** | `listOrders` / `fetchOrder` 가 DB의 PAID 도 "배송중"으로 묶음 — 결제 직후 마이페이지에서 "거래중"으로 잘못 표시되던 버그 픽스. mock 의 createOrder 가 "배송중"으로 만드는 동작과 일치 |
| **React Query 캐시 파급 보강 (v4)** | `useCancelBook` / `useDeleteBook` 가 chat 목록·찜 목록 캐시도 invalidate (이전엔 book 캐시만). `useCreateOrder` 가 chat 목록도 invalidate — 책 status 가 SOLD 로 바뀌면 채팅 목록 카드의 책 배지도 갱신돼야 함 |
| **검색 wildcard 이스케이프 (v4)** | `searchBooks` 의 ilike 입력에서 `%` / `_` / `\` 이스케이프 — "50%" 같은 입력이 모든 책에 매칭되던 잠재 버그 차단 |
| **알림 페이지 useMemo (v4)** | 종류 필터 + 안읽음 필터 결과를 useMemo 로 캐시 — 토글마다 새 배열을 만들던 부분 정리 |
| **books / profiles UPDATE WITH CHECK (v4)** | `0009_update_with_check.sql` — RLS UPDATE 정책에 `with check` 절 추가. 기존엔 USING 만 있어 셀러가 자기 책의 `seller_id` 를 다른 사용자로 변경(=양도) 가능한 형식적 빈틈이 있었음. profiles.id 도 동일. 양도 기능을 추후 도입하면 SECURITY DEFINER RPC 로 우회 |
| **transactions 상태 머신 (v4)** | `0010_transactions_fsm.sql` — BEFORE UPDATE 트리거 `enforce_transaction_status` 로 FSM 강제. 허용 전이는 **PAID → COMPLETED, buyer 만**. CANCELED 직행 / 종결 상태(COMPLETED·CANCELED) 변경 / seller 의 거래 확정 모두 RAISE EXCEPTION 으로 차단. INSERT 도 RLS 의 with check 로 `status='PAID'` 강제. `completeOrder` 가 에러 무시 → throw 로 변경, `/orders/[id]` 가 try/catch 로 실패 토스트. 환불 PG 도입 전엔 사용자가 직접 CANCELED 만들 수 없게 잠금 |
| **활성 채팅방 알림 자동 read (v4)** | `markRoomChatNotificationsRead(roomId)` repo 추가 — `payload->>room_id` 로 그 방의 MESSAGE kind 알림만 일괄 read_at 갱신. `/chat/[id]` 가 `markRoomMessagesRead` 와 병렬 호출. 사용자가 채팅방을 보고 있는 동안엔 알림 목록 빨간점이 다시 켜지지 않음. mock 동등 구현 `mockMarkRoomChatNotificationsRead`. presence 테이블이나 heartbeat 없는 단순 해법 — 추후 디바이스 푸시(FCM) 도입 시 presence 기반 옵션으로 업그레이드 가능 |
| **전 화면 모던 UI 리프레시 (v8)** | 스플래시(`app/page.tsx`) 제외 24개 페이지 + 11개 공용 컴포넌트 + theme/globals 일괄 다듬음. **토큰**: 라운드 스케일 +2~4px (xs 6 / sm 12 / md 16 / lg 20 / xl 28), 그림자 6단계 재설계 (`card`/`cardHover`/`sticky`/`raised`/`pop`/`ring`), 버튼 minHeight 48 + sizeLarge 56, contained 에 inset highlight + hover glow, input focus 시 4px primaryGlow ring, Chip outlined hover primaryTint 전환, `success`/`accentDark`/`primaryGlow` 토큰 추가. **공용**: `AppHeader`/`BottomTabNav`/`FixedFooter` 글래시(backdrop-blur 8px), 탭바 + 버튼 56px 4px 보더 + dot 인디케이터, `StatusBadge` 색상 dot, `BookCard` hover lift, `MannerTemperature` 그라데이션 막대, `EmptyState` 84px 아이콘 + 라디얼 글로우, `BottomSheet`/`ConfirmDialog` backdrop blur. **페이지**: 홈 이벤트배너 글래시 EVENT 칩 + 다중 데코, 도서상세 sticky 헤더 글래시 전환 + 가격 30px, 결제 결제수단 ring, 채팅 말풍선 18px + 송신 그라데이션, 마이페이지 프로필 그라데이션 보더 + 라디얼 글로우, 알림 unread 좌측 3px accent 줄, 로그인/가입/비번찾기 dot eyebrow + 헤드라인 30px, 후기 평균별점 hero, 등록완료/결제완료 88px scale-in + 라디얼 hero, 약관/개인정보 ARTICLE/SECTION eyebrow + 카드형. globals.css 에 `card-lift`/`fade-in-up`/`scale-in`/`text-gradient` 유틸 + 스크롤바 톤다운. 스플래시는 v7 그대로 유지 |
| **실시간 반영 지연 픽스 (v8.1)** | 두 군데서 사용자 액션이 5-10초 늦게 반영되던 체감 버그 정리. **(1) 홈 찜 카운트** — `BookFeedItem` 이 `book.likes`(서버 캐시) 만 보고 있어서, 토글 후 `likeKeys.list/ids` 만 invalidate 되고 `book.recent` 캐시는 다음 자연 refetch 까지 멈춰 있었음. 이제 `useLikesStore` 의 `counts[bookId]` 를 우선 구독하고, 첫 노출 시 `book.likes` 로 store 시드(`useEffect`) 해 `useBookLike.onMutate` 의 낙관적 +-1 가 정상 동작 → 클릭 즉시 숫자 변동. **(2) 채팅 unread 뱃지** — `app/chat/[id]/page.tsx` 의 useEffect 가 `markRoomMessagesRead`+`markRoomChatNotificationsRead` 후 invalidate 하는 구조였는데 `cancelled` 가드 때문에 사용자가 빨리 뒤로 가면 invalidate 가 스킵 + Realtime 은 `messages` UPDATE 미구독이라 `read_at` 변경으론 캐시 갱신이 절대 안 일어남. 진입 즉시 `qc.setQueryData(queryKeys.chat.list(), ...)` 로 해당 방 unread 0 직접 패치 + 알림 캐시 / `notificationsStore.setUnreadCount` 도 같이 패치 → 헤더 빨간점/방 카드 뱃지 즉시 사라짐. 백그라운드 read UPDATE 는 `cancelled` 가드 제거해 끝까지 반영 후 invalidate 로 정정 |

### 미완성 / 연결 안 된 것

| 항목 | 상태 | 비고 |
|------|------|------|
| **OAuth 로그인** | 운영 중 | 구글·네이버 정상 동작 확인됨. 카카오는 비즈니스앱 전환 전이라 `/login` 에서 disabled (KAKAO_DISABLED=true) 처리 — 비즈 인증 후 플래그만 false 로 바꾸면 즉시 활성화 |
| **이메일 인증 플로우** | 부분 | 가입 시 `data.session` 없으면 `/login`으로 안내. Supabase 대시보드 "Confirm email" 정책 확정 필요 |
| **결제 PG** | 구현 안 함 | Mock UI 만 유지 (사이드 프로젝트 단계에서는 PG 사업자 등록·심사가 비현실적). 0010 FSM 트리거는 PAID→COMPLETED 만 허용하고 CANCELED 진입을 차단. 추후 도입 시 트리거에 `PAID → CANCELED` 전이(권한 정책 포함) 추가 필요 |
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
  api/auth/naver/start/route.ts   # 네이버 OAuth 시작 — state 쿠키 + nid.naver.com/oauth2.0/authorize 302
  api/auth/naver/callback/route.ts # 네이버 OAuth 콜백 — token 교환 + admin.createUser + verifyOtp 서버사이드
  api/auth/find-email/route.ts    # 아이디 찾기 — phone → 마스킹된 email 반환 (service_role)
  auth/callback/route.ts          # Supabase OAuth(PKCE) 공통 콜백 — exchangeCodeForSession 후 next 로 redirect
  find-account/page.tsx           # /find-account — 아이디/비밀번호 찾기 탭 페이지
  reset-password/page.tsx         # /reset-password — recovery 세션에서 새 비번 설정
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
  privacy/page.tsx                # /privacy — 개인정보 처리방침

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
    admin.ts                      # service_role 클라이언트 — 서버 전용 (네이버 OAuth 콜백 등에서만 사용)
    middleware.ts                 # SSR 쿠키 갱신 + getUser 헬퍼
    types.ts                      # DB row 타입 + AppPrefs/DEFAULT_APP_PREFS

middleware.ts                     # 보호 라우트 가드 + 인증 페이지 리다이렉트

supabase/migrations/
  0001_init.sql                            # 전체 스키마 + RLS + Realtime + Storage
  0002_books_cover_url.sql                 # books.cover_url 컬럼
  0003_review_rating_trigger.sql           # reviews → profiles.rating_avg/trade_count 자동 갱신
  0004_profiles_app_prefs.sql              # profiles.app_prefs jsonb 컬럼
  0005_likes_count_trigger.sql             # likes → books.like_count 자동 갱신 (RLS 우회)
  0006_notification_triggers.sql           # messages/transactions/reviews → notifications 자동 INSERT
  0007_messages_update_policy.sql          # messages UPDATE RLS — 읽음(read_at) 처리 가능하게
  0008_anonymize_notification_names.sql    # 알림 트리거 + 기존 행 백필에서 display_name 마스킹
  0009_update_with_check.sql               # books/profiles UPDATE 정책에 with check 추가 (양도 차단)
  0010_transactions_fsm.sql                # transactions 상태 머신 (PAID→COMPLETED, buyer 만 / CANCELED 차단)
  0011_book_metadata.sql                   # books 에 synopsis/pub_date/source_url 추가 (네이버 메타데이터 통합)
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
| `cancelBook(bookId)` | 판매 취소 (status → HIDDEN). UI 에서는 "취소" 배지로 표시 |
| `deleteBook(bookId)` | 영구 삭제. 거래 이력으로 RESTRICT 막히면 호출자가 `cancelBook` 으로 폴백 |
| `listBooksByIds(ids)` | id 배열로 책 일괄 조회 — 입력 순서 유지, HIDDEN/없는 책은 자동 skip. 최근 본 상품용 |
| `bookStatusToUI(status, {free?})` | DB의 `BookStatus` + 무료나눔 여부 → UI 의 `SaleStatus` 매핑. HIDDEN → "canceled" 우선. rowToSummary/rowToDetail/listChats/fetchChat 가 전부 사용 |
| `uploadBookImages(bookId, files, { setCoverIfMissing })` | Storage `book-images` 업로드 + `book_images` INSERT. setCoverIfMissing 시 `books.cover_url` 비어 있으면 첫 사진 URL 로 채움. mock/비로그인이면 no-op |
| `listOrders()` | 주문 내역 — buyer/seller 양쪽 join 후 `side: "buy" \| "sell"` 채움 |
| `fetchOrder(id)` | 주문 상세 |
| `createOrder({ bookId })` | 결제 시점 호출 |
| `completeOrder(id)` | 거래 확정. 0010 FSM 트리거 위반 시 에러를 throw — 호출자가 try/catch 로 처리 |
| `listChats()` | 채팅 목록 |
| `fetchChat(id)` | 채팅 상세 (chat_rooms + 책 + 양쪽 프로필 join, 상대방 자동 결정) |
| `getOrCreateChatRoom(bookId)` | (book, 나, seller) chat_rooms 조회·생성 → "채팅" 버튼 진입점. 본인 책이면 `error:"self"` |
| `listMessages(roomId)` / `sendMessage(roomId, body)` | 채팅 메시지 조회/전송 (전송 시 chat_rooms.last_message 동기화) |
| `markRoomMessagesRead(roomId)` | 채팅방 진입 시 상대 메시지 일괄 read_at 갱신. 갱신된 행 수 반환 (0 이면 캐시 invalidate 스킵 가능) |
| `markRoomChatNotificationsRead(roomId)` | 그 방의 MESSAGE kind 알림(`payload->>room_id = roomId`) 일괄 read_at 갱신 — 채팅방을 보고 있는 동안 빨간점이 안 켜지게. `markRoomMessagesRead` 와 짝 |
| `useRealtimeChat(roomId)` *(훅)* | 초기 로드 + Realtime INSERT 구독 + send. dedupe by id, channel topic 에 random suffix (Strict Mode 안전) |
| `isUuid(s)` | UUID 형식 검사 — mock 시드 id 가 Supabase 쿼리로 흘러가지 않게 가드 |
| `anonymizeName(name, fallback?)` | 다른 사용자에게 노출되는 이름 마스킹. 첫 글자만 남기고 나머지는 `*`. 빈 값이면 fallback ("상대방") 반환 |
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
| `books` | `seller_id`, `title`, `state(A_PLUS/A/B/C)`, `price`, `original_price`, `status(SELLING/RESERVED/SOLD/HIDDEN)`, `trade_method(DIRECT/PARCEL/BOTH)`, `description`(사용자 코멘트), `synopsis`(책 줄거리), `pub_date`, `source_url`, `cover_url` |
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

### 큰 항목

> OAuth 는 v5 에서 구글·네이버 운영 가동 완료. 카카오는 비즈니스앱 전환이 필요해 결제 PG 와 함께 영구 보류.
> 결제 PG 는 사이드 프로젝트 단계에서는 구현하지 않기로 결정 (PG 사업자 등록·심사 비현실적).
> v6 메타데이터 마이그레이션(0011)은 운영 적용 완료 — synopsis/pub_date/source_url 정상 동작.

#### 신규 기능 로드맵 (v9 후보)

1. **ISBN 바코드 스캐너** — 도서 등록 폼(`/register`)에서 카메라로 책 뒷면 바코드를 찍으면 ISBN 자동 인식 → 기존 네이버 검색 API 에 `query=ISBN` 으로 그대로 던져 결과 카드 자동 채움. 후보 라이브러리: `@zxing/browser`(웹 표준, 의존성 가벼움) 또는 ML Kit. 모바일 사파리 / 안드로이드 크롬에서 `getUserMedia` 권한 요청 + iOS PWA 추가 후 카메라 권한 fallback UX 필요. 등록 폼 상단에 "📷 바코드로 찾기" 버튼 → 풀스크린 BottomSheet 카메라 미리보기 + 스캔 라인 + 인식 시 햅틱 → ISBN 검증(체크섬) 후 기존 검색 결과 자동 채움 흐름. 권한 거부 / 인식 실패 시 수동 입력으로 폴백
2. **내 책장 관리** — `/mypage/shelf` 신규 화면. 사용자가 가진 책을 4가지 상태로 분류해 관리: **읽는 중 / 완독 / 판매예정 / 소장**. 실제 책장 같은 비주얼 — 가로 슬롯에 책등(스파인) 으로 책을 진열하고 탭하면 책 정보 카드 펼침. 상태 전환은 BottomSheet 액션(예: "판매예정 → 등록하기" 가 `/register` 로 이동하며 책 정보 prefill). 새 테이블 `shelf_items(user_id, book_id, status, started_at, finished_at, rating, memo)` 추가 + RLS(본인만). ISBN 또는 네이버 검색으로 책장에 추가, "판매예정" 상태에서 "등록하기" 누르면 기존 createBook 흐름 재사용. 부수 효과: 마이페이지 STATS 5번째 카드 "책장(N권)" 추가 가능. 디자인: 나무결 배경 + sage 톤 책등, 카테고리별 색상 띠
3. **도서 상태 등급 상세 템플릿** — 현재 등록 폼은 최상/상/중/하 4단계만 받지만, 판매자/구매자 분쟁의 핵심이 "상태 표기 모호함". 등록 폼의 상태 선택 옆에 "상세 체크" 버튼 → BottomSheet 안에 체크리스트 템플릿: **표지(접힘/긁힘/변색), 책등(꺾임/탈색), 모서리(닳음), 본문(낙서/형광펜/얼룩/페이지누락), 부속(띠지/엽서/CD)**. 항목 체크 결과로 등급을 자동 추천(예: 본문 낙서 있으면 최대 "중") + `books.condition_detail` jsonb 컬럼 신설해 상세 항목 저장 → 도서 상세에서 "상태 상세 보기" 토글로 노출. 0012 마이그레이션 + 상태 추정 로직(`lib/conditionGrade.ts`) + 도서 상세 신규 섹션. 분쟁 발생 시 객관적 근거가 됨
4. **푸시 알림(디바이스)** — 인앱(Realtime) 은 완성. FCM/Web Push 발송용 Edge Function + service worker. 도입 시 활성 채팅방 알림 정책을 옵션 A(presence 기반) 로 업그레이드 권장 — 현재는 클라가 진입 시 read 처리하는 단순 해법
5. **쿠폰 시스템** — `user_coupons` 테이블 + 발급/사용 플로우. 현재 `/mypage/coupons` 는 빈 상태 안내만

#### 영구 보류 (사이드 프로젝트 범위 밖)

- **결제 PG 연동** — Mock UI 유지. 실제 도입하려면 PG 사업자 등록·심사 + `0010_transactions_fsm.sql` 의 `enforce_transaction_status` 에 `PAID → CANCELED` 전이 + 권한 정책(buyer? admin?) 추가 필요. 현재는 결제 성공으로 가정하고 PAID 만 기록
- **카카오 OAuth** — 카카오 로그인은 2024 정책상 비즈니스앱 전환(사업자등록증 + 검수)이 필수라 개인 사이드 프로젝트로는 활성화 불가. `/login` 의 `KAKAO_DISABLED=true` 그대로 유지. 코드 자체는 Supabase 내장 Provider 만 enable 하면 즉시 동작하는 상태로 남겨둠 (`signInWithOAuth` + `/auth/callback` 흐름)

### 작은 점검 후보 (이어갈 때 참고)
- **settings 의 본인 인증 placeholder** — 아직 토스트만. SMS OTP 또는 PASS 같은 간편 본인확인 SDK 도입 시 활성화. 오픈소스 라이선스(`/licenses`) 와 synopsis "더 보기" 토글, 검색 빈 상태(EmptyState 분기), STATS 카드 정렬은 모두 정리 완료
- **홈 LocationChip 동네 변경** — 현재 토스트만. 사용자 활성 지역 목록(`profiles.region` 또는 별도 `user_regions` 테이블) 연동 시 BottomSheet 로 선택 UI 가능
- **/orders/[id] 운송장 단계** — `STEPS` 더미 배열 기반. 외부 배송사 API(우체국/CJ) 연동 전까지는 PAID 시점에 정해진 단계만 노출
- **signup → 이메일 인증 정책** — Supabase Auth "Confirm email" ON/OFF 결정 + 그에 따른 `/signup` 이후 분기(자동 로그인 vs 메일 안내) 정합성 한 번 더 점검

---

## 개발 환경 실행

```bash
npm install
cp .env.local.example .env.local  # Supabase 키 선택 입력 (없으면 mock으로 동작)
npm run dev                         # http://localhost:3000
npm run wireframe                   # 와이어프레임 HTML (http://127.0.0.1:4173)
```
