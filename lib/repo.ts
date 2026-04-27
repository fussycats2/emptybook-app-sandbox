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
  mockListOrders,
  mockToggleLike,
  mockUpdateOrderStatus,
  type MockBook,
  type MockChat,
  type MockNotification,
  type MockOrder,
  type MockReview,
} from "./mockData";
import type { BookSummary } from "@/components/ui/BookCard";
import { STATE_LABEL, type BookRow, type BookState } from "./supabase/types";

export type BookDetail = MockBook;
export type OrderRow = MockOrder;
export type ChatRow = MockChat;
export type NotificationRow = MockNotification;

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
    status: isFree
      ? "free"
      : b.status === "RESERVED"
      ? "reserved"
      : b.status === "SOLD"
      ? "sold"
      : "selling",
    free: isFree,
    likes: b.like_count,
    coverUrl: b.cover_url ?? undefined,
  };
}

// DB의 books row → 상세 화면용(BookDetail) 형태로 변환
// summary 보다 더 많은 필드(설명, 등록일, 거래방식 등)를 채운다
function rowToDetail(b: BookRow): BookDetail {
  const isFree = b.price === 0;
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? "",
    publisher: b.publisher ?? undefined,
    isbn: b.isbn ?? undefined,
    category: b.category ?? "기타",
    price: isFree ? "무료나눔" : `${b.price.toLocaleString()}원`,
    priceNumber: b.price,
    state: STATE_LABEL[b.state],
    loc: b.region ?? undefined,
    region: b.region ?? undefined,
    date: new Date(b.created_at).toLocaleDateString("ko-KR"),
    description: b.description ?? undefined,
    comment: b.description ?? undefined,
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
    status: isFree
      ? "free"
      : b.status === "RESERVED"
      ? "reserved"
      : b.status === "SOLD"
      ? "sold"
      : "selling",
    free: isFree,
    likes: b.like_count,
    chats: 0,
    coverUrl: b.cover_url ?? undefined,
  };
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

// ---------- Books (도서) ----------

// 홈 피드용 — 최근 등록된 책 목록
// HIDDEN(신고/숨김) 상태인 책은 제외하고, 최신순으로 limit 개 조회
export async function listRecentBooks(limit = 10): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListBooks({ limit }); // Supabase 없으면 mock
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .neq("status", "HIDDEN")
    .order("created_at", { ascending: false })
    .limit(limit);
  // 쿼리 실패 시에도 화면은 계속 보여주도록 mock 폴백
  if (error || !data) return mockListBooks({ limit });
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
      if (opts.q && !b.title.includes(opts.q) && !(b.author ?? "").includes(opts.q))
        return false;
      if (opts.category && b.category !== opts.category) return false;
      if (opts.state && b.state !== opts.state) return false;
      return true;
    });
  }
  // Supabase 쿼리 빌더에 조건을 누적해서 붙여나간다
  let query = supabase.from("books").select("*").neq("status", "HIDDEN");
  if (opts.q) query = query.ilike("title", `%${opts.q}%`); // 대소문자 무시 부분일치
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

// 단일 도서 상세 조회 (도서 상세 페이지에서 호출)
export async function fetchBook(id: string): Promise<BookDetail | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetBook(id) ?? null;
  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockGetBook(id) ?? null;
  return rowToDetail(data as BookRow);
}

