// Supabase 미연결(=환경변수 없음) 환경에서도 화면이 동작하도록 만든 더미 데이터 + 인메모리 저장소
// - 앱 첫 진입 시 SEED_* 데이터를 globalThis 에 보관해 라우팅 사이에 상태가 유지되게 함
// - 페이지에서는 lib/repo.ts 만 import 하고, 이 파일은 직접 import 하지 않는 것이 원칙

import type { BookSummary } from "@/components/ui/BookCard";
import type { SaleStatus } from "@/components/ui/StatusBadge";
import {
  DEFAULT_APP_PREFS,
  type AppPrefs,
  type ConditionDetail,
  type Profile,
  type ShelfItem,
  type ShelfStatus,
  type UserCoupon,
} from "./supabase/types";

// BookCard 가 요구하는 필드(BookSummary)에 상세화면용 추가 필드를 합친 확장 타입
export type MockBook = BookSummary & {
  publisher?: string;
  isbn?: string;
  // 정가 — 표시용 포맷 + 계산용 number 두 형태로 보관 (할인율 계산은 number 로)
  originalPrice?: string;
  originalPriceNumber?: number;
  discount?: string;
  description?: string;
  comment?: string;
  // 0011 에서 추가된 네이버 메타데이터 필드 — 상세 화면에서 활용
  synopsis?: string; // 책 줄거리 (네이버 description)
  pubDate?: string; // 발행일 (YYYY-MM-DD)
  sourceUrl?: string; // 네이버 도서 페이지 URL
  seller?: string;
  sellerId?: string; // 실제 auth user.id (Supabase 모드). mock에선 미사용
  sellerStats?: string;
  // 판매자 카드 보강 (v9.7) — profiles 의 rating_avg / trade_count 직접 노출
  sellerRating?: number; // 0~5 (소수 한 자리)
  sellerTradeCount?: number;
  registeredAt?: string;
  tradeMethod?: string;
  category?: string;
  priceNumber: number;
  region?: string;
  coverUrl?: string; // 외부(네이버 등) 표지 URL
  imageUrls?: string[]; // 업로드된 사용자 사진 URL — 캐러셀에서 슬라이드별로 사용
  // 0013 — 도서 상태 상세 체크리스트. 도서 상세에서 "상태 상세 보기" 토글로 노출
  conditionDetail?: ConditionDetail;
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
  // 상대방 프로필 — 채팅 헤더의 ★별점·거래수 노출용 (이전 38.6℃ 하드코딩 대체)
  partnerRating?: number;
  partnerTradeCount?: number;
};

export type MockNotification = {
  id: string;
  type: "trade" | "chat" | "system";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  // 라우팅용 도메인 id — 알림 카드 클릭 시 적절한 화면으로 이동시키기 위함.
  // 트리거 payload(0006_notification_triggers.sql)와 키 매핑이 일치한다.
  roomId?: string;
  transactionId?: string;
  bookId?: string;
};

// 채팅 메시지 한 건 — 화면 말풍선(my/their/system)으로 그릴 수 있는 최소 정보
export type MockMessage = {
  id: string;
  roomId: string;
  body: string;
  type: "text" | "system";
  mine: boolean; // mock 모드에선 reviewer/reviewee 구분처럼 단순화
  read: boolean; // 상대 메시지가 내가 채팅방을 열어 읽혀졌는지
  createdAt: string;
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
    sellerRating: 4.9,
    sellerTradeCount: 42,
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
    sellerRating: 4.7,
    sellerTradeCount: 24,
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
    sellerRating: 4.6,
    sellerTradeCount: 36,
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
    sellerRating: 4.8,
    sellerTradeCount: 48,
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
    partnerRating: 4.9,
    partnerTradeCount: 42,
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
    partnerRating: 4.7,
    partnerTradeCount: 24,
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
    partnerRating: 4.6,
    partnerTradeCount: 36,
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
    bookId: "1",
  },
  {
    id: "n-2",
    type: "chat",
    title: "책방마니아님이 메시지를 보냈어요",
    body: "네 좋아요! 내일 2시에 합정역에서 만나요",
    time: "10분 전",
    unread: true,
    roomId: "c-1",
  },
  {
    id: "n-3",
    type: "system",
    title: "찜한 책이 가격을 내렸어요",
    body: "‘아몬드’가 8,000원 → 7,000원으로 변경되었어요.",
    time: "어제",
    unread: false,
    bookId: "3",
  },
];

