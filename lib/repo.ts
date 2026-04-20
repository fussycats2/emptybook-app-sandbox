import {
  CATEGORIES,
  POPULAR_SEARCHES,
  POPULAR_SELLERS,
  RECENT_SEARCHES,
  mockCreateBook,
  mockCreateOrder,
  mockGetBook,
  mockGetChat,
  mockGetOrder,
  mockListBooks,
  mockListChats,
  mockListNotifications,
  mockListOrders,
  mockUpdateOrderStatus,
  type MockBook,
  type MockChat,
  type MockNotification,
  type MockOrder,
} from "./mockData";
import type { BookSummary } from "@/components/ui/BookCard";
import { STATE_LABEL, type BookRow, type BookState } from "./supabase/types";

export type BookDetail = MockBook;
export type OrderRow = MockOrder;
export type ChatRow = MockChat;
export type NotificationRow = MockNotification;

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

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const meta = {
  CATEGORIES,
  POPULAR_SELLERS,
  RECENT_SEARCHES,
  POPULAR_SEARCHES,
};

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
  };
}

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
  };
}

async function tryClient() {
  if (!isSupabaseConfigured) return null;
  try {
    const { supabaseBrowser } = await import("./supabase/client");
    return supabaseBrowser();
  } catch {
    return null;
  }
}

// ---------- Books ----------

export async function listRecentBooks(limit = 10): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListBooks({ limit });
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .neq("status", "HIDDEN")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return mockListBooks({ limit });
  return (data as BookRow[]).map(rowToSummary);
}

export async function searchBooks(opts: {
  q?: string;
  category?: string;
  state?: string;
}): Promise<BookSummary[]> {
  const supabase = await tryClient();
  if (!supabase) {
    const list = mockListBooks();
    return list.filter((b) => {
      if (opts.q && !b.title.includes(opts.q) && !(b.author ?? "").includes(opts.q))
        return false;
      if (opts.category && b.category !== opts.category) return false;
      if (opts.state && b.state !== opts.state) return false;
      return true;
    });
  }
  let query = supabase.from("books").select("*").neq("status", "HIDDEN");
  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.state && STATE_TO_LABEL_FROM_KOR[opts.state]) {
    query = query.eq("state", STATE_TO_LABEL_FROM_KOR[opts.state]);
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as BookRow[]).map(rowToSummary);
}

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
    })
    .select("id")
    .single();
  if (error || !data) {
    const created = mockCreateBook(input);
    return { id: created.id };
  }
  return { id: (data as { id: string }).id };
}

// ---------- Orders / Transactions ----------

export async function listOrders(): Promise<OrderRow[]> {
  const supabase = await tryClient();
  if (!supabase) return mockListOrders();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockListOrders();
  const { data } = await supabase
    .from("transactions")
    .select(
      "*, books(title, seller:profiles!books_seller_id_fkey(display_name))"
    )
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
    .order("created_at", { ascending: false });
  if (!data) return mockListOrders();
  return data.map((t: any): OrderRow => {
    const num = Number(t.offered_price ?? 0);
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
    };
  });
}

export async function fetchOrder(id: string): Promise<OrderRow | null> {
  const supabase = await tryClient();
  if (!supabase) return mockGetOrder(id) ?? null;
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
  };
}

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
  await supabase.from("books").update({ status: "SOLD" }).eq("id", b.id);
  return { id: (data as { id: string }).id };
}

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

// ---------- Chats ----------

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

export async function fetchChat(id: string): Promise<ChatRow | null> {
  return mockGetChat(id) ?? null;
}

// ---------- Notifications ----------

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
