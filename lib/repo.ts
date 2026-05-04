// 모든 데이터 접근(읽기/쓰기)의 진입점이 되는 "리포지토리(repo)" 계층
// - 환경변수가 있고 Supabase 가 응답하면 → 실제 DB 사용
// - 그렇지 않거나 에러가 나면 → mockData 의 인메모리 저장소로 자동 폴백
// - 화면(page.tsx)들은 항상 이 파일의 함수만 사용하면 된다 (mockData 직접 import 금지)

import {
  CATEGORIES,
  POPULAR_SEARCHES,
  POPULAR_SELLERS,
  RECENT_SEARCHES,
  mockCancelBook,
  mockCreateBook,
  mockCreateOrder,
  mockCreateReview,
  mockDeleteBook,
  mockGetBook,
  mockGetChat,
  mockGetOrder,
  mockGetReviewByTx,
  mockGetReviewContext,
  mockIsLiked,
  mockListBooks,
  mockListChats,
  mockListLikedIds,
  mockListNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead,
  mockMarkRoomChatNotificationsRead,
  mockListOrders,
  mockGetOrCreateChatRoomByBook,
  mockGetProfile,
  mockListMessages,
  mockListReceivedReviews,
  mockMarkRoomRead,
  mockSendMessage,
  mockToggleLike,
  mockUnreadByRoom,
  mockUpdateAppPrefs,
  mockUpdateOrderStatus,
  mockUpdateProfile,
  type MockBook,
  type MockChat,
  type MockMessage,
  type MockNotification,
  type MockOrder,
  type MockReview,
  type ReceivedReviewCard,
} from "./mockData";
import type { BookSummary } from "@/components/ui/BookCard";
import {
  DEFAULT_APP_PREFS,
  STATE_LABEL,
  type AppPrefs,
  type BookRow,
  type BookState,
  type BookStatus,
  type Profile,
} from "./supabase/types";
import type { SaleStatus } from "@/components/ui/StatusBadge";

export type BookDetail = MockBook;
export type OrderRow = MockOrder;
export type ChatRow = MockChat;
export type NotificationRow = MockNotification;
export type ReceivedReview = ReceivedReviewCard;

// 채팅방 메시지 — 화면이 그릴 수 있는 정규화 형태
// mine: 내가 보낸 메시지인지, type: text/system, read: 상대가 읽었는지
export type MessageRowUI = {
  id: string;
  body: string;
  type: "text" | "system";
  mine: boolean;
  read: boolean;
  createdAt: string;
};

// UI에서 사용자가 선택한 한글 상태("최상" 등) → DB enum("A_PLUS" 등) 변환표
// 등록 폼/검색 필터에서 두 가지 표기가 모두 들어올 수 있어 양쪽 다 지원
const STATE_TO_LABEL_FROM_KOR: Record<string, BookState> = {
  최상: "A_PLUS",
  상: "A",
  중: "B",
  하: "C",
  "A+급": "A_PLUS",
  "A급": "A",
  "B급": "B",
  "C급": "C",
};

// 환경변수 둘 다 세팅돼 있으면 Supabase 모드로 간주
// (값이 잘못된 경우는 tryClient() 안에서 한 번 더 안전하게 검증)
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const meta = {
  CATEGORIES,
  POPULAR_SELLERS,
  RECENT_SEARCHES,
  POPULAR_SEARCHES,
};

// DB의 books.status (+ 무료나눔 여부) → UI 의 SaleStatus 로 매핑
// HIDDEN 은 "취소됨"이 우선이므로 free 보다 앞에 둔다 — 취소된 무료나눔도 "취소" 로 보여야 함
export function bookStatusToUI(
  status: BookStatus,
  opts: { free?: boolean } = {}
): SaleStatus {
  if (status === "HIDDEN") return "canceled";
  if (opts.free) return "free";
  if (status === "RESERVED") return "reserved";
  if (status === "SOLD") return "sold";
  return "selling";
}

// DB의 books row → 카드 컴포넌트(BookCard)에 넘길 가벼운 형태로 변환
function rowToSummary(b: BookRow): BookSummary {
  const isFree = b.price === 0;
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? "",
    publisher: b.publisher ?? undefined,
    price: isFree ? "무료나눔" : `${b.price.toLocaleString()}원`,
    state: STATE_LABEL[b.state],
    loc: b.region ?? undefined,
    date: new Date(b.created_at).toLocaleDateString("ko-KR"),
    status: bookStatusToUI(b.status, { free: isFree }),
    free: isFree,
    likes: b.like_count,
    coverUrl: b.cover_url ?? undefined,
  };
}

// DB의 books row → 상세 화면용(BookDetail) 형태로 변환
// summary 보다 더 많은 필드(설명, 등록일, 거래방식 등)를 채운다
function rowToDetail(b: BookRow): BookDetail {
  const isFree = b.price === 0;
  // 정가(original_price) 가 판매가보다 높으면 할인율 자동 계산해 표시.
  // 같거나 낮으면 (이상한 데이터 또는 정가 미상) 정가/할인 모두 노출하지 않음.
  const listPrice = b.original_price ?? null;
  const showOriginal = !!listPrice && listPrice > b.price && b.price > 0;
  const discountPct = showOriginal
    ? Math.round(((listPrice - b.price) / listPrice) * 100)
    : 0;
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? "",
    publisher: b.publisher ?? undefined,
    isbn: b.isbn ?? undefined,
    category: b.category ?? "기타",
    price: isFree ? "무료나눔" : `${b.price.toLocaleString()}원`,
    priceNumber: b.price,
    originalPrice: showOriginal
      ? `${listPrice.toLocaleString()}원`
      : undefined,
    originalPriceNumber: listPrice ?? undefined,
    discount: discountPct >= 5 ? `${discountPct}%` : undefined,
    state: STATE_LABEL[b.state],
    loc: b.region ?? undefined,
    region: b.region ?? undefined,
    date: new Date(b.created_at).toLocaleDateString("ko-KR"),
    description: b.description ?? undefined,
    comment: b.description ?? undefined,
    synopsis: b.synopsis ?? undefined,
    pubDate: b.pub_date ?? undefined,
    sourceUrl: b.source_url ?? undefined,
    seller: "판매자",
    sellerId: b.seller_id, // isMine 판별용 (auth.uid 비교)
    sellerStats: "거래 -",
    registeredAt: new Date(b.created_at).toLocaleDateString("ko-KR"),
    tradeMethod:
      b.trade_method === "BOTH"
        ? "직거래, 택배 가능"
        : b.trade_method === "DIRECT"
        ? "직거래"
        : "택배",
    status: bookStatusToUI(b.status, { free: isFree }),
    free: isFree,
    likes: b.like_count,
    chats: 0,
    coverUrl: b.cover_url ?? undefined,
  };
}

