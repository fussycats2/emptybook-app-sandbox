# 책장비움 (EmptyBook)

내 책장의 책을 효율적으로 비우고 이웃과 중고 도서를 거래하는 모바일 웹 플랫폼.
**팀 포트폴리오 베타** — 상용화 목적이 아니라 기획 → 설계 → 구현 전 과정을 보여주는 데 초점.

기준 문서

- 기획/스펙: [`개발기획서.md`](./개발기획서.md)
- 작업 컨벤션 / 함정: [`CLAUDE.md`](./CLAUDE.md) (코드 작성자용)
- ERD: [`ERD.md`](./ERD.md)
- UI 점검 노트: [`디자인점검노트.md`](./디자인점검노트.md)
- 화면 와이어프레임: [`wireframe/책장비움 와이어프레임.html`](./wireframe/책장비움%20와이어프레임.html)

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router, TypeScript) · MUI 6 · Pretendard Variable
- **상태 / 데이터**: React Query (서버 상태) · Zustand (클라이언트 상태) · 자체 `lib/repo.ts` (Supabase ↔ Mock 자동 분기)
- **백엔드 / 인프라**: Supabase (Auth · Postgres · Storage · Realtime) · Vercel
- **테스트**: Jest + Testing Library — 순수 함수 + stateless 컴포넌트 회귀 (13 suites · 92 tests)
- **부가**: `@zxing` 바코드 스캐너(ISBN 입력), 네이버/알라딘 책 정보 API 프록시 라우트
- **레이아웃**: 모바일 퍼스트 + 데스크톱 어댑티브 — 좌측 브랜드 패널 + 우측 420px 앱 카드

## 빠른 시작

### 0. 사전 준비

| 도구    | 권장 버전 | 확인 명령어     |
| ------- | --------- | --------------- |
| Node.js | 18.18+ 또는 20+ | `node -v` |
| npm     | 9+        | `npm -v`        |
| Git     | 최신      | `git --version` |

