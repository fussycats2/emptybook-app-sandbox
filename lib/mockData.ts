// Supabase 미연결(=환경변수 없음) 환경에서도 화면이 동작하도록 만든 더미 데이터 + 인메모리 저장소
// - 앱 첫 진입 시 SEED_* 데이터를 globalThis 에 보관해 라우팅 사이에 상태가 유지되게 함
// - 페이지에서는 lib/repo.ts 만 import 하고, 이 파일은 직접 import 하지 않는 것이 원칙

import type { BookSummary } from "@/components/ui/BookCard";
import type { SaleStatus } from "@/components/ui/StatusBadge";

// BookCard 가 요구하는 필드(BookSummary)에 상세화면용 추가 필드를 합친 확장 타입
export type MockBook = BookSummary & {
  publisher?: string;
  isbn?: string;
  originalPrice?: string;
  discount?: string;
  description?: string;
  comment?: string;
  seller?: string;
  sellerId?: string; // 실제 auth user.id (Supabase 모드). mock에선 미사용
  sellerStats?: string;
  registeredAt?: string;
  tradeMethod?: string;
  category?: string;
  priceNumber: number;
  region?: string;
  coverUrl?: string; // 외부(네이버 등) 표지 URL
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
  // 내가 산 거래(buy)인지 판 거래(sell)인지 — orders 페이지 탭 필터에서 사용
  side: "buy" | "sell";
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

// 후기 — 거래(transaction) 1건당 1개. 작성자(reviewer)/대상(reviewee)을 분리해 보관
export type MockReview = {
  id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName?: string; // mock 표시용 — 실제 DB에서는 profiles join으로 채움
  bookTitle?: string; // mock 표시용 — 실제 DB에서는 transactions→books join
  bookId?: string;
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
};

// 받은 후기 화면(/mypage/reviews) 카드용 — 후기 + 작성자/책 정보 합본
export type ReceivedReviewCard = {
  id: string;
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
  reviewerName: string;
  reviewerSeed: string; // 아바타 시드(이름 등 식별 가능한 문자열)
  bookTitle: string;
  bookId?: string;
};

// 처음 화면을 띄웠을 때 보이는 기본 더미 책 목록
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

// 마이페이지 → 거래 내역에서 사용할 더미 주문 데이터
// side: 내가 산 거래(buy) / 내가 판 거래(sell) — 탭 필터 검증용으로 양쪽 다 시드로 둠
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
    side: "buy",
  },
  {
    id: "o-2",
    title: "아몬드",
    info: "판매자: 북헌터",
    price: "7,000원",
    priceNumber: 7000,
    status: "배송중",
    date: "2024.01.05",
    bookId: "3",
    side: "buy",
  },
  {
    id: "o-3",
    title: "흰",
    info: "구매자: 이웃A",
    price: "5,000원",
    priceNumber: 5000,
    status: "거래완료",
    date: "2024.01.02",
    bookId: "6",
    side: "sell",
  },
];

// 채팅 목록 화면에 표시할 더미 채팅
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

// 알림 화면 더미 데이터
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

// 마이페이지 "받은 후기"(/mypage/reviews) 데모용 시드 — 사용자(="나")가 reviewee
const SEED_REVIEWS: MockReview[] = [
  {
    id: "rv-seed-1",
    transactionId: "o-seed-rv-1",
    reviewerId: "독서왕",
    revieweeId: "나",
    reviewerName: "독서왕",
    bookTitle: "82년생 김지영",
    bookId: "2",
    rating: 5,
    tags: ["응답이 빨라요", "친절해요", "도서 상태가 좋아요"],
    comment: "책 상태도 깨끗하고 응답도 빨라서 정말 편하게 거래했어요. 또 거래하고 싶어요!",
    createdAt: "2024-01-12T10:30:00.000Z",
  },
  {
    id: "rv-seed-2",
    transactionId: "o-seed-rv-2",
    reviewerId: "리딩클럽",
    revieweeId: "나",
    reviewerName: "리딩클럽",
    bookTitle: "달러구트 꿈 백화점",
    bookId: "4",
    rating: 5,
    tags: ["약속을 잘 지켜요", "포장이 꼼꼼해요"],
    comment: "약속 시간 정확히 지켜주시고 포장도 꼼꼼하게 해주셨어요. 감사합니다 :)",
    createdAt: "2023-12-28T15:00:00.000Z",
  },
  {
    id: "rv-seed-3",
    transactionId: "o-seed-rv-3",
    reviewerId: "북헌터",
    revieweeId: "나",
    reviewerName: "북헌터",
    bookTitle: "아몬드",
    bookId: "3",
    rating: 4,
    tags: ["설명이 정확해요"],
    createdAt: "2023-12-15T09:20:00.000Z",
  },
];