// 표준 UUID(v1~v5) 형식인지 검사 — chat 시드 ID("c-1" 등) 와 실제 DB UUID 를 구분하기 위함
// (Supabase 환경변수가 있어도 mock 폴백된 시드 ID 가 그대로 INSERT 로 흘러들어가지 않게 가드)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(s: string | null | undefined): s is string {
  return !!s && UUID_RE.test(s);
}

// 다른 사용자에게 노출되는 이름을 마스킹한다 (회원가입 시 실명을 그대로 받기 때문).
// 정책: 첫 글자만 남기고 나머지는 '*'. 빈 문자열/null 이면 fallback 반환.
//   "김민주" → "김**"
//   "kim"   → "k**"
//   "A"     → "A"   (1글자는 마스킹 안 해도 정보 노출이 거의 없음)
//   ""      → fallback
// 이 함수는 화면에 노출되는 boundary 에서만 호출 (DB 에는 원본 그대로 저장).
export function anonymizeName(
  name: string | null | undefined,
  fallback = "상대방"
): string {
  const s = (name ?? "").trim();
  if (!s) return fallback;
  if (s.length <= 1) return s;
  return s[0] + "*".repeat(Math.max(1, s.length - 1));
}

// Supabase 클라이언트를 안전하게 가져오는 헬퍼
// - 환경변수 없음 → null 반환 → 호출자는 mock 으로 폴백
// - 클라이언트 생성 중 예외가 나도 null 로 떨어뜨려서 화면이 절대 깨지지 않게 한다
async function tryClient() {
  if (!isSupabaseConfigured) return null;
  try {
    const { supabaseBrowser } = await import("./supabase/client");
    return supabaseBrowser();
  } catch {
    return null;
  }
}

// ---------- Profile (내 프로필) ----------

// 누락된 prefs 키를 기본값으로 채워서 반환 — 화면이 항상 일관된 형태를 받도록
export function withDefaultPrefs(prefs?: AppPrefs | null): {
  push: Required<NonNullable<AppPrefs["push"]>>;
  privacy: Required<NonNullable<AppPrefs["privacy"]>>;
} {
  return {
    push: { ...DEFAULT_APP_PREFS.push, ...(prefs?.push ?? {}) },
    privacy: { ...DEFAULT_APP_PREFS.privacy, ...(prefs?.privacy ?? {}) },
  };
}

// 내 프로필 조회 — Supabase 모드에선 profiles 테이블에서 1건 가져옴
// 비로그인/Supabase 미설정이면 mock 저장소의 프로필을 반환
export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetProfile();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return mockGetProfile();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error || !data) return null;
  // app_prefs 가 NULL 이면 빈 객체로 정규화
  return { ...(data as Profile), app_prefs: (data as any).app_prefs ?? {} };
}

// 내 프로필 부분 수정 — display_name / username / phone 등
// username UNIQUE 위반(23505) 시 { uniqueViolation: true } 반환
export async function updateMyProfile(input: {
  display_name?: string | null;
  username?: string | null;
  phone?: string | null;
}): Promise<{ ok: boolean; uniqueViolation?: boolean }> {
  const supabase = await tryClient();
  if (!supabase) {
    mockUpdateProfile(input);
    return { ok: true };
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    mockUpdateProfile(input);
    return { ok: true };
  }
  // 빈 문자열은 null 로 정규화 (username UNIQUE 충돌 방지 + 일관성)
  const payload: Record<string, string | null> = {};
  if (input.display_name !== undefined)
    payload.display_name = input.display_name?.trim() || null;
  if (input.username !== undefined)
    payload.username = input.username?.trim() || null;
  if (input.phone !== undefined)
    payload.phone = input.phone?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);
  if (error?.code === "23505") return { ok: false, uniqueViolation: true };
  return { ok: !error };
}

// 알림/개인정보 토글 등 app_prefs 부분 갱신
// jsonb 컬럼은 한 번에 통째로 덮어써야 하므로 현재 값을 읽어 deep-merge 후 UPDATE
export async function updateAppPrefs(prefs: AppPrefs): Promise<void> {
  const supabase = await tryClient();
  if (!supabase) {
    mockUpdateAppPrefs(prefs);
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    mockUpdateAppPrefs(prefs);
    return;
  }
  const { data: current } = await supabase
    .from("profiles")
    .select("app_prefs")
    .eq("id", auth.user.id)
    .maybeSingle();
  const base = ((current as any)?.app_prefs ?? {}) as AppPrefs;
  const next: AppPrefs = {
    push: { ...(base.push ?? {}), ...(prefs.push ?? {}) },
    privacy: { ...(base.privacy ?? {}), ...(prefs.privacy ?? {}) },
  };
  await supabase
    .from("profiles")
    .update({ app_prefs: next, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);
}

// ---------- Books (도서) ----------

// 홈 피드용 — 최근 등록된 책 목록
// HIDDEN(신고/숨김) 상태인 책은 제외하고, 최신순으로 limit 개 조회
// mock 모드의 SaleStatus 에서 "canceled" 인 책도 같이 제외해서 Supabase 모드와 동일하게 보이게 한다
export async function listRecentBooks(limit = 10): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) {
    return mockListBooks().filter((b) => b.status !== "canceled").slice(0, limit);
  }
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .neq("status", "HIDDEN")
    .order("created_at", { ascending: false })
    .limit(limit);
  // 쿼리 실패 시에도 화면은 계속 보여주도록 mock 폴백
  if (error || !data) {
    return mockListBooks().filter((b) => b.status !== "canceled").slice(0, limit);
  }
  return (data as BookRow[]).map(rowToSummary);
}