> Node.js가 없으면 [nodejs.org](https://nodejs.org) 또는 `nvm install 20 && nvm use 20` 으로 설치하세요.

### 1. 저장소 클론

```bash
git clone <REPO_URL> emptybook-app
cd emptybook-app
```

### 2. 의존성 설치

```bash
npm install
```

> 빌드 캐시까지 깨끗이 다시 받고 싶다면 `rm -rf node_modules .next && npm install`.

### 3. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 의 주요 키 (전체 키는 `.env.local.example` 참고):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# (선택) 네이버 책 검색 + 네이버 OAuth — 서버 전용
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_OAUTH_CLIENT_ID=
NAVER_OAUTH_CLIENT_SECRET=

# (선택) 알라딘 베스트셀러
ALADIN_TTB_KEY=

# OG/Twitter card/sitemap 절대 경로용 (미설정 시 localhost:3000 폴백)
NEXT_PUBLIC_SITE_URL=
```

- **비워둔 채로도 실행 가능** — `lib/repo.ts` 가 자동으로 in-memory mock 데이터로 폴백 (등록/주문이 즉시 반영되지만 서버 재시작 시 초기화).
- **실데이터를 쓰려면** Supabase 프로젝트의 `Project Settings → API` 에서 값을 복사해 채워주세요. 자세한 세팅은 [Supabase 세팅](#supabase-세팅) 참고.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

> 3000 포트가 점유되어 있으면 `lsof -ti :3000 | xargs kill -9` 또는 `npx next dev -p 3001`.

### 5. 프로덕션 빌드 / 실행

```bash
npm run build      # .next/ 정적 빌드
npm run start      # 3000 포트로 프로덕션 서버
```

### 6. 테스트 실행

```bash
npm test             # jest (13 suites · 92 tests)
npm run test:watch   # watch 모드
```

순수 함수(`lib/*`) 와 stateless 컴포넌트(`components/ui/*`) 위주. App Router page 의 전체 흐름은 RSC + 훅 의존이 많아 통합/e2e (Playwright) 영역으로 보류.

### 7. (선택) 와이어프레임 미리보기

```bash
npm run wireframe  # http://127.0.0.1:4173
```

### 자주 쓰는 명령어 요약

```bash
npm install
cp .env.local.example .env.local
npm run dev          # http://localhost:3000
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 실행 (3000)
npm run lint         # ESLint
npm test             # jest
npm run wireframe    # 와이어프레임 HTML (4173)
```

## 화면 → 라우트 매핑

총 36+ 페이지. 카테고리별로 묶었습니다.

### 인증 / 온보딩

| 화면 | 라우트 |
| --- | --- |
| 스플래시 | `/` |
| 로그인 | `/login` |
| 회원가입 | `/signup` |
| 아이디 · 비밀번호 찾기 | `/find-account?tab=email\|password` |
| 비밀번호 재설정 | `/reset-password` |
| OAuth 콜백 | `/auth/callback` |
| OAuth 후 BookLoader 랜딩 | `/auth/landing` |

### 탐색 / 도서

| 화면 | 라우트 |
| --- | --- |
| 홈 메인 | `/home` |
| 검색 | `/search` |
| 검색 필터 | `/search/filter` |
| 도서 상세 | `/books/[id]` |
| 도서 등록 | `/register` |
| 등록 완료 | `/register/complete` |
| 가격제안 (폐기 → 상세 redirect) | `/books/[id]/offer` |

### 거래

| 화면 | 라우트 |
| --- | --- |
| 결제 | `/checkout/[id]` |
| 구매 완료 | `/checkout/[id]/complete` |
| 거래 확정 | `/orders/[id]` |
| 거래 후기 작성 | `/orders/[id]/review` |
| 채팅 목록 | `/chat` |
| 채팅 상세 | `/chat/[id]` |

### 마이페이지

| 화면 | 라우트 |
| --- | --- |
| 마이 메인 | `/mypage` |
| 판매/구매 내역 | `/mypage/orders` |
| 판매 중 매물 | `/mypage/selling` |
| 책장 (보유 / 읽는 중 / 완독 / 판매중) | `/mypage/shelf` |
| 책장에 책 추가 | `/mypage/shelf/add` |
| 찜 목록 | `/mypage/likes` |
| 최근 본 도서 | `/mypage/recent` |
| 받은 후기 | `/mypage/reviews` |
| 쿠폰함 | `/mypage/coupons` |
| 설정 | `/mypage/settings` |
| 알림 | `/notifications` |

### 정적 페이지 / 정책

| 화면 | 라우트 |
| --- | --- |
| 공지사항 / 공지 상세 | `/notices`, `/notices/[id]` |
| 도움말 | `/help` |
| 이용약관 | `/terms` |
| 개인정보처리방침 | `/privacy` |
| 오픈소스 라이선스 | `/licenses` |
| 책등 미리보기 (dev) | `/spine-preview` |

보호 라우트는 `middleware.ts` 의 `PROTECTED_PREFIXES` 가 가드합니다 — 게스트는 `/home`/`/search`/`/books` 까지 허용, 액션 화면(`/register`, `/checkout`, `/orders`, `/chat`, `/mypage`, `/notifications`) 은 로그인 필요.

## 디자인 시스템 — "도서관 그린"

당근/번개장터 류 중고거래 UX 패턴 + 자체 비주얼 아이덴티티.

### 비주얼 토큰 (`lib/theme.ts` — 단일 출처)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `primary` | `#2D5F4A` | 핵심 액션, 활성 탭, 가격 강조 |
| `primaryDark` | `#1E4434` | hover, 데스크톱 브랜드 패널 그라데이션 |
| `primarySoft` / `primaryTint` | `#E6EFEA` / `#F1F6F3` | 배지·칩·보조 배경 |
| `accent` / `accentDark` | `#D9695A` / `#B85546` | 무료 나눔, 위험/강조 액션 |
| `bg` | `#F7F4ED` | 앱 본문 (워머 톤) |
| `surface` / `surfaceAlt` | `#FFFFFF` / `#FBF9F4` | 카드, 헤더, 시트 |
| `ink` / `inkMute` / `inkSubtle` | `#1A2620` / `#5C6B63` / `#94A099` | 본문 / 보조 / 플레이스홀더 |
| `line` / `lineSoft` | `#E8E3D6` / `#F2EEE5` | 1px 보더, 섹션 구분 |
| `warn` / `success` | `#C58A2C` / `#3E9166` | 경고 / 완료 |
| `kakao` / `naver` / `google` | `#FEE500` / `#03C75A` / `#FFFFFF` | OAuth 버튼 |

라운드 스케일 `radius.{xs..xxl,pill}` = `8 / 14 / 18 / 24 / 32 / 40 / 999`. 그림자 토큰 `shadow.{card, cardHover, sticky, raised, pop, ring}`. 폰트는 Pretendard Variable (CDN).

### 레이아웃

- **모바일 (≤ md)**: 풀블리드, safe-area 보정, 100dvh.
- **데스크톱 (≥ md)**: 좌측 그린 그라데이션 브랜드 패널 + 우측 `width: 420 / height: min(860, calc(100dvh - 32px))` 앱 카드.
- 외부 페이지는 100dvh + `overflow: hidden`. 스크롤은 앱 카드 내부 `ScrollBody` 에서만 발생.

### 공용 컴포넌트 (`components/ui/`)

`PhoneFrame` · `AppHeader` · `BottomTabNav` (5탭 + 중앙 FAB) · `BookImage` · `BookSpine` · `ImageCarousel` · `BookCard` (Feed · Grid · ListRow) · `StatusBadge` · `MannerTemperature` · `LikeButton` · `LocationChip` · `Fab` · `BottomSheet` · `ConfirmDialog` · `EmptyState` · `SkeletonCard` · `BookLoader` (브랜드 페이지 넘김 로딩) · `ToastProvider` · `SearchPill`.

데이터 로딩은 `Skeleton → EmptyState` 패턴, 사용자 액션은 `useToast()` 로 일관 피드백.

## 폴더 구조

```
app/                              # 36+ 페이지 라우트
  api/                            # books/search · auth/naver · auth/find-email · aladin/bestseller …
  auth/{callback,landing}/        # OAuth 콜백 + 후속 BookLoader 랜딩

components/
  ui/                             # PhoneFrame · BookCard · BottomTabNav · BookLoader 등
  search/FilterSheet.tsx

lib/
  theme.ts                        # MUI 테마 + 디자인 토큰 (단일 출처)
  repo.ts                         # 데이터 계층 — Supabase / Mock 자동 분기
  mockData.ts                     # 더미 + in-memory store (페이지에서 직접 import 금지)
  isbn.ts · conditionGrade.ts     # ISBN 체크섬 / 도서 상태 등급
  categoryMap.ts · staticContent.ts
  geo.ts · seoulCentroids.ts      # GPS → 서울 25개 자치구 매핑
  auth/AuthProvider.tsx
  realtime/                       # useRealtimeChat{List} · useRealtimeNotifications
  supabase/                       # client · server · admin(service_role) · middleware · types
  store/                          # Zustand: shelfStore · regionStore · recentlyViewedStore · likesStore …
  query/                          # React Query 훅 (shelfHooks · couponHooks …)

middleware.ts                     # 보호 라우트 가드
supabase/migrations/0001~0022     # 스키마 + RLS + 트리거 + Storage
__tests__/                        # Jest 회귀 테스트
```

## 데이터 계층 동작 방식

**페이지에서는 절대 `lib/mockData.ts` 를 직접 import 하지 않습니다.** 모든 데이터 접근은 `lib/repo.ts` 한 곳을 통해서만.

`lib/repo.ts` 자동 분기:

1. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 설정되어 있고 클라이언트가 정상 → **Supabase 호출**.
2. 환경변수 미설정 / 인증 사용자 없음 / 쿼리 결과 없음 → **mock store 자동 폴백**.

mock store(`lib/mockData.ts`) 는 `globalThis` 에 보관되는 in-memory store — **mock 모드에서도 등록한 책이 즉시 홈 피드/검색에 노출되고, 결제한 책이 마이페이지 주문 내역에 즉시 보입니다.** (개발 서버 재시작 시 초기화)

도메인별 주요 API (전체 시그니처는 `lib/repo.ts` 참고):

- **도서** — `listRecentBooks`, `searchBooks`, `fetchBook`, `createBook`, `updateBook`, `cancelBook`, `deleteBook`, `incrementBookView`
- **거래** — `createOrder`, `completeOrder`, `listOrders`, `fetchOrder`
- **채팅** — `listChats`, `fetchChat`, `listMessages`, `sendMessage`, `getOrCreateChatRoom`
- **알림** — `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- **리뷰** — `createReview`, `fetchReviewContext`, `listReceivedReviews`
- **책장** — `listMyShelf`, `addShelfItem`, `updateShelfItem`, `removeShelfItem`
- **쿠폰** — `listMyCoupons`, `getCoupon`
- **좋아요** — `toggleLike`, `listLikedBooks`, `isLiked`

### 핵심 사용자 흐름

```
스플래시 (/)
  → 로그인 (/login) → [이메일/구글/네이버/(카카오 보류)] → /auth/landing → /home
  → 회원가입 (/signup) → /home
홈 (/home)
  → 글쓰기 FAB → 도서 등록 (/register)
       → createBook() → /register/complete → 도서 상세
  → 책 카드 → 도서 상세 (/books/[id])
       → "구매하기" → 결제 (/checkout/[id])
            → createOrder() → /checkout/[id]/complete
            → /mypage/orders → "거래 확정" → /orders/[id]
                 → completeOrder() → /orders/[id]/review → createReview()
```

## Supabase 세팅

> 이 단계는 **선택** 입니다. Supabase 없이도 mock 데이터로 모든 화면이 동작합니다.

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성.
2. `Project Settings → API` 에서 키를 `.env.local` 에 입력.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # 서버 측 작업 (네이버 OAuth 등)
   ```

3. `SQL Editor` 또는 `supabase db push` 로 `supabase/migrations/` 전체(0001~0022)를 **번호 순서대로** 실행.

   주요 마이그레이션:

   - **0001** 전체 스키마 + RLS + Realtime + Storage 버킷 (`book-images`)
   - **0003 / 0020** `rating_avg` / `trade_count` 자동 갱신 트리거
   - **0005** 좋아요 카운트 트리거
   - **0006 / 0008** 알림 자동 INSERT + 실명 마스킹
   - **0010 / 0015 / 0016** transactions FSM (PAID → COMPLETED) + 책 SOLD 자동 전이 + 구매자 책장 OWNED 자동 추가
   - **0012 / 0014** 책장 (`shelf_items`) + `books.status` 변경 시 책장 동기화
   - **0017 / 0021** 쿠폰 템플릿 + 신규가입 자동 발급 + 시연용 추가 발급
   - **0022** 도서 조회수 증가 RPC (`increment_book_view`)

4. (선택) Authentication → Providers 에서 OAuth 활성화 — 구글 / 네이버 작동, 카카오는 비즈니스앱 미전환으로 코드는 살아 있되 UI 비활성.

5. 개발 서버를 재시작하면 자동으로 Supabase 모드로 전환됩니다.

## 주요 마일스톤

> 상세 변경 이력은 [`CLAUDE_archive_2026-05-07.md`](./CLAUDE_archive_2026-05-07.md) (v3~v9.9 전체 changelog) 참고.

- **v3~v6** (~2026-04) — 기본 화면 골격: 홈 / 검색 / 등록 / 결제 / 채팅 / 마이 5탭 + 와이어프레임 매핑.
- **v7** — Supabase 풀 통합 (Auth · DB · Realtime · Storage) + RLS + mock 자동 분기.
- **v8** — 디자인 리프레시: "도서관 그린" 팔레트 정착, 매너온도 / 책장 도입.
- **v9** — 책장 (`shelf_items`) · 쿠폰 · 거래 FSM · 알림 트리거 · 본인인증 placeholder.
- **v9.9** — OAuth(이메일 / 구글 / 네이버) + 비밀번호·아이디 찾기 + 본인 인증 분리.
- **v10 (2026-05-12)** — 광범위 UI 모던화: 토큰 / 그림자 / 라운드 스케일 재정비, BookLoader, 책장 페이지 개편, 22+ 라우트.
- **2026-05-13** — 성능 1차(Link prefetch · OAuth landing · next.config 옵션) + Jest 도입(13 suites · 92 tests) + OG/SEO 메타 + 0022 조회수 RPC.

## 영구 보류 / 결정 사항

> 프로젝트 성격: **상용화 X, 팀 포트폴리오 베타**. 운영 단계 인프라/지표용 기능은 ROI 안 맞아 도입 안 함. 베타 완성도(시연 품질, 버그)는 계속 챙김.

- **결제 PG 연동** — 미구현, Mock UI 만 유지.
- **카카오 OAuth** — 비즈니스앱 전환 필요. `KAKAO_DISABLED=true` 유지 (코드는 살아 있음).
- **푸시 알림 (FCM / Web Push)** — 영구 보류. 인앱 Realtime 으로 충분.
- **본인 인증 SDK** (SMS OTP / PASS) — 외부 사업자 계약 필요. placeholder 만.
- **공지 CMS** — 정적 (`lib/staticContent.ts`).

## 트러블슈팅

| 증상 | 해결 |
| ---- | ---- |
| `EADDRINUSE :3000` | `lsof -ti :3000 \| xargs kill -9` 또는 `npx next dev -p 3001` |
| `Module not found` | `rm -rf node_modules .next && npm install` |
| Supabase 환경변수 인식 안 됨 | `.env.local` 위치 확인 후 dev 서버 **재시작** (env 변경은 핫리로드 안 됨) |
| 등록한 책이 다음 실행 시 사라짐 | mock 모드는 in-memory store 라 정상. 영속이 필요하면 Supabase 연결. |
| 네이버 로그인 후 빈 화면 | `NEXT_PUBLIC_SITE_URL` 이 콜백 URL 과 일치하는지 확인. |
| 한글 파일명 깨짐 (macOS) | `git config --global core.precomposeunicode true` |