// 채팅방별 시드 메시지 — Realtime 미사용(mock) 모드에서도 대화 흐름이 보이도록
function seedMsg(roomId: string, body: string, mine: boolean, ageMin: number, type: "text" | "system" = "text"): MockMessage {
  return {
    id: `${roomId}-m-${ageMin}`,
    roomId,
    body,
    type,
    mine,
    // 시드 메시지는 처음 mock 진입 시 모두 미읽음 — /chat/[id] 진입 시 mark 호출로 전환됨
    read: false,
    createdAt: new Date(Date.now() - ageMin * 60_000).toISOString(),
  };
}
const SEED_MESSAGES: MockMessage[] = [
  seedMsg("c-1", "거래가 시작되었어요", false, 30, "system"),
  seedMsg("c-1", "안녕하세요! 채식주의자 아직 판매 중인가요?", false, 28),
  seedMsg("c-1", "네 판매 중이에요! 깨끗해요 :)", true, 25),
  seedMsg("c-1", "내일 합정역에서 직거래 가능할까요?", false, 20),
  seedMsg("c-1", "네 좋아요! 내일 2시에 합정역에서 만나요", true, 18),

  seedMsg("c-2", "거래가 시작되었어요", false, 120, "system"),
  seedMsg("c-2", "잘 받았어요 감사합니다 :)", false, 60),

  seedMsg("c-3", "거래가 시작되었어요", false, 1440, "system"),
  seedMsg("c-3", "택배 운임은 3000원이에요", false, 1430),
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
  // 다른 판매자(=mock 시드 책의 seller 이름)들의 받은 후기 — 도서 상세의 SellerCard 가 노출
  // mock 모드에서는 sellerId 가 없어 reviewee 매칭이 어려우므로 reviewerName=구매자 / revieweeId=셀러이름 형태로 시드
  {
    id: "rv-seed-seller-1a",
    transactionId: "o-seed-seller-1a",
    reviewerId: "민지",
    revieweeId: "책방마니아",
    reviewerName: "민지",
    bookTitle: "채식주의자",
    bookId: "1",
    rating: 5,
    tags: ["도서 상태가 좋아요", "응답이 빨라요"],
    comment: "한강 작가 책을 깨끗한 상태로 받았어요. 포장도 꼼꼼해서 만족스럽습니다.",
    createdAt: "2026-04-21T11:00:00.000Z",
  },
  {
    id: "rv-seed-seller-1b",
    transactionId: "o-seed-seller-1b",
    reviewerId: "정우",
    revieweeId: "책방마니아",
    reviewerName: "정우",
    rating: 5,
    tags: ["친절해요", "약속을 잘 지켜요"],
    comment: "친절하게 응답해주셔서 편하게 거래했습니다. 추천!",
    createdAt: "2026-04-10T14:00:00.000Z",
  },
  {
    id: "rv-seed-seller-2a",
    transactionId: "o-seed-seller-2a",
    reviewerId: "수민",
    revieweeId: "독서왕",
    reviewerName: "수민",
    rating: 5,
    tags: ["설명이 정확해요"],
    comment: "사진과 동일한 상태였고 설명도 자세해서 좋았어요.",
    createdAt: "2026-04-05T16:00:00.000Z",
  },
  {
    id: "rv-seed-seller-3a",
    transactionId: "o-seed-seller-3a",
    reviewerId: "지윤",
    revieweeId: "북헌터",
    reviewerName: "지윤",
    rating: 4,
    tags: ["응답이 빨라요"],
    comment: "응답이 빨라서 거래가 매끄러웠어요.",
    createdAt: "2026-04-15T10:30:00.000Z",
  },
  {
    id: "rv-seed-seller-4a",
    transactionId: "o-seed-seller-4a",
    reviewerId: "지수",
    revieweeId: "리딩클럽",
    reviewerName: "지수",
    rating: 5,
    tags: ["친절해요", "포장이 꼼꼼해요"],
    comment: "무료 나눔인데도 정말 잘 포장해서 보내주셨어요. 감사합니다!",
    createdAt: "2026-04-18T12:00:00.000Z",
  },
];