// 검색 — 키워드(q) / 카테고리 / 상태 등급 필터를 조합해 책을 검색
export async function searchBooks(opts: {
  q?: string;
  category?: string;
  state?: string;
}): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) {
    // Supabase 없을 땐 mock 배열을 직접 필터링
    const list = mockListBooks();
    return list.filter((b) => {
      // 취소된 책은 검색 결과에서 빠진다 (Supabase 모드의 .neq("status","HIDDEN") 와 동일)
      if (b.status === "canceled") return false;
      if (opts.q && !b.title.includes(opts.q) && !(b.author ?? "").includes(opts.q))
        return false;
      if (opts.category && b.category !== opts.category) return false;
      if (opts.state && b.state !== opts.state) return false;
      return true;
    });
  }
  // Supabase 쿼리 빌더에 조건을 누적해서 붙여나간다
  let query = supabase.from("books").select("*").neq("status", "HIDDEN");
  if (opts.q) {
    // ilike 는 PostgreSQL LIKE 연산자라 % / _ / \ 가 wildcard 로 해석된다.
    // 사용자가 "50%" 같은 검색어를 넣었을 때 모든 책이 매칭되지 않게 이스케이프
    const safe = opts.q.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
    query = query.ilike("title", `%${safe}%`);
  }
  if (opts.category) query = query.eq("category", opts.category);
  // 사용자 입력은 한글 라벨 → DB enum 으로 변환해서 매칭
  if (opts.state && STATE_TO_LABEL_FROM_KOR[opts.state]) {
    query = query.eq("state", STATE_TO_LABEL_FROM_KOR[opts.state]);
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as BookRow[]).map(rowToSummary);
}

// 주어진 id 배열로 BookSummary 들을 한 번에 가져온다 — 입력 순서를 그대로 유지
// (최근 본 상품처럼 "내가 정한 순서" 가 의미를 갖는 경우용. created_at 정렬을 강제하지 않는다)
// - 사라진 책(HIDDEN/삭제) 은 결과에서 자연스럽게 빠진다
// - mock id 와 UUID 가 섞여 있으면 UUID 만 Supabase 에 보내고 나머지는 mock 에서 채운다
export async function listBooksByIds(ids: string[]): Promise<BookSummary[]> {
  if (ids.length === 0) return [];
  const supabase = await tryClient();
  if (!supabase) {
    const map = new Map<string, BookSummary>(
      mockListBooks()
        .filter((b) => b.status !== "canceled") // 취소된 책은 결과에서 빠진다
        .map((b) => [b.id, b as BookSummary])
    );
    return ids
      .map((id) => map.get(id))
      .filter((b): b is BookSummary => !!b);
  }
  const uuidIds = ids.filter((id) => isUuid(id));
  let dbMap = new Map<string, BookSummary>();
  if (uuidIds.length > 0) {
    const { data } = await supabase
      .from("books")
      .select("*")
      .in("id", uuidIds)
      .neq("status", "HIDDEN");
    for (const row of (data as BookRow[] | null) ?? []) {
      dbMap.set(row.id, rowToSummary(row));
    }
  }
  // mock id 가 끼어 있으면 mock 에서도 보충 (Supabase 쿼리 결과와 합쳐 입력 순서 유지)
  const mockMap = new Map<string, BookSummary>(
    mockListBooks().map((b) => [b.id, b as BookSummary])
  );
  return ids
    .map((id) => dbMap.get(id) ?? mockMap.get(id))
    .filter((b): b is BookSummary => !!b);
}

// 단일 도서 상세 조회 (도서 상세 페이지에서 호출)
// book_images 도 함께 join 해서 storage_path → public URL 로 변환된 imageUrls 를 채운다
export async function fetchBook(id: string): Promise<BookDetail | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetBook(id) ?? null;
  const { data } = await supabase
    .from("books")
    .select("*, book_images(storage_path, sort_order)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockGetBook(id) ?? null;
  const detail = rowToDetail(data as BookRow);
  // sort_order 오름차순으로 정렬해 캐러셀 슬라이드 순서 보장
  const imgs = ((data as any).book_images ?? []) as {
    storage_path: string;
    sort_order: number;
  }[];
  if (imgs.length > 0) {
    const sorted = [...imgs].sort((a, b) => a.sort_order - b.sort_order);
    detail.imageUrls = sorted.map(
      (r) =>
        supabase.storage.from("book-images").getPublicUrl(r.storage_path).data
          .publicUrl
    );
  }
  return detail;
}

// 도서 등록(/register 화면에서 호출)
// - 비로그인 또는 Supabase 미설정이면 mock 저장소로 저장
// - DB insert 실패해도 화면 흐름이 끊기지 않도록 mock 으로 폴백
// - 사진 업로드는 호출자가 createBook 성공 후 uploadBookImages(id, files) 로 별도 호출
export async function createBook(input: {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  category?: string;
  state: "최상" | "상" | "중" | "하";
  priceNumber: number;
  free?: boolean;
  region?: string;
  description?: string;
  comment?: string;
  tradeMethod?: string;
  coverUrl?: string; // 외부 표지 URL (네이버 검색 결과 등)
  // 0011 에서 추가된 네이버 메타데이터 — 등록 폼에서 검색 결과 선택 시 함께 전달
  originalPriceNumber?: number;
  synopsis?: string;
  pubDate?: string; // YYYY-MM-DD
  sourceUrl?: string;
}): Promise<{ id: string }> {
  const supabase = await tryClient();
  if (!supabase) {
    const created = mockCreateBook(input);
    return { id: created.id };
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const created = mockCreateBook(input);
    return { id: created.id };
  }
  // 한글 등급("최상" 등) → DB enum("A_PLUS" 등). 매핑 없으면 안전하게 "A"
  const stateEnum = STATE_TO_LABEL_FROM_KOR[input.state] ?? "A";
  const { data, error } = await supabase
    .from("books")
    .insert({
      seller_id: auth.user.id,
      title: input.title,
      author: input.author ?? null,
      publisher: input.publisher ?? null,
      isbn: input.isbn ?? null,
      category: input.category ?? null,
      state: stateEnum,
      price: input.free ? 0 : input.priceNumber,
      original_price:
        input.originalPriceNumber && input.originalPriceNumber > 0
          ? input.originalPriceNumber
          : null,
      trade_method: "BOTH",
      region: input.region ?? null,
      description: input.description ?? null,
      cover_url: input.coverUrl ?? null,
      synopsis: input.synopsis ?? null,
      pub_date: input.pubDate ?? null,
      source_url: input.sourceUrl ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    const created = mockCreateBook(input);
    return { id: created.id };
  }
  return { id: (data as { id: string }).id };
}

// 내가 등록한 책 — 마이페이지 "판매중/판매내역" 화면용
// 비로그인이거나 mock 모드면 mock 저장소에서 seller="나" 책을 반환
export async function listMyBooks(): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListBooks().filter((b) => b.seller === "나");
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockListBooks().filter((b) => b.seller === "나");
  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return (data as BookRow[]).map(rowToSummary);
}

