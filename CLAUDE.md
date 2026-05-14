# EmptyBook (책장비움) — Claude 참고 문서

> 상세 변경 이력은 [`CLAUDE_archive_2026-05-07.md`](./CLAUDE_archive_2026-05-07.md) 참고 (v3~v9.9 전체 changelog).
> 문서가 다시 부풀어 오르면 archive 로 옮기고 이 파일은 "현재 규칙"만 유지한다.

## 프로젝트 개요

중고 도서 거래 모바일 웹 플랫폼 — 당근마켓 스타일.

- **기술 스택**: Next.js 14 (App Router, TypeScript) · MUI 6 · Supabase · Vercel
- **디자인 토큰**: primary `#2D5F4A` (sage), bg `#F7F4ED` (warm cream), accent `#D9695A` (terracotta), Pretendard Variable. 토큰 정의는 `lib/theme.ts` 단일 출처 — 컴포넌트에 직접 hex 박지 말 것.
- **레이아웃**: 모바일 퍼스트 + 데스크톱 어댑티브 (좌측 브랜드 패널 + 우측 420px 앱 카드 = `PhoneFrame`)
- **상세 기획**: [`개발기획서.md`](./개발기획서.md) · 사용법: [`README.md`](./README.md) · DB 구조: [`ERD.md`](./ERD.md) · UI 점검: [`디자인점검노트.md`](./디자인점검노트.md)

---

## 데이터 계층 규칙 (핵심)

**페이지에서 `lib/mockData.ts`를 직접 import 하지 않는다.** 모든 데이터 접근은 `lib/repo.ts` 경유.

`repo.ts` 자동 분기:
1. `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` 설정 + 클라이언트 정상 → Supabase
2. 환경변수 미설정 / 인증 없음 / 쿼리 결과 없음 → mock store 자동 폴백

새 repo 함수를 추가할 때 **항상 mock 폴백을 같이 작성**한다 (mock 모드에서도 화면이 동작해야 함).