// /mypage/shelf — 비로그인/mock 모드에서 미리 보여줄 책장 시드
// 4가지 상태가 모두 한 번씩 노출되도록 다양하게 구성
const SEED_SHELF: ShelfItem[] = [
  {
    id: "sh-1",
    title: "달러구트 꿈 백화점",
    author: "이미예",
    publisher: "팩토리나인",
    isbn: "9791165341909",
    category: "소설",
    coverUrl: undefined,
    status: "READING",
    startedAt: "2026-04-20",
    rating: undefined,
    memo: "출퇴근 길에 조금씩 읽는 중",
    createdAt: "2026-04-20T08:00:00.000Z",
    updatedAt: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "sh-2",
    title: "아몬드",
    author: "손원평",
    publisher: "창비",
    isbn: "9788936434267",
    category: "소설",
    coverUrl: undefined,
    status: "FINISHED",
    finishedAt: "2026-03-12",
    rating: 5,
    memo: "오랫동안 마음에 남는 책. 완독.",
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-03-12T12:00:00.000Z",
  },
  {
    id: "sh-3",
    title: "데미안",
    author: "헤르만 헤세",
    publisher: "민음사",
    category: "소설",
    coverUrl: undefined,
    status: "OWNED",
    rating: 4,
    createdAt: "2025-12-10T08:00:00.000Z",
    updatedAt: "2025-12-10T08:00:00.000Z",
  },
  {
    id: "sh-4",
    title: "코스모스",
    author: "칼 세이건",
    publisher: "사이언스북스",
    category: "과학",
    coverUrl: undefined,
    status: "FOR_SALE",
    rating: 5,
    memo: "두 번 정독 후 정리하려고 해요.",
    createdAt: "2026-01-04T08:00:00.000Z",
    updatedAt: "2026-04-30T10:00:00.000Z",
  },
];

// /mypage/coupons — 0017 시드의 mock 동등.
// 신규가입(WELCOME1000) + 이벤트(SPRING3000) + 만료된 쿠폰(EXPIRED) 한 장씩 보여
// 모든 상태 케이스가 최소 1번은 화면에 등장하게 한다.
const SEED_COUPONS: UserCoupon[] = [
  {
    id: "uc-1",
    templateId: "ct-welcome",
    status: "AVAILABLE",
    issuedAt: "2026-04-15T08:00:00.000Z",
    expiresAt: "2026-07-14T08:00:00.000Z",
    name: "신규가입 환영 1,000원 쿠폰",
    description: "회원가입을 환영합니다. 첫 거래에 사용해보세요.",
    discountType: "FIXED",
    discountValue: 1000,
    minOrderAmount: 5000,
    code: "WELCOME1000",
  },
  {
    id: "uc-2",
    templateId: "ct-spring",
    status: "AVAILABLE",
    issuedAt: "2026-05-01T08:00:00.000Z",
    expiresAt: "2026-05-31T08:00:00.000Z",
    name: "봄맞이 책장 정리 3,000원 쿠폰",
    description: "10,000원 이상 결제 시 사용 가능해요.",
    discountType: "FIXED",
    discountValue: 3000,
    minOrderAmount: 10000,
    code: "SPRING3000",
  },
  {
    id: "uc-3",
    templateId: "ct-percent",
    status: "EXPIRED",
    issuedAt: "2026-03-01T08:00:00.000Z",
    expiresAt: "2026-04-01T08:00:00.000Z",
    name: "10% 할인 쿠폰",
    description: "7,000원 이상, 최대 5,000원까지 할인돼요.",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderAmount: 7000,
    maxDiscount: 5000,
    code: "PERCENT10",
  },
  // 0021 보강분 — 베타 시연용으로 풍성하게. 액수/할인 방식/최소주문/만료를 다양하게.
  {
    id: "uc-4",
    templateId: "ct-welcome-plus",
    status: "AVAILABLE",
    issuedAt: "2026-04-15T08:00:00.000Z",
    expiresAt: "2026-08-05T08:00:00.000Z",
    name: "신규가입 추가 환영 쿠폰",
    description: "15% 할인 (최대 5,000원). 첫 거래 부담을 더 덜어드릴게요.",
    discountType: "PERCENT",
    discountValue: 15,
    minOrderAmount: 7000,
    maxDiscount: 5000,
    code: "WELCOME_PLUS",
  },
  {
    id: "uc-5",
    templateId: "ct-every-3000",
    status: "AVAILABLE",
    issuedAt: "2026-05-01T08:00:00.000Z",
    expiresAt: "2026-07-06T08:00:00.000Z",
    name: "아무 책에나 쓸 수 있는 3,000원",
    description: "최소 주문 금액 없음. 무료나눔 빼고 어디든 사용 가능.",
    discountType: "FIXED",
    discountValue: 3000,
    minOrderAmount: 0,
    code: "EVERY3000",
  },
  {
    id: "uc-6",
    templateId: "ct-bigsale-7000",
    status: "AVAILABLE",
    issuedAt: "2026-05-01T08:00:00.000Z",
    expiresAt: "2026-06-06T08:00:00.000Z",
    name: "대형 할인 7,000원",
    description: "20,000원 이상 결제 시 사용 가능. 두꺼운 책 들이실 때.",
    discountType: "FIXED",
    discountValue: 7000,
    minOrderAmount: 20000,
    code: "BIGSALE7000",
  },
  {
    id: "uc-7",
    templateId: "ct-percent-20",
    status: "AVAILABLE",
    issuedAt: "2026-05-01T08:00:00.000Z",
    expiresAt: "2026-05-21T08:00:00.000Z",
    name: "20% 할인 쿠폰",
    description: "10,000원 이상, 최대 8,000원까지 할인돼요.",
    discountType: "PERCENT",
    discountValue: 20,
    minOrderAmount: 10000,
    maxDiscount: 8000,
    code: "PERCENT20",
  },
  {
    id: "uc-8",
    templateId: "ct-freeship-2500",
    status: "AVAILABLE",
    issuedAt: "2026-05-01T08:00:00.000Z",
    expiresAt: "2026-08-05T08:00:00.000Z",
    name: "택배비 부담 해소 2,500원",
    description: "택배 거래의 작은 부담을 덜어드려요. 최소 주문 금액 없음.",
    discountType: "FIXED",
    discountValue: 2500,
    minOrderAmount: 0,
    code: "FREESHIP2500",
  },
];

