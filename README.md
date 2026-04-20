# 책장비움 (EmptyBook)

내 책장의 책을 효율적으로 비우고 이웃과 중고 도서를 거래하는 모바일 웹 플랫폼.

기준 문서

- 기능/스펙: [`개발기획서.md`](./개발기획서.md)
- 화면 와이어프레임: [`wireframe/책장비움 와이어프레임.html`](./wireframe/책장비움%20와이어프레임.html)

## 기술 스택

- Next.js 14 (App Router, TypeScript)
- MUI 6 (`@mui/material`, `@mui/icons-material`) + 커스텀 "도서관 그린" 테마
- Pretendard Variable (CDN)
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- 모바일 퍼스트 + 데스크톱 어댑티브 (좌측 브랜드 패널 / 우측 420×min(860,viewport) 앱)

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
# HTTPS
git clone <REPO_URL> emptybook-app
cd emptybook-app

# 또는 SSH
git clone git@github.com:<OWNER>/<REPO>.git emptybook-app
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

`.env.local` 파일은 다음 키를 포함합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- **비워둔 채로도 실행 가능** — `lib/repo.ts`가 자동으로 in-memory mock 데이터로 폴백합니다. (등록/주문이 즉시 반영되지만 서버 재시작 시 초기화)
- **실데이터를 쓰려면** Supabase 프로젝트의 `Project Settings → API` 에서 값을 복사해 채워주세요. 자세한 세팅은 아래 [Supabase 세팅](#supabase-세팅) 섹션 참고.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

> 3000 포트가 점유되어 있으면 다음 중 하나로 해결하세요.
>
> ```bash
> # macOS / Linux: 3000 점유 프로세스 종료
> lsof -ti :3000 | xargs kill -9
>
> # 또는 다른 포트로 실행
> npx next dev -p 3001
> ```

### 5. 프로덕션 빌드 / 실행

```bash
npm run build      # .next/ 정적 빌드 산출
npm run start      # 3000 포트로 프로덕션 서버 실행
```

### 6. (선택) 와이어프레임 미리보기

원본 HTML 와이어프레임을 별도 포트로 띄울 수 있습니다.

```bash
npm run wireframe  # http://127.0.0.1:4173/...
```

### 자주 쓰는 명령어 요약

```bash
git clone <REPO_URL> emptybook-app && cd emptybook-app
npm install
cp .env.local.example .env.local
npm run dev          # http://localhost:3000

npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 실행 (3000)
npm run lint         # ESLint
npm run wireframe    # 와이어프레임 HTML 미리보기 (4173)
```

## 화면 → 라우트 매핑 (와이어프레임 20화면)

| #   | 화면              | 라우트                      |
| --- | ----------------- | --------------------------- |
| 01  | 스플래시/온보딩   | `/`                         |
| 02  | 로그인            | `/login`                    |
| 03  | 회원가입          | `/signup`                   |
| 04  | 홈 메인           | `/home`                     |
| 05  | 카테고리/검색결과 | `/search`                   |
| 06  | 검색 필터         | `/search/filter`            |
| 07  | 도서 상세         | `/books/[id]`               |
| 08  | 도서 등록         | `/register`                 |
| 09  | 등록 완료         | `/register/complete`        |
| 10  | (가격제안 폐기 → 도서 상세로 redirect) | `/books/[id]/offer` → `/books/[id]` |
| 11  | 결제              | `/checkout/[id]`            |
| 12  | 구매 완료         | `/checkout/[id]/complete`   |
| 13  | 거래 확정         | `/orders/[id]`              |
| 14  | 거래 후기 작성    | `/orders/[id]/review`       |
| 15  | 채팅 목록         | `/chat`                     |
| 16  | 채팅 상세         | `/chat/[id]`                |
| 17  | 판매/구매 내역    | `/mypage/orders`            |
| 18  | 알림              | `/notifications`            |
| 19  | 마이페이지        | `/mypage`                   |
| 20  | 설정              | `/mypage/settings`          |

## 디자인 시스템 — "도서관 그린"

와이어프레임을 1:1로 베끼지 않고, 일반적인 중고거래 앱(당근, 번개장터 등)의 UX 패턴을 차용해 자체 비주얼 아이덴티티를 입혔습니다.

### 비주얼 토큰 (`lib/theme.ts`)

| 토큰         | 값         | 용도                                         |
| ------------ | ---------- | -------------------------------------------- |
| `primary`    | `#1F6F4E`  | 핵심 액션, 활성 탭, 가격 강조                |
| `primaryDark`| `#155A3E`  | hover, 데스크톱 브랜드 패널 그라데이션       |
| `primarySoft`| `#E8F2EC`  | 배지, 칩, 보조 배경                          |
| `accent`     | `#FF6B5E`  | 무료 나눔, 좋아요/위험 액션                  |
| `warn`       | `#E0A526`  | 매너온도 경고, 예약중 등                     |
| `kakao`      | `#FEE500`  | 카카오 로그인/카카오페이 강조                |
| `bg`         | `#FAF7F2`  | 앱 본문 배경 (워머 톤)                       |
| `surface`    | `#FFFFFF`  | 카드, 헤더, 시트                             |
| `ink/inkMute/inkSubtle` | `#1A2B22 / #5A6B62 / #8A968F` | 본문/보조/플레이스홀더 텍스트 |
| `line/lineSoft` | `#E8E4DC / #F2EFE8` | 1px 보더, 섹션 구분         |

라운드 스케일 `radius.{xs,sm,md,lg,pill}` = `4 / 8 / 12 / 16 / 999`. 그림자 토큰 `shadow.{card,sticky,raised}`. 폰트는 Pretendard Variable(CDN)을 기본으로 사용합니다.

### 레이아웃

- **모바일 (≤ md)**: 풀블리드, safe-area 보정, 100dvh.
- **데스크톱 (≥ md)**: 좌측 그린 그라데이션 브랜드 패널 + 우측 `width: 420 / height: min(860, calc(100dvh - 32px))` 앱 카드.
- 외부 페이지 자체는 항상 100dvh 고정 + `overflow: hidden`. 스크롤은 앱 카드 내부 `ScrollBody`에서만 발생하므로 데스크톱에서도 하단 탭이 항상 보입니다.

### 공용 컴포넌트 (`components/ui/`)

| 컴포넌트                           | 역할                                              |
| ---------------------------------- | ------------------------------------------------- |
| `PhoneFrame`                       | 모바일/데스크톱 어댑티브 프레임                   |
| `AppHeader`                        | 56px 스티키 헤더 (transparent/bordered 옵션)      |
| `BottomTabNav`                     | 5탭 + 중앙 FAB 형태의 "등록" 액션                 |
| `BookImage`                        | 실 이미지 또는 시드 기반 그라데이션 플레이스홀더  |
| `ImageCarousel`                    | 도서 상세용 가로 스와이프 갤러리 (인덱스/도트)    |
| `BookCard` (`Feed/Grid/ListRow`)   | 위치/시간/상태배지/찜 카운트가 노출되는 도서 카드 |
| `StatusBadge`                      | 판매중/예약중/거래완료/무료나눔                   |
| `MannerTemperature`                | 35.x ℃ 형태의 신뢰 지표 (색상/프로그레스)         |
| `LikeButton`                       | 팝 애니메이션 + Toast 피드백                      |
| `LocationChip` / `Fab`             | 위치 칩, 리스트 위 떠 있는 글쓰기 FAB             |
| `BottomSheet` / `ConfirmDialog`    | 필터·거래액션·확정 등 모바일 패턴                 |
| `EmptyState` / `Skeleton`          | 빈 상태/로딩 스켈레톤 표준                        |
| `ToastProvider`                    | 글로벌 스낵바 (전 페이지 액션 피드백)             |

### 화면별 UX 포인트

- **홈**: 위치칩 + 통합 검색바 + 카테고리 이모지 칩 + 1열 피드 + 글쓰기 FAB.
- **검색**: 진입 시 최근/인기 검색어, 결과는 가로 리스트 + 정렬, 필터는 BottomSheet.
- **도서 상세**: ImageCarousel + 스크롤에 따라 투명→흰색으로 전환되는 헤더 + 매너온도 카드 + 스티키 CTA(찜 / 채팅 / **구매하기**).
- **등록**: 대표사진 배지, ISBN 검색, 무료나눔 토글, 등록 시 `createBook()` 호출. 완료 화면에서 등록한 책으로 바로 이동.
- **거래 흐름**: 도서 상세 → `/checkout/[id]` 결제 → `createOrder()` 후 `/checkout/[id]/complete?orderId=` → 마이페이지 주문 내역. 가격제안 단계는 제거하여 흐름을 단순화.
- **채팅**: 검색/필터 탭, 스티키 거래액션 바, 시스템 메시지, 액션 BottomSheet.
- **마이**: 매너온도 위젯 + 2×2 통계 카드 + 그룹화된 메뉴 카드.
- **알림/설정**: 타입별 아이콘 배지, 안 읽음만 보기, 그룹 카드 + 로그아웃/탈퇴 ConfirmDialog.

데이터 로딩 화면은 모두 `Skeleton` → `EmptyState` 패턴을 사용하고, 사용자 액션은 `useToast()`로 일관된 피드백을 제공합니다.

## 폴더 구조

```
app/                        # 20개 화면 라우트 + 공통 layout
components/ui/              # PhoneFrame, AppHeader, BottomTabNav, BookCard 등
lib/
  ├ theme.ts                # MUI 테마 + 와이어프레임 팔레트
  ├ mockData.ts             # 와이어프레임 더미 데이터 (Supabase 미설정 시 사용)
  ├ repo.ts                 # Supabase ↔ Mock 자동 분기 데이터 계층
  └ supabase/
      ├ client.ts           # browser client
      ├ server.ts           # RSC server client
      └ types.ts            # DB row 타입
supabase/migrations/0001_init.sql   # 전체 스키마 + RLS + Realtime + Storage
wireframe/                  # 화면기획 원본
```

## 데이터 계층 동작 방식

**페이지에서는 절대 `lib/mockData.ts`를 직접 import 하지 않습니다.** 모든 데이터 접근은 `lib/repo.ts` 한 곳을 통해서만 이루어집니다.

`lib/repo.ts` 동작 규칙:

1. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 모두 설정되어 있고 클라이언트가 정상 생성되면 → **Supabase 우선 호출**.
2. 환경변수 미설정 / 클라이언트 실패 / 인증 사용자 없음 / 쿼리 결과 없음 → **mock store로 자동 폴백**.

| API                                     | 설명                                                         |
| --------------------------------------- | ------------------------------------------------------------ |
| `listRecentBooks`, `searchBooks`        | 홈 피드 / 검색                                               |
| `fetchBook(id)`                         | 도서 상세 / 결제 / 등록완료에서 동일하게 사용                |
| `createBook(input)`                     | 등록 페이지에서 호출. mock 모드면 in-memory store에 추가     |
| `listOrders`, `fetchOrder`              | 마이페이지 주문 내역 / 주문 상세                             |
| `createOrder({ bookId })`               | 결제 시점에 호출. mock 모드면 책 상태를 SOLD로, 주문 추가    |
| `completeOrder(id)`                     | 거래 확정 화면에서 호출                                      |
| `listChats`, `fetchChat`                | 채팅 목록 / 상세                                             |
| `listNotifications`                     | 알림 페이지                                                  |
| `meta.{CATEGORIES, POPULAR_SELLERS,…}`  | 카테고리/인기 검색어 등 정적 메타                            |

mock store(`lib/mockData.ts`)는 `globalThis`에 보관되는 in-memory store이기 때문에, **mock 모드에서도 등록한 책이 즉시 홈 피드/검색에 노출되고, 결제한 책이 마이페이지 주문 내역에 즉시 보입니다.** (개발 서버 재시작 시 초기화)

### 핵심 사용자 흐름

```
스플래시 (/)
  → 로그인 (/login) → [카카오/이메일] → /home
  → 회원가입 (/signup) → /home
홈 피드 (/home)
  → 글쓰기 FAB → 도서 등록 (/register)
       → createBook() → /register/complete?id=<id>
       → "등록한 책 보기" → /books/<id>
  → 책 카드 클릭 → 도서 상세 (/books/<id>)
       → "구매하기" → 결제 (/checkout/<id>)
            → createOrder() → /checkout/<id>/complete?orderId=<id>
            → "주문 내역 보기" → /mypage/orders
                 → "거래 확정" → /orders/<id> → completeOrder() → /orders/<id>/review
```

## Supabase 세팅

> 이 단계는 **선택**입니다. Supabase 없이도 mock 데이터로 모든 화면이 동작합니다.

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성.
2. `Project Settings → API` 에서 다음 값을 복사하여 `.env.local`에 입력.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # 서버 측 작업용 (선택)
   ```

3. `SQL Editor` 에서 다음 파일의 내용을 그대로 붙여넣어 실행.

   ```
   supabase/migrations/0001_init.sql
   ```

   포함 항목:

   - `profiles`, `books`, `book_images`, `likes`
   - `transactions`, `payments`, `reviews`
   - `chat_rooms`, `messages`, `notifications`
   - 모든 테이블 RLS 정책
   - `messages`/`chat_rooms`/`notifications` Realtime publication 등록
   - `book-images` Storage 버킷 생성 + 업로드/삭제 정책

4. (선택) 카카오/네이버/Apple OAuth는 `Authentication → Providers` 에서 활성화.

5. 개발 서버를 재시작하면 자동으로 Supabase 모드로 전환됩니다.

   ```bash
   npm run dev
   ```

## 개발 로드맵 (기획서 §5 기준 진행 상황)

- [x] 1단계: MUI 테마 + 5탭 + 시작/회원가입 화면
- [x] 2단계: 도서 등록 폼 + 메인 리스트 (Supabase 연결 분기)
- [x] 3단계: 채팅 UI 골격 (Realtime 스키마 준비 완료)
- [x] 4단계: 결제 → 거래 확정 상태 머신 화면
- [x] 5단계: 후기/마이페이지/설정 화면
- [ ] 인증 가드 (로그인 필요 라우트 분리)
- [ ] ISBN 외부 API(네이버/카카오) 연동
- [ ] Supabase 실제 채팅 Realtime 구독 hook 도입
- [ ] 결제 PG 연동 (현재는 Mock UI)

## 트러블슈팅

| 증상 | 해결 |
| ---- | ---- |
| `EADDRINUSE :3000` | `lsof -ti :3000 \| xargs kill -9` 또는 `npx next dev -p 3001` |
| `Module not found` 에러 | `rm -rf node_modules .next && npm install` |
| Supabase 환경변수 인식 안 됨 | `.env.local` 파일명/위치 확인 후 dev 서버 **재시작** (env 변경은 핫리로드 안 됨) |
| 등록한 책이 다음 실행 시 사라짐 | mock 모드는 in-memory store라 정상 동작입니다. 영속 저장이 필요하면 Supabase 연결. |
| `git clone` 후 한글 파일명 깨짐 (macOS) | `git config --global core.precomposeunicode true` |