### 자주 부딪히는 함정
- **mock id UUID 가드**: mock 시드 id (`c-1`, `1` 등) 가 Supabase 쿼리로 흘러가면 RLS/FK 에러. `isUuid()` 헬퍼로 비-UUID 면 mock 라우팅. 새 도메인 함수 만들 때 잊지 말 것.
- **실명 마스킹**: 다른 사용자에게 노출되는 이름은 `anonymizeName()` 통과 (첫 글자만 노출). 알림 트리거(0008) 도 SQL 함수로 처리.
- **Realtime 채널 topic**: 동일 topic 으로 두 번 subscribe 하면 Strict Mode 더블 마운트에서 충돌. mount 마다 random suffix 붙일 것.
- **한글 IME Enter 가드**: 입력 폼 onKeyDown 에서 Enter 처리 시 `e.nativeEvent.isComposing` 체크 — 한글 조합 확정 Enter 가 폼 submit 을 트리거하지 않게.
- **검색 wildcard**: ilike 입력은 `%` / `_` / `\` 이스케이프 (`searchBooks`).
- **books status → UI 매핑**: `bookStatusToUI(status, {free?})` 하나로 통일. HIDDEN → "canceled". rowToSummary/rowToDetail/listChats/fetchChat 가 같은 매핑 사용해야 함.
- **0010 FSM**: `transactions` 상태 전이는 PAID → COMPLETED, **buyer 만**. CANCELED 직행/seller 의 거래확정/종결 상태 변경은 트리거가 RAISE EXCEPTION. `completeOrder` 호출자는 try/catch.
- **rating_avg / trade_count 캐시 파급**: `rating_avg` 는 0003 트리거(reviews 변경) 가 갱신하고, `trade_count` 는 0020 트리거(transactions COMPLETED 전이) 가 갱신. 두 값 모두 `book.detail` / `chat.list` / `chat.detail` / `profile.me` 에 join 으로 노출되는데 React Query 가 알아서 못 비우므로 `useCreateReview.onSuccess` + `useCompleteOrder.onSuccess` 가 이 4 도메인을 invalidate 한다. 새 mutation 이 reviews 또는 transactions.status 를 건드린다면 같은 invalidate 묶음 필수.
- **매너온도 단일 출처**: `calcMannerTemperature(tradeCount, rating)` 헬퍼(`components/ui/MannerTemperature.tsx`)가 유일한 공식 — `36.5 + min(t,50)*0.15 + max(0, r-3)*1.0`. SellerCard / 마이페이지 본인 카드가 같은 헬퍼를 쓴다. 새 화면에 매너온도 띄울 때 직접 식 박지 말고 헬퍼 import.
- **read 함수 mock 폴백은 `!supabase` 한정**: `getMyProfile` / `listChats` / `listOrders` / `listMyBooks` / `listNotifications` 류는 두 분기를 분리한다 — ① `!supabase` (환경변수 미설정 = 의도된 mock 모드) → mock 반환 ② `!uid` (설정됐는데 auth hydrate 대기 중) → 빈 결과(`[]` 또는 `null`). 이전에 두 분기를 같이 묶어서 둘 다 mock 으로 떨어뜨렸더니, Supabase 로그인 사용자도 첫 프레임에 시드 데이터(게스트/mock 알림 3건/c-1~c-3 채팅) 가 잠깐 노출되는 잔상 회귀. 새 도메인 함수 만들 때 이 두 분기를 헷갈리지 말 것.
- **chat 아바타 두 갈래**: 채팅 **목록** 의 카드 아바타는 거래 도서 **표지**(`BookImage seed={bookId} src={bookCover}`) — 당근/번개 마켓플레이스 패턴. 채팅 **상세** 의 헤더(36px)·말풍선 옆(28px) 아바타는 상대방 **프로필 사진**(`<UserAvatar src={chat?.partnerAvatarUrl} seed={params.id} name={chat?.user}>`). 책 미니 카드(44×56) 는 그대로 `BookImage`. `listChats` / `fetchChat` 가 `partner.avatar_url` 도 join 으로 가져와 `ChatRow.partnerAvatarUrl` 에 노출. 둘을 섞지 말 것 — "목록은 책으로 도서 인지, 상세는 사람으로 거래 상대 인지" 가 명확히 갈림.
- **사용자 프로필 아바타 단일 출처**: `components/ui/UserAvatar.tsx` — 원형 + 이름 이니셜(없으면 person 아이콘) + seed 해시 색. `src` 우선, 없으면 placeholder. BookImage 의 책 아이콘 placeholder 를 사람 아바타 자리에 쓰면 "프로필 사진 안 나옴" 회귀가 됨. 새 화면에 "상대방/판매자 아바타" 띄울 때 BookImage 가 아니라 UserAvatar 를 쓸 것.
- **profiles.region vs regionStore**: 두 region 이 별개다. ① `profiles.region` (0024 추가) — 사용자의 **거주 자치구**. /mypage 카드 라벨 + 향후 추천 가중치. /mypage/settings 에서 `RegionPickerSheet` + `onPick={handlePickRegion}` 로 직접 저장. ② `regionStore` (Zustand + localStorage) — 사용자가 지금 **보고 있는 동네**. 홈 헤더 LocationChip / 홈 섹션 헤더가 구독. 거주지 ≠ 보고 있는 동네 가 가능하니(타지에서 마포구 책 검색) 같은 store 로 묶지 말 것.
- **Supabase Auth 영문 메시지 한글화**: `lib/auth/authErrors.ts` 의 `translateAuthError(err, fallback)` 가 단일 출처. 로그인/회원가입/비밀번호 재설정/아이디 찾기 4 화면이 모두 이 헬퍼 통과. 새 인증 화면 추가 시 `error.message` 를 직접 토스트에 박지 말고 `toast?.show(translateAuthError(error, "fallback"), "error")` 형태로.

---

## 인증 / OAuth 현황

- **이메일/비번**: Supabase Auth + `AuthProvider` + `useAuth()`.
- **구글/카카오**: Supabase 내장 Provider + `/auth/callback` (PKCE `exchangeCodeForSession`). **카카오는 비즈니스앱 미전환이라 `/login` 에서 `KAKAO_DISABLED=true`** — 코드는 살아 있어 플래그만 false 로 바꾸면 즉시 활성.
- **네이버**: Supabase 미지원이라 커스텀 — `/api/auth/naver/start` (state 쿠키 + 302) → `/api/auth/naver/callback` (token 교환 + `admin.createUser` idempotent + `admin.generateLink({ type:"magiclink" })` hashed_token → 서버사이드 `verifyOtp` + `setAll` 로 세션 쿠키 직접 심음). **action_link 로 redirect 하면 hash fragment 로 토큰이 와서 서버에서 안 보임 — 외부 hop 제거가 핵심.** service_role 은 `lib/supabase/admin.ts` 에서만.
- **인증 가드**: `middleware.ts` — 액션 라우트(`/register`, `/checkout`, `/orders`, `/chat`, `/mypage`, `/notifications`)만 보호. `/home`, `/search`, `/books`는 게스트 허용.
- **아이디 찾기**: `/find-account?tab=email` — phone 입력 → `POST /api/auth/find-email` 이 service_role 로 매칭, 마스킹된 email 반환. **enumeration 방지를 위해 모든 실패 케이스가 동일하게 `{ found: false }`** — 실패 분기를 다양화하지 말 것.
- **비밀번호 찾기**: `/find-account?tab=password` → `resetPasswordForEmail` → 메일 → `/auth/callback?next=/reset-password` → recovery 세션에서 `updateUser({ password })`.
- **OAuth 후 BookLoader landing**: 네이버/구글 callback 의 성공 redirect 는 `/home` 직진이 아니라 `/auth/landing?next=...` 를 거친다 — server component(`page.tsx`) wrapper + client (`LandingClient.tsx`) Suspense 패턴. BookLoader 가 뜨고 `useAuth.user` hydrate 완료 시 `router.replace(next)`. **`/reset-password` 만 landing 우회** (recovery 흐름은 곧장 폼). 콜백 후 빈 셸이 보이던 체감 지연을 브랜드 로딩 화면으로 대체. 이메일 로그인은 영향 없음.

---

## 파일 구조 (요약)

```
app/                              # 22+ 화면 라우트
  api/                            # books/search, auth/naver/{start,callback}, auth/find-email, aladin/bestseller
  auth/callback/route.ts          # OAuth(PKCE) 공통 콜백
  (page routes — app 디렉토리 트리 직접 참조)