// 비로그인/mock 모드의 "내 프로필" 기본값 — /mypage/settings 편집 시뮬레이션용
const SEED_PROFILE: Profile = {
  id: "mock-me",
  username: "guest",
  display_name: "게스트",
  phone: null,
  avatar_url: null,
  rating_avg: 0,
  trade_count: 0,
  preferred_genres: [],
  app_prefs: { ...DEFAULT_APP_PREFS },
};

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
  profile: Profile; // 내 프로필(비로그인/mock 모드용)
  messages: MockMessage[]; // 채팅방 메시지 — roomId 로 필터해서 사용
  shelf: ShelfItem[]; // 0012 — 사용자 개인 책장
  coupons: UserCoupon[]; // 0017 — 사용자 쿠폰
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
      profile: { ...SEED_PROFILE, app_prefs: { ...DEFAULT_APP_PREFS } },
      messages: [...SEED_MESSAGES],
      shelf: [...SEED_SHELF],
      coupons: [...SEED_COUPONS],
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
  // 0011 메타데이터 — mock 모드에서도 같은 형태로 보관해야 도서 상세에서 일관 표시
  originalPriceNumber?: number;
  synopsis?: string;
  pubDate?: string;
  sourceUrl?: string;
  // 0013 도서 상태 상세 체크리스트 — Supabase 쪽과 동일하게 보관
  conditionDetail?: ConditionDetail;
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
    originalPrice:
      input.originalPriceNumber && input.originalPriceNumber > 0
        ? `${input.originalPriceNumber.toLocaleString()}원`
        : undefined,
    originalPriceNumber: input.originalPriceNumber,
    loc: input.region ?? "마포구",
    region: input.region ?? "마포구",
    date: "방금 전",
    description: input.description,
    comment: input.comment,
    synopsis: input.synopsis,
    pubDate: input.pubDate,
    sourceUrl: input.sourceUrl,
    seller: "나",
    sellerStats: "거래 0회 · 신규",
    registeredAt: new Date().toLocaleDateString("ko-KR"),
    tradeMethod: input.tradeMethod ?? "직거래, 택배 가능",
    status: isFree ? "free" : "selling",
    free: isFree,
    likes: 0,
    chats: 0,
    coverUrl: input.coverUrl,
    conditionDetail: input.conditionDetail,
  };
  // 새로 등록한 책이 목록 맨 위에 보이도록 prepend
  s.books = [book, ...s.books];
  return book;
}