// globalThis 에 저장할 키. 페이지 이동 후에도 같은 데이터를 참조하기 위함
const STORE_KEY = "__emptybook_mock_store__";

// 인메모리 저장소의 형태
type Store = {
  books: MockBook[];
  orders: MockOrder[];
  chats: MockChat[];
  notifications: MockNotification[];
  likedBookIds: Set<string>; // 비로그인/mock 환경에서 찜 상태를 보관
  reviews: MockReview[]; // 후기 — transactionId 별 1개 제약
};

// 처음 호출되면 SEED 데이터를 globalThis 에 박아두고, 이후엔 그걸 재사용한다
// (페이지 새로고침이나 서버 재시작 시점에는 다시 SEED 로 초기화됨)
function getStore(): Store {
  const g = globalThis as any;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      books: [...SEED_BOOKS],
      orders: [...SEED_ORDERS],
      chats: [...SEED_CHATS],
      notifications: [...SEED_NOTIFICATIONS],
      likedBookIds: new Set<string>(),
      reviews: [...SEED_REVIEWS],
    } satisfies Store;
  }
  return g[STORE_KEY] as Store;
}

// 책 목록 조회. limit 가 주어지면 앞에서부터 limit 개만 반환
export function mockListBooks(opts?: { limit?: number }): MockBook[] {
  const s = getStore();
  const list = [...s.books]; // 원본 배열 보호를 위해 복사본 반환
  return opts?.limit ? list.slice(0, opts.limit) : list;
}

// 단일 책 조회 — 못 찾으면 undefined
export function mockGetBook(id: string): MockBook | undefined {
  return getStore().books.find((b) => b.id === id);
}

// 도서 등록. 등록 시점에 가격 0원이면 무료나눔으로 자동 분류
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
  coverUrl?: string;
}): MockBook {
  const s = getStore();
  // 'u-{timestamp}' 형태로 임시 ID 발급 (실제 DB 라면 UUID 사용)
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
    coverUrl: input.coverUrl,
  };
  // 새로 등록한 책이 목록 맨 위에 보이도록 prepend
  s.books = [book, ...s.books];
  return book;
}

// 등록 취소 — 책을 HIDDEN 상태로(목록에서 사라짐, 데이터는 남김)
export function mockCancelBook(bookId: string): boolean {
  const s = getStore();
  const book = s.books.find((b) => b.id === bookId);
  if (!book) return false;
  book.status = "sold"; // mock의 SaleStatus 에는 HIDDEN 표현이 없어 sold(거래완료)로 대체
  return true;
}

// 영구 삭제 — 책 행 + 관련 likes 정리
export function mockDeleteBook(bookId: string): boolean {
  const s = getStore();
  const before = s.books.length;
  s.books = s.books.filter((b) => b.id !== bookId);
  s.likedBookIds.delete(bookId);
  return s.books.length < before;
}

// 주문 목록/단일 조회
export function mockListOrders(): MockOrder[] {
  return [...getStore().orders];
}

export function mockGetOrder(id: string): MockOrder | undefined {
  return getStore().orders.find((o) => o.id === id);
}

// 결제 시점에 호출. 책 status 도 'sold'로 함께 변경한다
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
    side: "buy",
  };
  s.orders = [order, ...s.orders];
  // 주문이 생성되면 해당 책은 더 이상 판매중이 아님
  if (book) book.status = "sold";
  return order;
}

// 거래 확정/배송 상태 등 주문 상태만 갱신
export function mockUpdateOrderStatus(id: string, status: MockOrder["status"]) {
  const s = getStore();
  const o = s.orders.find((x) => x.id === id);
  if (o) o.status = status;
  return o;
}

