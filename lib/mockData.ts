import type { BookSummary } from "@/components/ui/BookCard";
import type { SaleStatus } from "@/components/ui/StatusBadge";

export type MockBook = BookSummary & {
  publisher?: string;
  isbn?: string;
  originalPrice?: string;
  discount?: string;
  description?: string;
  comment?: string;
  seller?: string;
  sellerStats?: string;
  registeredAt?: string;
  tradeMethod?: string;
  category?: string;
  priceNumber: number;
  region?: string;
};

export type MockOrder = {
  id: string;
  title: string;
  info: string;
  price: string;
  priceNumber: number;
  status: "거래중" | "배송중" | "거래완료" | "취소";
  date: string;
  bookId: string;
  buyerName?: string;
};

export type MockChat = {
  id: string;
  user: string;
  book: string;
  bookId: string;
  msg: string;
  time: string;
  unread: number;
  buying: boolean;
  status: SaleStatus;
};

export type MockNotification = {
  id: string;
  type: "trade" | "chat" | "system";
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

const SEED_BOOKS: MockBook[] = [
  {
    id: "1",
    title: "채식주의자",
    author: "한강",
    publisher: "창비",
    isbn: "9788936434267",
    price: "6,000원",
    priceNumber: 6000,
    originalPrice: "13,000원",
    discount: "54% 할인",
    state: "상",
    loc: "마포구",
    region: "마포구",
    date: "1시간 전",
    description: "상태: A급 (밑줄/낙서 없음, 표지 깨끗)",
    comment:
      "한 번 정독 후 책장에 보관했던 책입니다. 깨끗하게 사용했어요. 빠른 거래 환영합니다 :)",
    seller: "책방마니아",
    sellerStats: "거래 42회 · ★ 4.9",
    registeredAt: "2024.01.15",
    tradeMethod: "직거래 (마포구), 택배 가능",
    status: "selling",
    likes: 12,
    chats: 3,
    category: "소설",
  },
  {
    id: "2",
    title: "82년생 김지영",
    author: "조남주",
    publisher: "민음사",
    price: "5,500원",
    priceNumber: 5500,
    state: "중",
    loc: "서대문구",
    region: "서대문구",
    date: "3시간 전",
    seller: "독서왕",
    status: "selling",
    likes: 7,
    chats: 2,
    category: "소설",
  },
  {
    id: "3",
    title: "아몬드",
    author: "손원평",
    publisher: "창비",
    price: "7,000원",
    priceNumber: 7000,
    state: "최상",
    loc: "용산구",
    region: "용산구",
    date: "어제",
    seller: "북헌터",
    status: "selling",
    likes: 24,
    chats: 5,
    category: "소설",
  },
  {
    id: "4",
    title: "달러구트 꿈 백화점",
    author: "이미예",
    publisher: "팩토리나인",
    price: "0원",
    priceNumber: 0,
    state: "상",
    loc: "성동구",
    region: "성동구",
    date: "2일 전",
    seller: "리딩클럽",
    status: "free",
    free: true,
    likes: 41,
    chats: 9,
    category: "소설",
  },
  {
    id: "5",
    title: "소년이 온다",
    author: "한강",
    publisher: "창비",
    price: "7,000원",
    priceNumber: 7000,
    state: "최상",
    loc: "서대문구",
    region: "서대문구",
    date: "3시간 전",
    status: "selling",
    likes: 5,
    chats: 1,
    category: "소설",
  },
  {
    id: "6",
    title: "흰",
    author: "한강",
    publisher: "문학동네",
    price: "5,000원",
    priceNumber: 5000,
    state: "중",
    loc: "용산구",
    region: "용산구",
    date: "어제",
    status: "sold",
    likes: 9,
    chats: 4,
    category: "에세이",
  },
];

const SEED_ORDERS: MockOrder[] = [
  {
    id: "o-1",
    title: "82년생 김지영",
    info: "판매자: 독서왕",
    price: "5,500원",
    priceNumber: 5500,
    status: "거래완료",
    date: "2024.01.10",
    bookId: "2",
  },
  {
    id: "o-2",
    title: "아몬드",
    info: "판매자: 북헌터",
    price: "7,000원",
    priceNumber: 7000,
    status: "거래완료",
    date: "2024.01.05",
    bookId: "3",
  },
];

const SEED_CHATS: MockChat[] = [
  {
    id: "c-1",
    user: "책방마니아",
    book: "채식주의자",
    bookId: "1",
    msg: "네 좋아요! 내일 2시에 합정역에서 만나요",
    time: "방금",
    unread: 2,
    buying: true,
    status: "reserved",
  },
  {
    id: "c-2",
    user: "독서왕",
    book: "82년생 김지영",
    bookId: "2",
    msg: "감사합니다 잘 받았어요 :)",
    time: "1시간 전",
    unread: 0,
    buying: false,
    status: "sold",
  },
  {
    id: "c-3",
    user: "북헌터",
    book: "아몬드",
    bookId: "3",
    msg: "택배 운임은 3000원이에요",
    time: "어제",
    unread: 1,
    buying: true,
    status: "selling",
  },
];

const SEED_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n-1",
    type: "trade",
    title: "결제가 완료되었어요",
    body: "‘채식주의자’ 결제가 완료되었습니다. 운송장이 등록되면 알려드릴게요.",
    time: "방금",
    unread: true,
  },
  {
    id: "n-2",
    type: "chat",
    title: "책방마니아님이 메시지를 보냈어요",
    body: "네 좋아요! 내일 2시에 합정역에서 만나요",
    time: "10분 전",
    unread: true,
  },
  {
    id: "n-3",
    type: "system",
    title: "찜한 책이 가격을 내렸어요",
    body: "‘아몬드’가 8,000원 → 7,000원으로 변경되었어요.",
    time: "어제",
    unread: false,
  },
];