// 게시글 수정 — Supabase 의 updateBook 과 동일한 patch 를 mock store 에 반영.
// 가격/state/region/description/tradeMethod/category/conditionDetail 만 변경 가능.
export function mockUpdateBook(
  bookId: string,
  patch: {
    state?: "최상" | "상" | "중" | "하";
    priceNumber?: number;
    free?: boolean;
    region?: string;
    description?: string;
    tradeMethod?: "DIRECT" | "PARCEL" | "BOTH";
    category?: string;
    conditionDetail?: ConditionDetail | null;
  }
): boolean {
  const s = getStore();
  const book = s.books.find((b) => b.id === bookId);
  if (!book) return false;
  if (patch.state) book.state = patch.state;
  if (patch.category !== undefined) book.category = patch.category;
  if (patch.region !== undefined) {
    book.region = patch.region;
    book.loc = patch.region;
  }
  if (patch.description !== undefined) {
    book.description = patch.description || undefined;
    book.comment = patch.description || undefined;
  }
  if (patch.tradeMethod) {
    book.tradeMethod =
      patch.tradeMethod === "BOTH"
        ? "직거래, 택배 가능"
        : patch.tradeMethod === "DIRECT"
        ? "직거래"
        : "택배";
  }
  if (patch.conditionDetail !== undefined) {
    book.conditionDetail = patch.conditionDetail ?? undefined;
  }
  // 가격/무료나눔 — free 토글이 명시되면 그에 맞춰 priceNumber/price/free/status 일괄 갱신
  const nextFree =
    patch.free !== undefined
      ? patch.free
      : patch.priceNumber !== undefined
      ? patch.priceNumber === 0
      : undefined;
  if (patch.priceNumber !== undefined || nextFree !== undefined) {
    const num = nextFree ? 0 : patch.priceNumber ?? book.priceNumber ?? 0;
    book.priceNumber = num;
    book.price = num === 0 ? "무료나눔" : `${num.toLocaleString()}원`;
    book.free = num === 0;
    // selling/free 외 상태(예: reserved/sold/canceled)는 보존 — 진행 중인 거래를
    // 가격만 바꿨다고 강제로 selling 으로 되돌리면 FSM 과 어긋난다.
    if (book.status === "selling" || book.status === "free") {
      book.status = num === 0 ? "free" : "selling";
    }
  }
  return true;
}

// 등록 취소 — 책을 HIDDEN 상태로(공개 목록에서 사라짐, 데이터는 남김)
// mock 의 SaleStatus 에는 "canceled" 가 있으므로 그것을 사용 (실제 DB 의 HIDDEN 과 매핑)
export function mockCancelBook(bookId: string): boolean {
  const s = getStore();
  const book = s.books.find((b) => b.id === bookId);
  if (!book) return false;
  book.status = "canceled";
  // 0014 대응 — DB 트리거가 하던 일을 mock 에서도 재현:
  // 연결된 책장 항목이 FOR_SALE 이면 OWNED 로 자동 정리
  syncShelfOnBookStatusChange(bookId);
  return true;
}

// 영구 삭제 — 책 행 + 관련 likes 정리
export function mockDeleteBook(bookId: string): boolean {
  const s = getStore();
  const before = s.books.length;
  s.books = s.books.filter((b) => b.id !== bookId);
  s.likedBookIds.delete(bookId);
  // 책이 사라지면 책장의 linked_book_id 는 null 화 (FK ON DELETE SET NULL 동작)
  // 책장 자체는 유지 — 사용자의 개인 컬렉션이므로
  for (const it of s.shelf) {
    if (it.linkedBookId === bookId) it.linkedBookId = undefined;
  }
  return s.books.length < before;
}

