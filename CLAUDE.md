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

---

## 인증 / OAuth 현황

- **이메일/비번**: Supabase Auth + `AuthProvider` + `useAuth()`.
- **구글/카카오**: Supabase 내장 Provider + `/auth/callback` (PKCE `exchangeCodeForSession`). **카카오는 비즈니스앱 미전환이라 `/login` 에서 `KAKAO_DISABLED=true`** — 코드는 살아 있어 플래그만 false 로 바꾸면 즉시 활성.
- **네이버**: Supabase 미지원이라 커스텀 — `/api/auth/naver/start` (state 쿠키 + 302) → `/api/auth/naver/callback` (token 교환 + `admin.createUser` idempotent + `admin.generateLink({ type:"magiclink" })` hashed_token → 서버사이드 `verifyOtp` + `setAll` 로 세션 쿠키 직접 심음). **action_link 로 redirect 하면 hash fragment 로 토큰이 와서 서버에서 안 보임 — 외부 hop 제거가 핵심.** service_role 은 `lib/supabase/admin.ts` 에서만.
- **인증 가드**: `middleware.ts` — 액션 라우트(`/register`, `/checkout`, `/orders`, `/chat`, `/mypage`, `/notifications`)만 보호. `/home`, `/search`, `/books`는 게스트 허용.
- **아이디 찾기**: `/find-account?tab=email` — phone 입력 → `POST /api/auth/find-email` 이 service_role 로 매칭, 마스킹된 email 반환. **enumeration 방지를 위해 모든 실패 케이스가 동일하게 `{ found: false }`** — 실패 분기를 다양화하지 말 것.
- **비밀번호 찾기**: `/find-account?tab=password` → `resetPasswordForEmail` → 메일 → `/auth/callback?next=/reset-password` → recovery 세션에서 `updateUser({ password })`.

---

## 파일 구조 (요약)

```
app/                              # 22+ 화면 라우트
  api/                            # books/search, auth/naver/{start,callback}, auth/find-email
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
  auth/AuthProvider.tsx
  realtime/                       # useRealtimeChat / useRealtimeChatList / useRealtimeNotifications
  supabase/                       # client / server / admin(service_role) / middleware / types
  store/                          # Zustand: shelfStore, regionStore, recentlyViewedStore, likesStore, notificationsStore
  query/                          # React Query 훅 (shelfHooks, couponHooks, …)

middleware.ts                     # 보호 라우트 가드
supabase/migrations/0001~0021     # 아래 "마이그레이션 핵심" 표 참조
```

---

## DB 테이블 요약

| 테이블 | 핵심 컬럼 |
|--------|----------|
| `profiles` | `id(=auth.uid)`, `display_name`, `rating_avg`, `trade_count`, `app_prefs(jsonb)`, `preferred_genres(text[])` |
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
- **세션 마감 git 작업**: 사용자가 직접 처리. 명시적 요청 있을 때만 commit/PR.

---

## 개발 환경 실행

```bash
npm install
cp .env.local.example .env.local  # Supabase 키 선택 입력 (없으면 mock 으로 동작)
npm run dev                         # http://localhost:3000
npm run wireframe                   # 와이어프레임 HTML (http://127.0.0.1:4173)
```