const STORE_KEY = "__emptybook_mock_store__";

type Store = {
  books: MockBook[];
  orders: MockOrder[];
  chats: MockChat[];
  notifications: MockNotification[];
};

function getStore(): Store {
  const g = globalThis as any;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      books: [...SEED_BOOKS],
      orders: [...SEED_ORDERS],
      chats: [...SEED_CHATS],
      notifications: [...SEED_NOTIFICATIONS],
    } satisfies Store;
  }
  return g[STORE_KEY] as Store;
}

export function mockListBooks(opts?: { limit?: number }): MockBook[] {
  const s = getStore();
  const list = [...s.books];
  return opts?.limit ? list.slice(0, opts.limit) : list;
}

export function mockGetBook(id: string): MockBook | undefined {
  return getStore().books.find((b) => b.id === id);
}

export function mockCreateBook(input: {
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
}): MockBook {
  const s = getStore();
  const id = `u-${Date.now()}`;
  const isFree = input.free || input.priceNumber === 0;
  const book: MockBook = {
    id,
    title: input.title,
    author: input.author ?? "",
    publisher: input.publisher,
    isbn: input.isbn,
    category: input.category ?? "소설",
    state: input.state,
    price: isFree ? "무료나눔" : `${input.priceNumber.toLocaleString()}원`,
    priceNumber: input.priceNumber,
    loc: input.region ?? "마포구",
    region: input.region ?? "마포구",
    date: "방금 전",
    description: input.description,
    comment: input.comment,
    seller: "나",
    sellerStats: "거래 0회 · 신규",
    registeredAt: new Date().toLocaleDateString("ko-KR"),
    tradeMethod: input.tradeMethod ?? "직거래, 택배 가능",
    status: isFree ? "free" : "selling",
    free: isFree,
    likes: 0,
    chats: 0,
  };
  s.books = [book, ...s.books];
  return book;
}

export function mockListOrders(): MockOrder[] {
  return [...getStore().orders];
}

export function mockGetOrder(id: string): MockOrder | undefined {
  return getStore().orders.find((o) => o.id === id);
}

export function mockCreateOrder(input: {
  bookId: string;
  status?: MockOrder["status"];
}): MockOrder {
  const s = getStore();
  const book = s.books.find((b) => b.id === input.bookId);
  const id = `o-${Date.now()}`;
  const order: MockOrder = {
    id,
    bookId: input.bookId,
    title: book?.title ?? "도서",
    info: `판매자: ${book?.seller ?? "판매자"}`,
    price: book?.price ?? "0원",
    priceNumber: book?.priceNumber ?? 0,
    status: input.status ?? "배송중",
    date: new Date().toLocaleDateString("ko-KR"),
    buyerName: "나",
  };
  s.orders = [order, ...s.orders];
  if (book) book.status = "sold";
  return order;
}

export function mockUpdateOrderStatus(id: string, status: MockOrder["status"]) {
  const s = getStore();
  const o = s.orders.find((x) => x.id === id);
  if (o) o.status = status;
  return o;
}

export function mockListChats(): MockChat[] {
  return [...getStore().chats];
}

export function mockGetChat(id: string): MockChat | undefined {
  return getStore().chats.find((c) => c.id === id);
}

export function mockListNotifications(): MockNotification[] {
  return [...getStore().notifications];
}

export const CATEGORIES: { name: string; emoji: string }[] = [
  { name: "소설", emoji: "📖" },
  { name: "에세이", emoji: "🌿" },
  { name: "자기계발", emoji: "🚀" },
  { name: "경제/경영", emoji: "💼" },
  { name: "역사", emoji: "🏛️" },
  { name: "과학", emoji: "🔬" },
  { name: "아동", emoji: "🧸" },
  { name: "만화", emoji: "🎨" },
];

export const POPULAR_SELLERS = [
  { name: "책방마니아", trades: 12, manner: 38.6 },
  { name: "독서왕", trades: 24, manner: 41.2 },
  { name: "북헌터", trades: 36, manner: 39.4 },
  { name: "리딩클럽", trades: 48, manner: 42.0 },
];

export const RECENT_SEARCHES = ["한강", "달러구트", "82년생", "데미안", "코스모스"];
export const POPULAR_SEARCHES = [
  "채식주의자",
  "아몬드",
  "트렌드 코리아",
  "물고기는 존재하지 않는다",
  "역행자",
  "달러구트",
];