// 판매 취소(등록 취소) — 책 상태를 HIDDEN 으로 만들어 목록/검색에서 제외
// 거래중인 트랜잭션이 있어도 책 자체는 그대로 두고 노출만 끈다
// 반환: true = 성공, false = 실패(권한/대상 없음)
export async function cancelBook(bookId: string): Promise<boolean> {
  const supabase = await tryClient();
  if (!supabase) return mockCancelBook(bookId);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return mockCancelBook(bookId);
  const { error } = await supabase
    .from("books")
    .update({ status: "HIDDEN" })
    .eq("id", bookId)
    .eq("seller_id", auth.user.id); // RLS와 별개로 클라이언트 가드
  return !error;
}

// 사진 업로드 — Storage book-images 버킷에 업로드 후 book_images INSERT
// - 비로그인/Supabase 미설정/mock id 면 no-op (mock 모드는 사진을 영구 저장하지 않는다)
// - 일부 파일이 실패해도 나머지는 그대로 진행 (멈추지 않음)
// - opts.setCoverIfMissing: 첫 업로드 이미지 URL 을 books.cover_url 에 채움 (이미 값 있으면 유지)
// 반환: 업로드된 파일들의 public URL 배열
export async function uploadBookImages(
  bookId: string,
  files: File[],
  opts?: { setCoverIfMissing?: boolean }
): Promise<{ ok: boolean; urls: string[] }> {
  if (files.length === 0) return { ok: true, urls: [] };
  const supabase = await tryClient();
  if (!supabase) return { ok: false, urls: [] };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, urls: [] };
  if (!isUuid(bookId)) return { ok: false, urls: [] };

  const urls: string[] = [];
  const insertRows: {
    book_id: string;
    storage_path: string;
    sort_order: number;
  }[] = [];
  const stamp = Date.now();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    // 확장자는 파일명에서 (없으면 mime 에서) 추출. 너무 긴 값은 안전하게 잘라낸다
    const fromName = f.name.includes(".")
      ? f.name.split(".").pop()
      : undefined;
    const fromMime = f.type.includes("/") ? f.type.split("/").pop() : undefined;
    const ext = ((fromName || fromMime || "jpg") as string)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || "jpg";
    const path = `${bookId}/${stamp}-${i}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("book-images")
      .upload(path, f, { contentType: f.type || undefined, upsert: false });
    if (upErr) {
      console.error("[uploadBookImages] upload failed", path, upErr);
      continue;
    }
    insertRows.push({ book_id: bookId, storage_path: path, sort_order: i });
    urls.push(
      supabase.storage.from("book-images").getPublicUrl(path).data.publicUrl
    );
  }
  if (insertRows.length > 0) {
    const { error: insErr } = await supabase
      .from("book_images")
      .insert(insertRows);
    if (insErr) console.error("[uploadBookImages] insert failed", insErr);
  }
  // cover_url 이 비어 있을 때만 첫 사진 URL 로 채워준다 (네이버 표지 우선)
  if (opts?.setCoverIfMissing && urls.length > 0) {
    await supabase
      .from("books")
      .update({ cover_url: urls[0] })
      .eq("id", bookId)
      .is("cover_url", null);
  }
  return { ok: true, urls };
}

// 영구 삭제 — 책 행을 DELETE
// transactions.book_id 가 ON DELETE RESTRICT 라서 거래 이력이 있으면 실패
// → 그 경우 호출자가 cancelBook 으로 폴백하도록 false 반환
export async function deleteBook(bookId: string): Promise<boolean> {
  const supabase = await tryClient();
  if (!supabase) return mockDeleteBook(bookId);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return mockDeleteBook(bookId);
  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", bookId)
    .eq("seller_id", auth.user.id);
  return !error;
}

// ---------- Orders / Transactions (주문/거래) ----------

// 내 주문 내역(구매한 것 + 판매한 것 모두) 조회
// transactions 테이블에서 buyer_id 또는 seller_id 가 나인 행을 가져옴
export async function listOrders(): Promise<OrderRow[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListOrders();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockListOrders();
  // join 문법: transactions + books + 양쪽 프로필(판매자/구매자)
  // - 구매측 행은 판매자 이름, 판매측 행은 구매자 이름을 보여줘야 하므로 둘 다 가져온다
  const { data } = await supabase
    .from("transactions")
    .select(
      `*, books(title,
        seller:profiles!books_seller_id_fkey(display_name)),
        buyer:profiles!transactions_buyer_id_fkey(display_name)`
    )
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`) // 내가 사거나/판 거래
    .order("created_at", { ascending: false });
  if (!data) return mockListOrders();
  return data.map((t: any): OrderRow => {
    const num = Number(t.offered_price ?? 0);
    const isBuy = t.buyer_id === uid;
    return {
      id: t.id,
      title: t.books?.title ?? "도서",
      info: isBuy
        ? `판매자: ${anonymizeName(t.books?.seller?.display_name, "-")}`
        : `구매자: ${anonymizeName(t.buyer?.display_name, "-")}`,
      price: `${num.toLocaleString()}원`,
      priceNumber: num,
      // PAID(결제 완료)도 사용자 시점에선 "배송중" — 발송 후 SHIPPING 으로 좁히기 전까지 동일 처리
      // (mock 의 createOrder 가 status:"배송중" 으로 만드는 것과 일치)
      status:
        t.status === "SHIPPING" || t.status === "PAID"
          ? "배송중"
          : t.status === "COMPLETED"
          ? "거래완료"
          : t.status === "CANCELED"
          ? "취소"
          : "거래중",
      date: new Date(t.created_at).toLocaleDateString("ko-KR"),
      bookId: t.book_id,
      side: isBuy ? "buy" : "sell",
    };
  });
}