// 찜 상태 조회/토글 — books.likes 카운터도 함께 갱신해 카드 UI와 즉시 일치시킨다
export function mockIsLiked(bookId: string): boolean {
  return getStore().likedBookIds.has(bookId);
}

export function mockListLikedIds(): string[] {
  return [...getStore().likedBookIds];
}

export function mockToggleLike(bookId: string): {
  liked: boolean;
  likeCount: number;
} {
  const s = getStore();
  const book = s.books.find((b) => b.id === bookId);
  const wasLiked = s.likedBookIds.has(bookId);
  if (wasLiked) {
    s.likedBookIds.delete(bookId);
    if (book) book.likes = Math.max(0, (book.likes ?? 0) - 1);
  } else {
    s.likedBookIds.add(bookId);
    if (book) book.likes = (book.likes ?? 0) + 1;
  }
  return { liked: !wasLiked, likeCount: book?.likes ?? 0 };
}

// 후기 — 단일 거래에 대한 후기 조회/생성
// mock 환경에서는 reviewer는 항상 "나"(buyer 역할), reviewee는 판매자(seller 이름)로 가정
export function mockGetReviewByTx(transactionId: string): MockReview | undefined {
  return getStore().reviews.find((r) => r.transactionId === transactionId);
}

export function mockCreateReview(input: {
  transactionId: string;
  reviewerId?: string;
  revieweeId?: string;
  rating: number;
  tags: string[];
  comment?: string;
}): MockReview {
  const s = getStore();
  // UNIQUE(transaction_id) 제약을 mock에서도 흉내냄
  const existing = s.reviews.find(
    (r) => r.transactionId === input.transactionId
  );
  if (existing) return existing;
  const review: MockReview = {
    id: `rv-${Date.now()}`,
    transactionId: input.transactionId,
    reviewerId: input.reviewerId ?? "me",
    revieweeId: input.revieweeId ?? "seller",
    rating: input.rating,
    tags: input.tags,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  s.reviews = [review, ...s.reviews];
  return review;
}

// 받은 후기 — mock 모드의 사용자("나")를 reviewee 로 가진 후기들
// 최신순 정렬, 카드용 형태로 가공
export function mockListReceivedReviews(): ReceivedReviewCard[] {
  const s = getStore();
  return [...s.reviews]
    .filter((r) => r.revieweeId === "나" || r.revieweeId === "me")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      tags: r.tags,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewerName: r.reviewerName ?? r.reviewerId ?? "익명",
      reviewerSeed: r.reviewerName ?? r.reviewerId ?? "anon",
      bookTitle: r.bookTitle ?? "도서",
      bookId: r.bookId,
    }));
}

// 후기 작성 화면 상단에 표시할 컨텍스트 — 상대방 이름/책 제목/거래일/이미 작성 여부
// mock에서는 order(transaction)에 책 정보를 join한 형태로 반환
export function mockGetReviewContext(transactionId: string): {
  revieweeName: string;
  revieweeId: string;
  bookTitle: string;
  bookId: string;
  completedAt: string;
  alreadyReviewed: boolean;
} | null {
  const s = getStore();
  const order = s.orders.find((o) => o.id === transactionId);
  if (!order) return null;
  const book = s.books.find((b) => b.id === order.bookId);
  return {
    revieweeName: book?.seller ?? "판매자",
    revieweeId: book?.seller ?? "seller", // mock 에선 별도 user id가 없어 이름을 키로 대체
    bookTitle: order.title,
    bookId: order.bookId,
    completedAt: order.date,
    alreadyReviewed: !!s.reviews.find((r) => r.transactionId === transactionId),
  };
}

// 채팅/알림 조회 함수들
export function mockListChats(): MockChat[] {
  return [...getStore().chats];
}

export function mockGetChat(id: string): MockChat | undefined {
  return getStore().chats.find((c) => c.id === id);
}

export function mockListNotifications(): MockNotification[] {
  return [...getStore().notifications];
}

// 정적 메타데이터 (자주 바뀌지 않는 표시용 데이터)
// 카테고리 칩, 인기 셀러, 최근 검색어 등 — 하드코딩 모음
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