// 도서 등록(/register 화면에서 호출)
// - 비로그인 또는 Supabase 미설정이면 mock 저장소로 저장
// - DB insert 실패해도 화면 흐름이 끊기지 않도록 mock 으로 폴백
// TODO: 이미지 업로드(book_images 테이블 + Storage 버킷) 연동 필요
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
      trade_method: "BOTH",
      region: input.region ?? null,
      description: input.description ?? null,
      cover_url: input.coverUrl ?? null,
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
        ? `판매자: ${t.books?.seller?.display_name ?? "-"}`
        : `구매자: ${t.buyer?.display_name ?? "-"}`,
      price: `${num.toLocaleString()}원`,
      priceNumber: num,
      status:
        t.status === "SHIPPING"
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
    info: `판매자: ${t.books?.seller?.display_name ?? "-"}`,
    price: `${num.toLocaleString()}원`,
    priceNumber: num,
    status:
      t.status === "SHIPPING"
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
export async function completeOrder(id: string) {
  const supabase = await tryClient();
  if (!supabase) {
    mockUpdateOrderStatus(id, "거래완료");
    return;
  }
  await supabase
    .from("transactions")
    .update({ status: "COMPLETED" })
    .eq("id", id);
}

// ---------- Chats (채팅) ----------

// 내 채팅방 목록 — 마지막 메시지 시간 기준 내림차순
export async function listChats(): Promise<ChatRow[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListChats();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockListChats();
  const { data } = await supabase
    .from("chat_rooms")
    .select("*, books(title, status)")
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
    .order("last_message_at", { ascending: false });
  if (!data) return mockListChats();
  return data.map((r: any): ChatRow => ({
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
    unread: 0,
    buying: r.buyer_id === uid,
    status:
      r.books?.status === "SOLD"
        ? "sold"
        : r.books?.status === "RESERVED"
        ? "reserved"
        : "selling",
  }));
}

// 채팅방 단건 조회
// TODO: 현재 항상 mock 만 반환. Supabase chat_rooms + messages 조회로 교체 필요
//       Realtime 메시지 구독 훅(useRealtimeChat)도 함께 작성 예정
export async function fetchChat(id: string): Promise<ChatRow | null> {
  return mockGetChat(id) ?? null;
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
  }));
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
    revieweeName: reviewee.display_name ?? "상대방",
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
// likes ↔ books inner join 으로 한 번에 가져온다
export async function listLikedBooks(): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) {
    const ids = new Set(mockListLikedIds());
    return mockListBooks().filter((b) => ids.has(b.id));
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) {
    const ids = new Set(mockListLikedIds());
    return mockListBooks().filter((b) => ids.has(b.id));
  }
  const { data } = await supabase
    .from("likes")
    .select("created_at, books(*)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (!data) return [];
  // books 가 null 인 행(연결 끊긴 책)은 걸러낸다
  return (data as { books: BookRow | null }[])
    .filter((r): r is { books: BookRow } => !!r.books)
    .map((r) => rowToSummary(r.books));
}

// 찜 토글 — 현재 상태 → 반대로 바꾸고, books.like_count 도 함께 ±1 갱신
// (DB에 트리거가 없어서 클라이언트가 직접 갱신. 동시성 race는 작은 사용자 베이스에서는 무시)
// 반환: { liked: 새로운 상태, likeCount: 갱신된 카운터 }
export async function toggleLike(
  bookId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const supabase = await tryClient();
  if (!supabase) return mockToggleLike(bookId);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  // 비로그인 — mock 저장소에 보관해 UI 토글은 즉시 보이게 하고, 로그인 후 동기화는 추후 과제
  if (!uid) return mockToggleLike(bookId);

  // 현재 likes 행 + 현재 like_count 동시 조회
  const [{ data: existing }, { data: book }] = await Promise.all([
    supabase
      .from("likes")
      .select("book_id")
      .eq("user_id", uid)
      .eq("book_id", bookId)
      .maybeSingle(),
    supabase
      .from("books")
      .select("like_count")
      .eq("id", bookId)
      .maybeSingle(),
  ]);

  const currentCount = (book as { like_count?: number } | null)?.like_count ?? 0;
  const wasLiked = !!existing;
  const nextCount = Math.max(0, currentCount + (wasLiked ? -1 : 1));

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
  // 카운터 동기화 (실패해도 토글 자체는 성공이므로 결과만 반환)
  await supabase
    .from("books")
    .update({ like_count: nextCount })
    .eq("id", bookId);

  return { liked: !wasLiked, likeCount: nextCount };
}