// 0014 트리거 mock 등가: books.status 가 SOLD/HIDDEN 으로 바뀐 직후 호출.
// linked_book_id 로 연결된 FOR_SALE 책장 항목만 OWNED 로 옮긴다.
function syncShelfOnBookStatusChange(bookId: string) {
  const s = getStore();
  const book = s.books.find((b) => b.id === bookId);
  if (!book) return;
  if (book.status !== "canceled" && book.status !== "sold") return;
  for (const it of s.shelf) {
    if (it.linkedBookId === bookId && it.status === "FOR_SALE") {
      it.status = "OWNED";
      it.updatedAt = new Date().toISOString();
    }
  }
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
  if (book) {
    book.status = "sold";
    // 0014 대응 — 책이 sold 로 바뀌면 연결된 FOR_SALE 책장 항목을 OWNED 로
    syncShelfOnBookStatusChange(book.id);
    // 0016 대응 — buyer(="나") 의 책장에 OWNED 로 자동 추가.
    // 같은 ISBN 이 이미 책장에 있으면 mockAddShelfItem 이 기존 행을 그대로 반환(=스킵).
    mockAddShelfItem({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      category: book.category,
      coverUrl: book.coverUrl,
      status: "OWNED",
    });
    // linked_book_id 채움 — 방금 추가/매칭된 책장 행을 찾아 books.id 로 연결
    const just = s.shelf.find(
      (it) => (book.isbn && it.isbn === book.isbn) || it.title === book.title
    );
    if (just && !just.linkedBookId) {
      just.linkedBookId = book.id;
      just.updatedAt = new Date().toISOString();
    }
  }
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
  // 0019 의 UNIQUE(transaction_id, reviewer_id) 를 mock 에서도 흉내냄.
  // mock 에서 사용자가 쓰는 후기는 항상 reviewerId="me" 로 기록되므로,
  // 같은 (거래, 리뷰어) 조합이 이미 있으면 중복으로 보고 기존 행 그대로 반환.
  const reviewerId = input.reviewerId ?? "me";
  const existing = s.reviews.find(
    (r) => r.transactionId === input.transactionId && r.reviewerId === reviewerId
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
// revieweeId 인자가 있으면 그 사용자의 받은 후기를, 없으면 "나"/"me" 의 받은 후기를 반환.
// /mypage/reviews 는 인자 없이(=내 것), /books/[id] SellerCard 는 sellerName(mock) 또는 sellerId(supabase) 로 호출.
export function mockListReceivedReviews(
  revieweeId?: string
): ReceivedReviewCard[] {
  const s = getStore();
  const matchSelf = (r: MockReview) =>
    r.revieweeId === "나" || r.revieweeId === "me";
  const filter = revieweeId
    ? (r: MockReview) => r.revieweeId === revieweeId
    : matchSelf;
  return [...s.reviews]
    .filter(filter)
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
    // 0019 이후엔 같은 거래에 buyer/seller 가 각각 한 번씩 쓸 수 있으므로,
    // alreadyReviewed 는 "내가(=mock 의 me) 이 거래에 이미 쓴 후기가 있는가" 로 좁힌다.
    alreadyReviewed: !!s.reviews.find(
      (r) => r.transactionId === transactionId && r.reviewerId === "me"
    ),
  };
}

// ---------- Messages (채팅 메시지) ----------

// 채팅방 메시지 목록 — roomId 로 필터, 시간순 오름차순
export function mockListMessages(roomId: string): MockMessage[] {
  return getStore()
    .messages.filter((m) => m.roomId === roomId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

// 메시지 전송 — 'mine' 메시지로 push 후 반환. 채팅 목록의 last_message 도 동기화
export function mockSendMessage(roomId: string, body: string): MockMessage {
  const s = getStore();
  const msg: MockMessage = {
    id: `${roomId}-m-${Date.now()}`,
    roomId,
    body,
    type: "text",
    mine: true,
    // 내가 보낸 메시지는 read 의미가 없음 (상대가 읽었는지는 별도 신호) — true 로 둔다
    read: true,
    createdAt: new Date().toISOString(),
  };
  s.messages = [...s.messages, msg];
  // 채팅 목록의 마지막 메시지/시간을 동기화 (없는 방이면 무시)
  const room = s.chats.find((c) => c.id === roomId);
  if (room) {
    room.msg = body;
    room.time = "방금";
  }
  return msg;
}

// mock 모드 — 채팅방의 상대 메시지를 모두 읽음 처리. 갱신된 행 수 반환
export function mockMarkRoomRead(roomId: string): number {
  const s = getStore();
  let n = 0;
  for (const m of s.messages) {
    if (m.roomId === roomId && !m.mine && !m.read) {
      m.read = true;
      n++;
    }
  }
  // 채팅 목록의 unread 카운트도 0 으로 초기화
  const room = s.chats.find((c) => c.id === roomId);
  if (room) room.unread = 0;
  return n;
}

// mock 모드 — 채팅방별 unread 카운트(=상대가 보낸 미읽음 메시지 수) 매핑
export function mockUnreadByRoom(): Record<string, number> {
  const s = getStore();
  const map: Record<string, number> = {};
  for (const m of s.messages) {
    if (m.mine || m.read) continue;
    map[m.roomId] = (map[m.roomId] ?? 0) + 1;
  }
  return map;
}

// ---------- Profile (내 프로필) ----------

// 내 프로필 조회 (mock 모드 — 항상 SEED_PROFILE 기반)
export function mockGetProfile(): Profile {
  return { ...getStore().profile };
}

// 내 프로필 부분 업데이트 — 빈 문자열은 null 로 변환해 일관성 유지
export function mockUpdateProfile(input: Partial<Profile>): Profile {
  const s = getStore();
  s.profile = {
    ...s.profile,
    ...input,
    app_prefs: { ...s.profile.app_prefs, ...(input.app_prefs ?? {}) },
  };
  return { ...s.profile };
}

// app_prefs 만 부분 갱신 (deep merge — push/privacy 객체 단위)
export function mockUpdateAppPrefs(prefs: AppPrefs): AppPrefs {
  const s = getStore();
  const next: AppPrefs = {
    push: { ...(s.profile.app_prefs.push ?? {}), ...(prefs.push ?? {}) },
    privacy: {
      ...(s.profile.app_prefs.privacy ?? {}),
      ...(prefs.privacy ?? {}),
    },
  };
  s.profile = { ...s.profile, app_prefs: next };
  return next;
}

// 채팅/알림 조회 함수들
export function mockListChats(): MockChat[] {
  return [...getStore().chats];
}

export function mockGetChat(id: string): MockChat | undefined {
  return getStore().chats.find((c) => c.id === id);
}

// 책 ID 로 mock 채팅방을 찾거나 생성 — 도서 상세 "채팅" 버튼 등에서 사용
// 같은 bookId 의 기존 채팅이 있으면 그것을 재사용, 없으면 새로 만든다 (mock 모드 전용)
export function mockGetOrCreateChatRoomByBook(bookId: string): string {
  const s = getStore();
  const existing = s.chats.find((c) => c.bookId === bookId);
  if (existing) return existing.id;
  const book = s.books.find((b) => b.id === bookId);
  const newId = `c-${Date.now()}`;
  s.chats = [
    {
      id: newId,
      user: book?.seller ?? "판매자",
      book: book?.title ?? "도서",
      bookId,
      msg: "",
      time: "",
      unread: 0,
      buying: true,
      status: book?.status ?? "selling",
    },
    ...s.chats,
  ];
  return newId;
}

export function mockListNotifications(): MockNotification[] {
  return [...getStore().notifications];
}

// 알림 단건 읽음 처리 — mock store 의 해당 항목 unread → false
export function mockMarkNotificationRead(id: string) {
  const s = getStore();
  s.notifications = s.notifications.map((n) =>
    n.id === id ? { ...n, unread: false } : n
  );
}

// 모두 읽음 처리 — mock store 전체 unread → false
export function mockMarkAllNotificationsRead() {
  const s = getStore();
  s.notifications = s.notifications.map((n) => ({ ...n, unread: false }));
}

// 특정 채팅방의 chat 알림만 일괄 읽음 처리 — 사용자가 그 방을 보고 있는 동안엔
// 알림 페이지의 빨간점이 켜지지 않도록. (markRoomMessagesRead 와 짝)
// 반환: 갱신된 행 수 (캐시 invalidate 스킵 판단용)
export function mockMarkRoomChatNotificationsRead(roomId: string): number {
  const s = getStore();
  let n = 0;
  s.notifications = s.notifications.map((noti) => {
    if (noti.type === "chat" && noti.unread && noti.roomId === roomId) {
      n += 1;
      return { ...noti, unread: false };
    }
    return noti;
  });
  return n;
}

// ---------- Shelf (개인 책장 — 0012) ----------

export function mockListShelf(filter?: ShelfStatus): ShelfItem[] {
  const s = getStore();
  const list = filter ? s.shelf.filter((it) => it.status === filter) : s.shelf;
  // 최신 갱신 순 — UI 가 따로 정렬할 필요 없게 여기서 정리
  return [...list].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0
  );
}

export function mockAddShelfItem(input: {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  category?: string;
  coverUrl?: string;
  status?: ShelfStatus;
  rating?: number;
  memo?: string;
}): ShelfItem {
  const s = getStore();
  // 같은 ISBN 의 책이 이미 있으면 새로 만들지 않고 기존 행을 반환 — DB UNIQUE 와 동일 동작
  if (input.isbn) {
    const existing = s.shelf.find((it) => it.isbn === input.isbn);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const item: ShelfItem = {
    id: `sh-${Date.now()}`,
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    isbn: input.isbn,
    category: input.category,
    coverUrl: input.coverUrl,
    status: input.status ?? "OWNED",
    rating: input.rating,
    memo: input.memo,
    startedAt: input.status === "READING" ? now.slice(0, 10) : undefined,
    finishedAt: input.status === "FINISHED" ? now.slice(0, 10) : undefined,
    createdAt: now,
    updatedAt: now,
  };
  s.shelf = [item, ...s.shelf];
  return item;
}

export function mockUpdateShelfItem(
  id: string,
  patch: Partial<
    Pick<
      ShelfItem,
      | "status"
      | "startedAt"
      | "finishedAt"
      | "rating"
      | "memo"
      | "linkedBookId"
    >
  >
): ShelfItem | undefined {
  const s = getStore();
  const idx = s.shelf.findIndex((it) => it.id === id);
  if (idx === -1) return undefined;
  const cur = s.shelf[idx];
  const next: ShelfItem = {
    ...cur,
    ...patch,
    // 상태 전환 시 자동 날짜 — 사용자가 직접 patch 한 값이 우선
    startedAt:
      patch.startedAt ??
      (patch.status === "READING" && !cur.startedAt
        ? new Date().toISOString().slice(0, 10)
        : cur.startedAt),
    finishedAt:
      patch.finishedAt ??
      (patch.status === "FINISHED" && !cur.finishedAt
        ? new Date().toISOString().slice(0, 10)
        : cur.finishedAt),
    updatedAt: new Date().toISOString(),
  };
  s.shelf[idx] = next;
  return next;
}

export function mockRemoveShelfItem(id: string): boolean {
  const s = getStore();
  const before = s.shelf.length;
  s.shelf = s.shelf.filter((it) => it.id !== id);
  return s.shelf.length < before;
}

export function mockGetShelfItem(id: string): ShelfItem | undefined {
  return getStore().shelf.find((it) => it.id === id);
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

// ---------- Coupons (0017) ----------

// 만료 일자가 지난 AVAILABLE 쿠폰을 EXPIRED 로 옮긴다 — DB 의 expire_old_coupons() 동등.
// 조회 시점에 호출하므로 별도 cron 없이도 화면이 정확한 status 를 보여준다.
function expireOldCoupons() {
  const s = getStore();
  const now = Date.now();
  for (const c of s.coupons) {
    if (c.status === "AVAILABLE" && Date.parse(c.expiresAt) < now) {
      c.status = "EXPIRED";
    }
  }
}

export function mockListMyCoupons(): UserCoupon[] {
  expireOldCoupons();
  // 최신 발급 순 — 같은 status 안에서 issued_at 내림차순
  return [...getStore().coupons].sort((a, b) =>
    a.issuedAt < b.issuedAt ? 1 : a.issuedAt > b.issuedAt ? -1 : 0
  );
}

export function mockGetCoupon(id: string): UserCoupon | undefined {
  expireOldCoupons();
  return getStore().coupons.find((c) => c.id === id);
}

// 결제 시 호출 — 쿠폰을 USED 로 옮기고 사용 거래 id 를 기록.
// 이미 USED/EXPIRED 면 변경하지 않음 (race 방어).
export function mockMarkCouponUsed(couponId: string, transactionId: string) {
  const s = getStore();
  const c = s.coupons.find((x) => x.id === couponId);
  if (!c) return;
  if (c.status !== "AVAILABLE") return;
  c.status = "USED";
  c.usedAt = new Date().toISOString();
  c.usedTransactionId = transactionId;
}

export const POPULAR_SEARCHES = [
  "채식주의자",
  "아몬드",
  "트렌드 코리아",
  "물고기는 존재하지 않는다",
  "역행자",
  "달러구트",
];