// 주문 단건 상세 (구매완료/거래확정 화면에서 사용)
export async function fetchOrder(id: string): Promise<OrderRow | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetOrder(id) ?? null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  const { data } = await supabase
    .from("transactions")
    .select(
      "*, books(title, seller:profiles!books_seller_id_fkey(display_name))"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockGetOrder(id) ?? null;
  const t: any = data;
  const num = Number(t.offered_price ?? 0);
  const isBuy = uid != null && t.buyer_id === uid;
  return {
    id: t.id,
    title: t.books?.title ?? "도서",
    info: `판매자: ${anonymizeName(t.books?.seller?.display_name, "-")}`,
    price: `${num.toLocaleString()}원`,
    priceNumber: num,
    // listOrders 와 동일한 매핑 — PAID 도 "배송중"으로 묶음
    status:
      t.status === "SHIPPING" || t.status === "PAID"
        ? "배송중"
        : t.status === "COMPLETED"
        ? "거래완료"
        : t.status === "CANCELED"
        ? "취소"
        : "거래중",
    date: new Date(t.created_at).toLocaleDateString("ko-KR"),
    bookId: t.book_id,
    side: isBuy ? "buy" : "sell",
  };
}

// 결제 시점에 호출 — 트랜잭션을 PAID 상태로 만들고 책은 SOLD 처리
// FIXME: 실제 PG(결제 게이트웨이) 연동 없음. 현재는 결제 성공으로 간주하고 바로 PAID 로 기록
export async function createOrder(input: {
  bookId: string;
}): Promise<{ id: string }> {
  const supabase = await tryClient();
  if (!supabase) {
    const created = mockCreateOrder({
      bookId: input.bookId,
      status: "배송중",
    });
    return { id: created.id };
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const created = mockCreateOrder({
      bookId: input.bookId,
      status: "배송중",
    });
    return { id: created.id };
  }
  const { data: book } = await supabase
    .from("books")
    .select("id, seller_id, price")
    .eq("id", input.bookId)
    .maybeSingle();
  if (!book) {
    const created = mockCreateOrder({
      bookId: input.bookId,
      status: "배송중",
    });
    return { id: created.id };
  }
  const b = book as any;
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      book_id: b.id,
      buyer_id: auth.user.id,
      seller_id: b.seller_id,
      offered_price: b.price,
      trade_method: "PARCEL",
      status: "PAID",
    })
    .select("id")
    .single();
  if (error || !data) {
    const created = mockCreateOrder({
      bookId: input.bookId,
      status: "배송중",
    });
    return { id: created.id };
  }
  // 결제가 끝났으니 책 상태도 SOLD 로 동기화 (다른 사람 화면에서 더 이상 노출 X)
  await supabase.from("books").update({ status: "SOLD" }).eq("id", b.id);
  return { id: (data as { id: string }).id };
}

// 거래 확정 — 구매자가 "거래완료" 버튼을 눌렀을 때 호출
// 0010 의 BEFORE UPDATE 트리거가 PAID→COMPLETED 만, 그것도 buyer 가 호출했을 때만 허용한다.
// 정책 위반(이미 완료/취소된 거래, 권한 없음) 시 PostgreSQL 에러가 올라오는데
// 기존 코드는 await 만 하고 무시 → 사용자에게 실패가 안 보였다. 에러를 throw 해서
// useCompleteOrder.onError 로 토스트를 띄울 수 있게 한다.
export async function completeOrder(id: string): Promise<void> {
  const supabase = await tryClient();
  if (!supabase) {
    mockUpdateOrderStatus(id, "거래완료");
    return;
  }
  const { error } = await supabase
    .from("transactions")
    .update({ status: "COMPLETED" })
    .eq("id", id);
  if (error) {
    console.error("[completeOrder] failed", error);
    throw error;
  }
}

// ---------- Chats (채팅) ----------