components/ui/                    # 공용 UI 컴포넌트
components/search/FilterSheet.tsx

lib/
  theme.ts                        # MUI 테마 + 디자인 토큰 (단일 출처)
  repo.ts                         # 데이터 계층 — Supabase/Mock 자동 분기
  mockData.ts                     # 더미 + in-memory store (페이지에서 직접 import 금지)
  categoryMap.ts                  # 제목→카테고리 추정 휴리스틱
  staticContent.ts                # 공지/약관/지원 정적 콘텐츠
  isbn.ts                         # ISBN-10/13 체크섬 + 정규화
  conditionGrade.ts               # 도서 상태 상세 체크리스트 + 등급 추정
  geo.ts                          # Geolocation API + Haversine — 좌표→자치구 매핑 (lib/seoulCentroids 참조)
  seoulCentroids.ts               # 서울 25개 자치구청 좌표 테이블 (reverse geocoding 대체)
  auth/AuthProvider.tsx
  auth/authErrors.ts              # Supabase Auth 영문 메시지 → 한글 매핑 (translateAuthError)
  realtime/                       # useRealtimeChat / useRealtimeChatList / useRealtimeNotifications
  supabase/                       # client / server / admin(service_role) / middleware / types
  store/                          # Zustand: shelfStore, regionStore, recentlyViewedStore, likesStore, notificationsStore
  query/                          # React Query 훅 (shelfHooks, couponHooks, …)