// 내 채팅방 목록 — 마지막 메시지 시간 기준 내림차순
// unread = 상대(sender_id != me)가 보낸 read_at IS NULL 메시지 수. 두 번째 쿼리로 집계
export async function listChats(): Promise<ChatRow[]> {
  const supabase = await tryClient();
  if (!supabase) {
    const list = mockListChats();
    const map = mockUnreadByRoom();
    return list.map((c) => ({ ...c, unread: map[c.id] ?? 0 }));
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) {
    const list = mockListChats();
    const map = mockUnreadByRoom();
    return list.map((c) => ({ ...c, unread: map[c.id] ?? 0 }));
  }
  const { data } = await supabase
    .from("chat_rooms")
    .select("*, books(title, status)")
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
    .order("last_message_at", { ascending: false });
  if (!data) return mockListChats();

  const rooms = data as any[];
  // 미읽음 메시지를 한 번에 가져와 room_id 별로 카운트 — 방이 적을 때 충분히 빠르다
  const roomIds = rooms.map((r) => r.id);
  const unreadByRoom: Record<string, number> = {};
  if (roomIds.length > 0) {
    const { data: unread } = await supabase
      .from("messages")
      .select("room_id")
      .in("room_id", roomIds)
      .neq("sender_id", uid)
      .is("read_at", null);
    for (const m of (unread as { room_id: string }[] | null) ?? []) {
      unreadByRoom[m.room_id] = (unreadByRoom[m.room_id] ?? 0) + 1;
    }
  }

  return rooms.map((r): ChatRow => ({
    id: r.id,
    user: "상대방",
    book: r.books?.title ?? "",
    bookId: r.book_id,
    msg: r.last_message ?? "",
    time: r.last_message_at
      ? new Date(r.last_message_at).toLocaleTimeString("ko-KR", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
    unread: unreadByRoom[r.id] ?? 0,
    buying: r.buyer_id === uid,
    // 취소된(HIDDEN) 책의 채팅도 그대로 남되 배지에 "취소" 가 뜨도록
    status: r.books?.status
      ? bookStatusToUI(r.books.status as BookStatus)
      : "selling",
  }));
}

// 채팅방 단건 조회
// chat_rooms + 책 + 양쪽 프로필 join 후 ChatRow 형태로 정규화
// 비로그인/Supabase 미설정/UUID 가 아닌 mock id 면 mock 저장소에서 반환
export async function fetchChat(id: string): Promise<ChatRow | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetChat(id) ?? null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockGetChat(id) ?? null;
  // mock 시드 id (예: "c-1") 가 들어오면 Supabase 에 쿼리 보내지 말고 바로 mock
  if (!isUuid(id)) return mockGetChat(id) ?? null;
  const { data } = await supabase
    .from("chat_rooms")
    .select(
      `*, books(title, status),
        buyer:profiles!chat_rooms_buyer_id_fkey(display_name),
        seller:profiles!chat_rooms_seller_id_fkey(display_name)`
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockGetChat(id) ?? null;
  const r: any = data;
  const isBuying = r.buyer_id === uid;
  // 상대방 = 내가 buyer면 seller, 내가 seller면 buyer
  // 회원가입 시 실명을 그대로 display_name 에 저장하므로 마스킹해서 표시
  const counterpartName = anonymizeName(
    isBuying ? r.seller?.display_name : r.buyer?.display_name
  );
  return {
    id: r.id,
    user: counterpartName,
    book: r.books?.title ?? "",
    bookId: r.book_id ?? "",
    msg: r.last_message ?? "",
    time: r.last_message_at
      ? new Date(r.last_message_at).toLocaleTimeString("ko-KR", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
    unread: 0,
    buying: isBuying,
    status: r.books?.status
      ? bookStatusToUI(r.books.status as BookStatus)
      : "selling",
  };
}

// 도서 ID 로 채팅방을 가져오거나 새로 만든다 — "채팅" 버튼 진입점에서 사용
// - 본인 책이면 null 반환 (자기 자신과 채팅 불가)
// - 같은 (bookId, buyer=나, seller=책 판매자) 조합의 방이 이미 있으면 재사용
// - 없으면 INSERT (UNIQUE 제약 위반 23505 시 다시 SELECT 로 안전하게 fallback)
// 반환: 채팅방 id (UUID 또는 mock c-xxx)
export type ChatRoomResult =
  | { id: string }
  | { error: "self" | "unauthenticated" | "book_not_found" | "unknown" };

export async function getOrCreateChatRoom(
  bookId: string
): Promise<ChatRoomResult> {
  const supabase = await tryClient();
  if (!supabase) return { id: mockGetOrCreateChatRoomByBook(bookId) };
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { id: mockGetOrCreateChatRoomByBook(bookId) };
  // mock 시드 bookId — Supabase 에 쿼리해봐야 없으니 mock 으로
  if (!isUuid(bookId)) return { id: mockGetOrCreateChatRoomByBook(bookId) };

  // 책의 판매자 조회
  const { data: book } = await supabase
    .from("books")
    .select("seller_id")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) return { error: "book_not_found" };
  const sellerId = (book as { seller_id: string }).seller_id;
  if (sellerId === uid) return { error: "self" };

  // 기존 방 조회
  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("book_id", bookId)
    .eq("buyer_id", uid)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (existing) return { id: (existing as { id: string }).id };

  // 새로 생성
  const { data: created, error } = await supabase
    .from("chat_rooms")
    .insert({ book_id: bookId, buyer_id: uid, seller_id: sellerId })
    .select("id")
    .single();
  // UNIQUE 위반(동시 생성 race) 시 다시 SELECT 로 안전 복구
  if (error?.code === "23505") {
    const { data: again } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("book_id", bookId)
      .eq("buyer_id", uid)
      .eq("seller_id", sellerId)
      .maybeSingle();
    if (again) return { id: (again as { id: string }).id };
  }
  if (error || !created) {
    console.error("[getOrCreateChatRoom] insert failed", error);
    return { error: "unknown" };
  }
  return { id: (created as { id: string }).id };
}

// ---------- Messages (채팅 메시지) ----------

// 메시지 목록 조회 — 시간순 오름차순. 비로그인/mock은 mock 저장소
export async function listMessages(roomId: string): Promise<MessageRowUI[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListMessages(roomId).map(mockMsgToUI);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockListMessages(roomId).map(mockMsgToUI);
  // mock 시드 roomId 면 Supabase 쿼리하지 않고 mock 저장소
  if (!isUuid(roomId)) return mockListMessages(roomId).map(mockMsgToUI);
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, type, sender_id, read_at, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[listMessages] Supabase error", error);
    return [];
  }
  if (!data) return [];
  return (data as any[]).map((m) => dbMsgToUI(m, uid));
}

// 메시지 전송 — INSERT 후 chat_rooms.last_message/last_message_at 동기화
// 반환: 새로 만든 메시지(UI 형태). 실패 시 null
export async function sendMessage(
  roomId: string,
  body: string
): Promise<MessageRowUI | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const supabase = await tryClient();
  if (!supabase) return mockMsgToUI(mockSendMessage(roomId, trimmed));
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockMsgToUI(mockSendMessage(roomId, trimmed));
  // mock 시드 roomId — Supabase 에 INSERT 하면 UUID 형식/FK 에러로 무조건 실패하므로 mock 으로
  if (!isUuid(roomId)) return mockMsgToUI(mockSendMessage(roomId, trimmed));
  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: uid,
      body: trimmed,
      type: "TEXT",
    })
    .select("id, body, type, sender_id, read_at, created_at")
    .single();
  if (error || !data) {
    // 실제 원인을 콘솔에서 확인할 수 있도록 (RLS, FK 위반 등)
    console.error("[sendMessage] Supabase INSERT failed", error);
    return null;
  }
  // 채팅 목록의 마지막 메시지 동기화 (실패해도 메시지 자체는 들어갔으니 결과만 반환)
  await supabase
    .from("chat_rooms")
    .update({
      last_message: trimmed,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  return dbMsgToUI(data as any, uid);
}

// 채팅방 진입 시 — 상대(sender_id != me)가 보낸 메시지 중 read_at 이 NULL 인 것을 일괄 갱신
// idempotent: 이미 읽음인 메시지는 read_at IS NULL 조건으로 자동 스킵
// 반환: 갱신된 행 수 (호출자가 0 이면 캐시 invalidate 스킵 가능)
export async function markRoomMessagesRead(roomId: string): Promise<number> {
  const supabase = await tryClient();
  if (!supabase) return mockMarkRoomRead(roomId);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockMarkRoomRead(roomId);
  if (!isUuid(roomId)) return mockMarkRoomRead(roomId);
  const { data, error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .neq("sender_id", uid)
    .is("read_at", null)
    .select("id");
  if (error) {
    console.error("[markRoomMessagesRead] failed", error);
    return 0;
  }
  return (data as { id: string }[] | null)?.length ?? 0;
}

function mockMsgToUI(m: MockMessage): MessageRowUI {
  return {
    id: m.id,
    body: m.body,
    type: m.type,
    mine: m.mine,
    read: m.read,
    createdAt: m.createdAt,
  };
}

// DB row → UI 형태. type 은 DB의 'TEXT'/'SYSTEM' 등 → 소문자로 정규화
function dbMsgToUI(
  m: {
    id: string;
    body: string | null;
    type: string;
    sender_id: string;
    read_at: string | null;
    created_at: string;
  },
  uid: string
): MessageRowUI {
  const t = (m.type ?? "TEXT").toLowerCase();
  return {
    id: m.id,
    body: m.body ?? "",
    type: t === "system" ? "system" : "text",
    mine: m.sender_id === uid,
    read: !!m.read_at,
    createdAt: m.created_at,
  };
}

// ---------- Notifications (알림) ----------

// 내 알림 목록. 최신 50개까지만
export async function listNotifications(): Promise<NotificationRow[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListNotifications();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockListNotifications();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!data) return mockListNotifications();
  // DB의 kind 값을 화면용 type 으로 매핑
  // - MESSAGE → 채팅 알림
  // - PRICE_DROP / INFO → 시스템 알림
  // - 그 외(거래 관련) → trade 알림
  return data.map((n: any): NotificationRow => ({
    id: n.id,
    type:
      n.kind === "MESSAGE"
        ? "chat"
        : n.kind === "PRICE_DROP" || n.kind === "INFO"
        ? "system"
        : "trade",
    title: n.payload?.title ?? "알림",
    body: n.payload?.body ?? "",
    time: new Date(n.created_at).toLocaleString("ko-KR"),
    unread: !n.read_at,
    // 라우팅용 도메인 id — 0006 트리거 payload 의 키 이름과 일치
    roomId: n.payload?.room_id ?? undefined,
    transactionId: n.payload?.transaction_id ?? undefined,
    bookId: n.payload?.book_id ?? undefined,
  }));
}

// 알림 단건 읽음 처리 — 사용자가 알림 항목을 클릭했을 때 호출
// Supabase 미설정/비로그인이면 mock store 의 해당 항목 unread 를 false 로 토글
// (그렇지 않으면 다음 refetch 때 다시 unread:true 로 돌아와 빨간점이 안 사라짐)
export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await tryClient();
  if (!supabase) {
    mockMarkNotificationRead(id);
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    mockMarkNotificationRead(id);
    return;
  }
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.id) // RLS와 별개로 추가 가드
    .is("read_at", null); // 이미 읽음이면 갱신 스킵
}

// 특정 채팅방의 chat 알림을 일괄 읽음 처리 — 사용자가 그 방을 보고 있는 동안엔
// "안 읽은 알림" 빨간점이 다시 켜지지 않게 한다 (인앱 알림 한정의 단순 해법).
// payload->>room_id 가 roomId 인 MESSAGE kind 의 미읽음 알림만 read_at 갱신.
// idempotent — 이미 읽음인 행은 .is("read_at", null) 로 자동 스킵.
// 반환: 갱신된 행 수 (호출자가 0 이면 캐시 invalidate 스킵 가능)
export async function markRoomChatNotificationsRead(
  roomId: string
): Promise<number> {
  const supabase = await tryClient();
  if (!supabase) return mockMarkRoomChatNotificationsRead(roomId);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockMarkRoomChatNotificationsRead(roomId);
  // mock 시드 roomId(c-1 등) 면 Supabase 에는 그런 알림이 없다 → mock 처리
  if (!isUuid(roomId)) return mockMarkRoomChatNotificationsRead(roomId);
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", uid)
    .eq("kind", "MESSAGE")
    .filter("payload->>room_id", "eq", roomId)
    .is("read_at", null)
    .select("id");
  if (error) {
    console.error("[markRoomChatNotificationsRead] failed", error);
    return 0;
  }
  return (data as { id: string }[] | null)?.length ?? 0;
}

// 내 알림 전부 읽음 처리 — 헤더 "모두 읽음" 버튼에서 호출
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await tryClient();
  if (!supabase) {
    mockMarkAllNotificationsRead();
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    mockMarkAllNotificationsRead();
    return;
  }
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", auth.user.id)
    .is("read_at", null);
}

// ---------- Reviews (후기) ----------

// 후기 작성 화면에 필요한 정보(상대방 이름/책 제목/거래일/이미 작성 여부)를 한 번에 조회
// 거래(transactions) 한 행 + 책 + 상대방 프로필을 join 으로 가져온다
export type ReviewContext = {
  revieweeName: string;
  revieweeId: string;
  bookTitle: string;
  bookId: string;
  completedAt: string;
  alreadyReviewed: boolean;
};

export async function fetchReviewContext(
  transactionId: string
): Promise<ReviewContext | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetReviewContext(transactionId);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockGetReviewContext(transactionId);

  // 거래 정보 + 책 + 양쪽 프로필 + 기존 후기 여부 동시 조회
  const [{ data: tx }, { data: existing }] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        `id, buyer_id, seller_id, created_at,
         books(id, title),
         buyer:profiles!transactions_buyer_id_fkey(id, display_name),
         seller:profiles!transactions_seller_id_fkey(id, display_name)`
      )
      .eq("id", transactionId)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle(),
  ]);

  if (!tx) return mockGetReviewContext(transactionId);
  const t = tx as any;

  // 내가 buyer면 reviewee=seller, 내가 seller면 reviewee=buyer
  // 어느 쪽도 아니면(거래 당사자가 아님) 후기 작성 권한 없음 → null
  let reviewee: { id: string; display_name: string | null } | null = null;
  if (t.buyer_id === uid) reviewee = t.seller;
  else if (t.seller_id === uid) reviewee = t.buyer;
  if (!reviewee) return null;

  return {
    revieweeName: anonymizeName(reviewee.display_name),
    revieweeId: reviewee.id,
    bookTitle: t.books?.title ?? "도서",
    bookId: t.books?.id ?? "",
    completedAt: new Date(t.created_at).toLocaleDateString("ko-KR"),
    alreadyReviewed: !!existing,
  };
}