components/ui/
  BookImage.tsx                   # 책 표지/책 placeholder (책 아이콘 + seed 색)
  UserAvatar.tsx                  # 사용자 프로필 아바타 (이니셜/person 아이콘 + seed 색)
  RegionPickerSheet.tsx           # 자치구 선택 BottomSheet — onPick override 로 store/profile 분리 가능

middleware.ts                     # 보호 라우트 가드
supabase/migrations/0001~0024     # 아래 "마이그레이션 핵심" 표 참조
```

---

## DB 테이블 요약

| 테이블 | 핵심 컬럼 |
|--------|----------|
| `profiles` | `id(=auth.uid)`, `display_name`, `avatar_url`, `rating_avg`, `trade_count`, `app_prefs(jsonb)`, `preferred_genres(text[])`, `region`(0024 추가) |
| `books` | `seller_id`, `title`, `state(A_PLUS/A/B/C)`, `price`, `original_price`, `status(SELLING/RESERVED/SOLD/HIDDEN)`, `trade_method`, `description`, `synopsis`, `pub_date`, `source_url`, `cover_url`, `condition_detail(jsonb)` |
| `book_images` | `book_id`, `storage_path`, `sort_order` |
| `likes` | `(user_id, book_id)` PK |
| `transactions` | `book_id`, `buyer_id`, `seller_id`, `status(OFFERED→ACCEPTED→PAID→SHIPPING→COMPLETED/CANCELED)` |
| `payments` | `transaction_id(1:1)`, `method`, `amount` |
| `reviews` | `transaction_id(1:1)`, `reviewer_id`, `reviewee_id`, `rating(1-5)`, `tags[]` |
| `chat_rooms` | `book_id`, `buyer_id`, `seller_id`, `last_message_at` |
| `messages` | `room_id`, `sender_id`, `body`, `type`, `read_at` |
| `notifications` | `user_id`, `kind`, `payload(jsonb)`, `read_at` |
| `shelf_items` | `user_id`, denormalized 메타(title/author/publisher/isbn/category/cover_url), `status(READING/FINISHED/FOR_SALE/OWNED)`, `started_at`, `finished_at`, `rating`, `memo`, `linked_book_id` |
| `coupon_templates` | `code`, `discount_type(FIXED/PERCENT)`, `discount_value`, `min_order_amount`, `max_discount`, `issue_kind(SIGNUP/EVENT/MANUAL)`, `valid_days`, `active` |
| `user_coupons` | `user_id`, `template_id`, `status(AVAILABLE/USED/EXPIRED)`, `expires_at`, `used_transaction_id` |

Realtime: `messages`, `chat_rooms`, `notifications` · Storage 버킷: `book-images` (public read, 인증 사용자 upload).

### 마이그레이션 핵심 (트리거/RLS — 코드만으로 안 보이는 부분)

| 번호 | 역할 |
|------|------|
| 0001 | 전체 스키마 + RLS + Realtime + Storage |
| 0003 | reviews → `profiles.rating_avg`/`trade_count` 자동 갱신 |
| 0005 | likes → `books.like_count` 자동 (RLS 우회, SECURITY DEFINER) |
| 0006 | messages/transactions/reviews → `notifications` 자동 INSERT |
| 0007 | messages UPDATE RLS — 채팅방 참여자 read_at 갱신 가능하게 |
| 0008 | 알림 트리거에서 display_name 마스킹 + 기존 행 백필 |
| 0009 | books/profiles UPDATE 정책에 `with check` (양도 형식적 차단) |
| 0010 | transactions FSM — PAID→COMPLETED, buyer 만. CANCELED 차단 |
| 0012 | shelf_items + ISBN partial unique + RLS |
| 0014 | books.status SOLD/HIDDEN → 연결된 shelf_items FOR_SALE→OWNED |
| 0015 | transactions PAID INSERT → books.status=SOLD (SECURITY DEFINER, RLS 우회) |
| 0016 | transactions PAID INSERT → buyer 책장에 OWNED 자동 추가 |
| 0017 | coupon_templates / user_coupons + 신규가입 자동 발급 + `expire_old_coupons()` RPC |
| 0018 | handle_new_user() 확장 — phone / preferred_genres 까지 raw_user_meta_data 에서 흡수 (confirm-email ON 시 silent 누락 픽스) |
| 0019 | reviews UNIQUE 변경 — `(transaction_id)` 단독 → `(transaction_id, reviewer_id)`. 한 거래에 buyer/seller 가 각각 1개씩 후기 작성 가능. fetchReviewContext 의 alreadyReviewed 판정도 reviewer 단위로 좁힘 |
| 0020 | `profiles.trade_count` source 변경 — 받은 후기 개수 → transactions(COMPLETED) 양당사자 합산. UI 라벨 "거래 N회" 의미와 일치. `recalc_profile_rating()` 가 단일 함수로 rating_avg + trade_count 둘 다 책임. transactions 의 status COMPLETED 전이 시 신규 트리거가 양쪽 재계산 |
| 0021 | 쿠폰 시드 보강 — 5종 추가 (WELCOME_PLUS / EVERY3000 / BIGSALE7000 / PERCENT20 / FREESHIP2500) + 모든 active 템플릿을 모든 기존 사용자에게 일괄 백필. ON CONFLICT 로 중복 발급 방지. 베타 시연용 |
| 0022 | `increment_book_view(p_book_id)` SECURITY DEFINER RPC — `books.view_count` 는 0001 부터 있던 컬럼이지만 0009 의 books UPDATE RLS 가 본인 매물에만 허용해서 다른 사용자가 들어와도 카운트가 안 늘던 문제 해소. 본인 매물(`auth.uid() = seller_id`)은 RPC 내부에서 noop. authenticated + anon 둘 다 EXECUTE 허용. `repo.incrementBookView` + `useIncrementBookView` 가 도서 상세 진입 시 한 번 호출. UI 즉시 반영은 `lib/store/viewsStore.ts` (likesStore 패턴) 로 낙관적 +1 |
| 0023 | chat_rooms.last_message_at 자동 갱신 — 0001 이 chat_rooms 에 SELECT/INSERT RLS 만 만들고 UPDATE 정책을 안 만들어서, sendMessage 의 `update({ last_message_at })` 가 silent 0-row update 로 무시되던 회귀. ① `chat_rooms_update_party` UPDATE RLS 추가(참여자만) ② `bump_chat_room_on_message()` 트리거 — messages INSERT 시 SECURITY DEFINER 로 last_message + last_message_at 자동 갱신. 다른 클라이언트가 보낸 메시지에도 동작 ③ 백필 — 기존 방의 last_message_at 을 max(messages.created_at) / 없으면 created_at 으로 채워서 정렬 결정성 보장. `listChats` 의 `nullsFirst:false` 는 마이그 적용 전 호환용으로 유지 |
| 0024 | profiles.region 컬럼 추가 — 0001 의 `region text` 는 books 테이블 컬럼이라 profiles 에는 없었음. /mypage/settings 동네 저장 시 PATCH 가 unknown column 으로 400 Bad Request, "저장에 실패했어요" 토스트 나던 픽스. RLS 는 0009 의 profiles_update_own (auth.uid()=id) 이 모든 컬럼에 적용되므로 추가 정책 불필요 |

---

## 영구 보류 / 결정 사항

> **프로젝트 성격**: 상용화 X, 팀 포트폴리오 베타 (2026-05-07 확정). 운영 단계 인프라/지표용 기능은 ROI 가 안 맞아 도입 안 함. 베타 완성도(시연 품질, 버그) 는 계속 챙김.

- **결제 PG 연동**: 미구현. Mock UI 만 유지. 0010 FSM 은 PAID→COMPLETED 만 허용, CANCELED 진입 차단. 도입 시 `enforce_transaction_status` 트리거에 `PAID→CANCELED` 전이 + 권한 정책 + 환불 시 쿠폰 USED→AVAILABLE 복구 필요.
- **카카오 OAuth**: 비즈니스앱 전환 필요 (사업자등록증 + 검수). `KAKAO_DISABLED=true` 유지. 코드는 살아 있음.
- **푸시 알림(FCM/Web Push)**: 영구 보류 (2026-05-07). 인앱 Realtime 으로 충분 — 푸시는 retention 지표용이라 베타 데모와 무관. 도입하려면 VAPID 키 + service worker + Edge Function + 대시보드 웹훅 + iOS PWA manifest 까지 필요.
- **본인 인증 SDK** (SMS OTP / PASS): 외부 사업자 계약·요금제 필요. `/mypage/settings` 의 placeholder 만 유지.
- **공지 CMS**: `lib/staticContent.ts` 더미 유지. 운영 본격화 전엔 정적.

---

## 작업 컨벤션

- **새 화면 추가**: `app/<route>/page.tsx` — 보호 라우트면 `middleware.ts` 의 `PROTECTED_PREFIXES` 갱신.
- **새 데이터 함수**: `lib/repo.ts` 에 Supabase 분기 + mock 폴백 한 쌍으로 작성. 페이지가 `mockData.ts` 를 직접 import 하면 안 됨.
- **새 캐시 키**: `queryKeys` 에 등록. mutation onSuccess 에서 invalidate 할 키들을 빠뜨리지 말 것 (특히 `chat.list`, `shelf.lists`, `like.list`, `book.recent` 가 도메인 간 영향을 받음).
- **Storage 업로드**: `book-images` 버킷, 단일 8MB 한도, public URL.
- **새 마이그레이션**: 다음 번호 + RLS 정책/트리거에는 `SECURITY DEFINER` 명시. 마이그레이션 시점 백필 SQL 도 같은 파일에.
- **셀러 책 상태 관리 단일 출처**: `books.status` (RESERVED/SOLD/HIDDEN) 변경은 `/books/[id]` MoreVert(수정/판매취소/삭제) 한 곳에서만. 다른 화면(예: 채팅)에 동일 액션 메뉴를 중복으로 띄우면 ① 로컬 state 만 토글되는 placeholder 가 되거나 ② 도메인 id 충돌이 생긴다. 새 액션은 그 단일 출처에 추가.
- **판매 취소 → 책장 redirect**: `cancelBook` 성공 후엔 `/mypage/selling` 이 아니라 `/mypage/shelf` 로 보낸다. 사용자 멘탈 모델이 "취소 = 다시 내 소유로 돌아옴". 0014 트리거가 linked shelf_item 만 OWNED 로 옮기므로, 직접 등록한 책(shelf 흔적 없음)은 클라이언트가 `addShelfItem(status:"OWNED")` 로 명시 추가해야 일관됨. ISBN partial unique(0012) 가 idempotent 보장. 정상 삭제(영구)는 사용자 의도대로 `/mypage/selling` 유지 — 책장에 추가 안 함.
- **신규 가입 메타 채움**: profiles 의 추가 필드(phone/preferred_genres 등) 는 `/signup` 의 `signUp({ options: { data: ... } })` 에 담아 보내고 `handle_new_user()` 트리거(0018) 가 흡수. 가입 직후 클라이언트가 `profiles.update()` 를 호출하면 confirm-email ON 환경에서 RLS 가 silent 차단.
- **BookCard 류 표지**: `BookImage` 에 `seed={book.id} src={book.coverUrl}` 두 prop 모두 넘겨야 한다. `src` 가 있으면 실표지, 없으면 seed 기반 placeholder 로 폴백. 한쪽이라도 빠지면 표지 있는데 placeholder 가 나오거나, 폴백이 일관되지 않게 된다.
- **`BookSpine` 책장 진열대 전용**: `/mypage/shelf` 의 책장 그리드(본문 진열) 에서만 사용. CSS-only 절차적 책등 (해시 시드로 테마/색/너비 결정 — 표지 이미지 사용 안 함). 같은 화면이라도 책 클릭 시 뜨는 BottomSheet 헤더는 `BookImage`(실표지) 사용 — 상세 컨텍스트는 책등 모양보다 표지가 더 자연스러움. 다른 화면도 모두 `BookImage` 유지. 제목은 vertical-rl **한 컬럼**, `(부제)` `[시리즈]` 같은 괄호 이후는 `stripParenthesis()` 로 떼고 그래도 길면 "…" 잘림 — 여러 줄 wrap 은 시각적으로 어수선해서 의도적으로 사용하지 않음. 저자는 하단 가로 1줄.
- **`BookSpine` "판매중" 띠지(`listed`)**: `selected.status === "FOR_SALE" && linkedBookId` 일 때만 true. linkedBookId 만 있는 OWNED 항목(0014/0016 트리거가 거래완료/구매로 자동 OWNED 한 케이스)은 띠지·BottomSheet "매물로 등록됨" 뱃지·"등록된 매물 보기" footer 버튼 모두 비표시 — 의미가 "현재 판매 중" 이라 OWNED 와 충돌. 세 군데 조건이 같이 움직여야 함.
- **`regionStore` — 사용자 선택 vs 자동 채움 분리**: `setRegion(name)` 은 사용자가 RegionPickerSheet 에서 자치구를 직접 골랐을 때(`isUserSet=true`), `setRegionAuto(name)` 은 GPS 자동 매핑(`lib/geo.ts` 의 `locateUserRegion()`) 결과로 채울 때(`isUserSet=false`) 사용. 두 경로가 같은 setter 를 공유하면 "사용자가 명시 선택했는지" 를 구분할 수 없어 향후 자동 갱신 가드를 못 걺. v2 migrate 가 default("마포구") 와 다른 기존 region 은 명시 선택으로 추정.
- **`/login` ScrollBody**: 페이지 본문은 `<ScrollBody>` 로 감싸야 작은 화면에서 하단(SNS 버튼 등) 이 잘리지 않음. `PhoneFrame` 자체가 `overflow: hidden` 이라 자식이 `flex: 1 + overflowY: auto` 를 들고 있어야 함 — 단순 `flex: 1` Box 는 콘텐츠가 넘칠 때 그대로 잘림. 새 풀-페이지 폼 추가 시 같은 패턴.
- **가로 스크롤 + 호버 lift 컨테이너의 세로 padding**: `overflowX: auto` 를 쓰는 컨테이너는 브라우저가 `overflow-y: visible` 도 자동으로 `auto` 로 강제 → 자식 카드의 호버 lift(`translateY(-2px)`) + shadow 가 위/아래에서 잘림. 카드들에 `card-lift` 류 호버 모션이 있으면 컨테이너에 `pt: 0.75 ~ 1, pb: 1` 정도 padding 추가하고 mt 를 약간 줄여 외부 간격 보정. 홈 이벤트 배너 / 카테고리 칩 / "취향 책" 가로 스크롤이 모두 같은 패턴.
- **가로 스크롤 인디케이터는 클릭 가능해야**: 데스크톱에서 스와이프 가 안 되므로 점(dot) 형태 인디케이터는 `pointerEvents: none` 금지. 각 점이 `onClick` 으로 해당 슬라이드까지 `scrollTo({ left, behavior: "smooth" })` 하도록 구현. 활성 점은 알약 모양(width 18) 으로 폭 변화 transition. 홈 이벤트 배너 / 도서 상세 ImageCarousel 이 같은 패턴.
- **`ImageCarousel` 슬라이드 구성**: 첫 슬라이드는 항상 `coverUrl` (네이버/알라딘 표지 또는 첫 업로드 자동 승격) — 사용자가 책 인지를 즉시 할 수 있게. 그 뒤에 `imageUrls` 를 dedup(같은 URL 제거) 해 붙임. 둘 다 없으면 placeholder. 실사진은 `<img object-fit: contain>` 으로 letterbox 처리 — `cover` 로 잘라내면 표지(세로) 가 과도하게 확대되어 보임. 배경은 `palette.surfaceAlt` 로 letterbox 영역이 자연스러움.
- **상세 체크 적용 vs 항목 체크**: `/register` 에서 등록 가능 여부는 `conditionApplied OR hasAnyChecked(detail)` 로 판단. 사용자가 시트에서 아무 항목도 체크 안 하고 "상태 적용 (최상)" 을 눌러도 명시 확인으로 인정해야 함. `hasAnyChecked` 단독으로 게이팅하면 결함 없는 책의 등록을 막아버림.
- **`BottomSheet` onClose 는 변경 사항 폐기**: 스크림/swipe/Esc 로 시트가 닫힐 때는 저장하지 않는다 — 명시 버튼(예: "저장하고 닫기")만 저장 의도로 인정. /mypage/shelf 시트가 reference. onClose 안에서 mutate 호출하면 사용자가 실수로 입력하다 외부 클릭 한 번에 의도치 않은 저장이 발생.
- **`BottomSheet` swipe-to-close**: 컴포넌트 자체에 grabber + title 영역 드래그로 닫기가 내장. 본문 children 은 자체 스크롤 영역이라 swipe 핸들러를 본문에 부착하면 스크롤이 막힘 — 헤더 영역에만 부착. 임계값은 시트 높이 25% 또는 100px 중 작은 값.
- **`<Box component={Link}>` + sx color 는 금지**: 자식 Typography 가 검정으로 떨어지는 cascade 트랩. globals.css 의 `a { color: inherit }` 와 emotion sx 의 컴파일 결과가 충돌해서, `"& .MuiTypography-root": { color: "inherit" }` 추가도 / 자식별 `color: "#fff"` 명시도 회귀를 못 막음 (2026-05-13 세 번 재현). 안전 패턴: **`<Link>` 외부 래퍼 + 안쪽 `<Box sx={{ color: "#fff" }}>` (div) 가 색 보유**. Link 의 layout 속성(flex/scrollSnapAlign)은 `style` prop, prefetch 는 `<Link prefetch>` 로 유지. 홈 신규가입 쿠폰 배너가 reference. (부모가 색 없는 카드 링크 — BottomTabNav, 카테고리 칩 등 — 는 cascade 충돌 없음, 그대로 OK.)
- **`ScrollBody` 첫 자식의 box-shadow 클리핑**: `overflowY:auto` 라 좌상단(0,0) 에 바로 붙은 자식의 위 box-shadow 는 클리핑됨. boxShadow 가 있는 카드를 ScrollBody 첫 자식으로 둘 때는 `mt: 1 ~ 1.5` 정도 buffer 를 줘서 그림자 펴질 여유 확보. /home 이벤트 배너 / /mypage 내 정보 카드가 같은 패턴.
- **핫 패스는 `next/link` prefetch 활용**: 자주 진입하는 정적 경로(BottomTabNav 5탭, 홈의 쿠폰 배너/내 책장 바로가기/카테고리 칩)는 `router.push` 대신 Link 로 작성 — viewport 진입 시 청크 자동 prefetch 라 클릭 → 화면 전환 지연 감소. 색 들고 가는 배너 류는 `<Link><Box>` 래퍼 패턴(위 항목), 색 안 들고 가는 단순 칩은 `Box component={Link}` 그대로. 책 카드 리스트는 다수 카드가 viewport 스크롤 시 prefetch 폭발 비용이 커서 제외.
- **새 순수 함수/컴포넌트는 `__tests__/` 에 회귀 테스트**: `lib/` 의 pure helper 와 stateless `components/ui/` 는 jest + RTL 로 가볍게 (`npm test`). 13 suites · 92 tests 가 기준선. App Router page 의 전체 흐름은 RSC + 훅 의존이 많아 통합/e2e 가 더 적합 — phase 3 는 보류.
- **세션 마감 git 작업**: 사용자가 직접 처리. 명시적 요청 있을 때만 commit/PR.

---

## 개발 환경 실행

```bash
npm install
cp .env.local.example .env.local  # Supabase 키 선택 입력 (없으면 mock 으로 동작)
npm run dev                         # http://localhost:3000
npm test                            # jest — 순수 함수 + 컴포넌트 회귀 (13 suites · 92 tests)
npm run wireframe                   # 와이어프레임 HTML (http://127.0.0.1:4173)
```