// 후기 INSERT — UNIQUE(transaction_id) 위반 시 에러 반환
// reviewee_id 는 호출자가 fetchReviewContext 로 미리 알아낸 값을 넘기는 게 안전
export async function createReview(input: {
  transactionId: string;
  revieweeId: string;
  rating: number;
  tags: string[];
  comment?: string;
}): Promise<{ id: string; alreadyExists?: boolean }> {
  const supabase = await tryClient();
  if (!supabase) {
    const r = mockCreateReview({
      transactionId: input.transactionId,
      revieweeId: input.revieweeId,
      rating: input.rating,
      tags: input.tags,
      comment: input.comment,
    });
    return { id: r.id };
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) {
    const r = mockCreateReview({
      transactionId: input.transactionId,
      revieweeId: input.revieweeId,
      rating: input.rating,
      tags: input.tags,
      comment: input.comment,
    });
    return { id: r.id };
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      transaction_id: input.transactionId,
      reviewer_id: uid,
      reviewee_id: input.revieweeId,
      rating: input.rating,
      tags: input.tags,
      comment: input.comment ?? null,
    })
    .select("id")
    .single();

  // 23505: PostgreSQL UNIQUE 제약 위반 — 이미 후기를 작성한 거래
  if (error?.code === "23505") {
    return { id: "", alreadyExists: true };
  }
  if (error || !data) throw error ?? new Error("후기 저장 실패");
  return { id: (data as { id: string }).id };
}

// 내가 받은 후기 목록 — /mypage/reviews 화면용
// reviews(reviewee_id = 나) ⨝ reviewer profile ⨝ transactions ⨝ books 한 번에
// 비로그인/Supabase 미설정이면 mock 저장소의 시드 데이터를 반환
// userId 인자가 없으면 현재 로그인 사용자(auth.uid) 기준
export async function listReceivedReviews(
  userId?: string
): Promise<ReceivedReview[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListReceivedReviews();
  const { data: auth } = await supabase.auth.getUser();
  const uid = userId ?? auth.user?.id;
  if (!uid) return mockListReceivedReviews();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `id, rating, tags, comment, created_at,
       reviewer:profiles!reviews_reviewer_id_fkey(id, display_name, avatar_url),
       transactions(book_id, books(id, title))`
    )
    .eq("reviewee_id", uid)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as any[]).map((r): ReceivedReview => {
    // 후기 작성자 이름은 다른 사용자에게 노출되므로 마스킹
    const reviewerName = anonymizeName(r.reviewer?.display_name, "익명");
    const reviewerId = r.reviewer?.id ?? "anon";
    const book = r.transactions?.books;
    return {
      id: r.id,
      rating: r.rating,
      tags: r.tags ?? [],
      comment: r.comment ?? undefined,
      createdAt: r.created_at,
      reviewerName,
      reviewerSeed: reviewerId,
      bookTitle: book?.title ?? "도서",
      bookId: book?.id,
    };
  });
}

// ---------- Likes (찜) ----------

// 단일 도서의 찜 여부 — 도서 상세 페이지 진입 시 초기 상태 결정에 사용
// 비로그인이거나 Supabase 미설정이면 mock 저장소에서 조회
export async function isLiked(bookId: string): Promise<boolean> {
  const supabase = await tryClient();
  if (!supabase) return mockIsLiked(bookId);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockIsLiked(bookId);
  const { data } = await supabase
    .from("likes")
    .select("book_id")
    .eq("user_id", uid)
    .eq("book_id", bookId)
    .maybeSingle();
  return !!data;
}

// 내가 찜한 책 ID 목록 — 피드/검색 결과의 카드 초기 상태를 한 번에 채우는 용도
// 결과는 Set 으로 반환해 카드별 lookup이 O(1) 이 되도록 한다
export async function listLikedBookIds(): Promise<Set<string>> {
  const supabase = await tryClient();
  if (!supabase) return new Set(mockListLikedIds());
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return new Set(mockListLikedIds());
  const { data } = await supabase
    .from("likes")
    .select("book_id")
    .eq("user_id", uid);
  if (!data) return new Set();
  return new Set((data as { book_id: string }[]).map((r) => r.book_id));
}

// 내가 찜한 책 전체 목록(BookSummary) — /mypage/likes 화면용
// likes ↔ books inner join 으로 한 번에 가져온다.
// 판매자가 취소한(HIDDEN) 책은 "사라진 책"이므로 내 찜 목록에서도 제외 — 홈 피드와 동일한 가시성
export async function listLikedBooks(): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) {
    const ids = new Set(mockListLikedIds());
    return mockListBooks().filter(
      (b) => ids.has(b.id) && b.status !== "canceled"
    );
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) {
    const ids = new Set(mockListLikedIds());
    return mockListBooks().filter(
      (b) => ids.has(b.id) && b.status !== "canceled"
    );
  }
  const { data } = await supabase
    .from("likes")
    .select("created_at, books(*)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return (data as { books: BookRow | null }[])
    .filter((r): r is { books: BookRow } => !!r.books)
    .filter((r) => r.books.status !== "HIDDEN") // 취소된 책은 제외
    .map((r) => rowToSummary(r.books));
}

// 찜 토글 — likes 행을 INSERT/DELETE 하면 0005_likes_count_trigger.sql 의
// SECURITY DEFINER 트리거가 books.like_count 를 자동 갱신한다.
// (클라이언트에서 books 를 직접 UPDATE 하면 books_update_own RLS 때문에
//  판매자가 아닌 사용자에서는 카운트가 절대 올라가지 않는다 — 트리거로 우회)
// 반환: { liked: 새로운 상태, likeCount: 트리거 반영 후 다시 읽은 값 }
export async function toggleLike(
  bookId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const supabase = await tryClient();
  if (!supabase) return mockToggleLike(bookId);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  // 비로그인 — mock 저장소에 보관해 UI 토글은 즉시 보이게 한다
  if (!uid) return mockToggleLike(bookId);

  // 현재 찜 여부 확인
  const { data: existing } = await supabase
    .from("likes")
    .select("book_id")
    .eq("user_id", uid)
    .eq("book_id", bookId)
    .maybeSingle();
  const wasLiked = !!existing;

  if (wasLiked) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", uid)
      .eq("book_id", bookId);
  } else {
    await supabase
      .from("likes")
      .insert({ user_id: uid, book_id: bookId });
  }

  // 트리거 반영 후 새 like_count 를 다시 읽어서 반환
  const { data: book } = await supabase
    .from("books")
    .select("like_count")
    .eq("id", bookId)
    .maybeSingle();
  const nextCount = (book as { like_count?: number } | null)?.like_count ?? 0;

  return { liked: !wasLiked, likeCount: nextCount };
}
