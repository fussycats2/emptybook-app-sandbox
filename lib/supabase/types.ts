// Supabase DB의 enum/row 타입 정의
// - DB 스키마(supabase/migrations/0001_init.sql)와 1:1로 매칭됨
// - 컬럼이나 enum 값이 바뀌면 이 파일도 함께 수정해야 한다

// 책 상태 등급(매물 컨디션). A_PLUS가 가장 좋고 C가 가장 낮음
export type BookState = "A_PLUS" | "A" | "B" | "C";
// 거래 방식: 직거래 / 택배 / 둘 다 가능
export type TradeMethod = "DIRECT" | "PARCEL" | "BOTH";
// 매물 노출 상태: 판매중 / 예약중 / 판매완료 / 숨김
export type BookStatus = "SELLING" | "RESERVED" | "SOLD" | "HIDDEN";
// 거래(트랜잭션) 진행 단계
// OFFERED(가격제안) → ACCEPTED(수락) → PAID(결제완료) → SHIPPING(배송중) → COMPLETED(거래완료)
// 중간에 CANCELED(취소) 가능
export type TxStatus =
  | "OFFERED"
  | "ACCEPTED"
  | "PAID"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELED";

// 사용자 프로필 (auth.users 와 1:1 매핑되는 profiles 테이블)
// id 는 Supabase Auth 의 user.id 와 동일하게 유지된다
export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  rating_avg: number; // 평균 별점(0~5)
  trade_count: number; // 누적 거래 횟수
  preferred_genres: string[]; // 선호 장르 (회원가입 시 선택)
  app_prefs: AppPrefs; // 알림/개인정보 토글 등 환경설정 묶음
  region: string | null; // 거주 자치구(서울 25개) — 마이페이지 카드 라벨 + 향후 추천 가중치
}

// 사용자 환경설정 — profiles.app_prefs(jsonb) 의 형상
// 누락된 키는 false 로 처리하지 말고 항목별 기본값(아래 DEFAULT_APP_PREFS) 적용
export interface AppPrefs {
  push?: {
    all?: boolean;
    chat?: boolean;
    trade?: boolean;
    marketing?: boolean;
  };
  privacy?: {
    location?: boolean;
    wishlist_public?: boolean;
    trades_public?: boolean;
  };
}

export const DEFAULT_APP_PREFS: Required<{
  push: Required<NonNullable<AppPrefs["push"]>>;
  privacy: Required<NonNullable<AppPrefs["privacy"]>>;
}> = {
  push: { all: true, chat: true, trade: true, marketing: false },
  privacy: { location: true, wishlist_public: false, trades_public: true },
};

// 0013_books_condition_detail.sql — 도서 상태 상세 체크리스트.
// 분쟁 시 근거가 되도록 항목별 체크 결과를 jsonb 로 보관. 카테고리별 그룹은
// `lib/conditionGrade.ts` 의 정의와 1:1 매칭된다 — 항목 추가 시 양쪽을 함께 갱신할 것.
export interface ConditionDetail {
  cover?: { fold?: boolean; scratch?: boolean; discolor?: boolean };
  spine?: { bend?: boolean; fade?: boolean };
  corner?: { wear?: boolean };
  body?: {
    pen?: boolean;
    highlight?: boolean;
    stain?: boolean;
    missing?: boolean;
  };
  extras?: {
    band_missing?: boolean;
    postcard_missing?: boolean;
    cd_missing?: boolean;
  };
}

// books 테이블 한 행(row)에 대응하는 타입
export interface BookRow {
  id: string;
  seller_id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  category: string | null;
  state: BookState;
  price: number;
  original_price: number | null;
  trade_method: TradeMethod;
  region: string | null;
  description: string | null; // 사용자 입력 코멘트
  status: BookStatus;
  view_count: number;
  like_count: number;
  cover_url: string | null;
  // 0011_book_metadata.sql 에서 추가된 네이버 도서 메타데이터 컬럼들
  synopsis: string | null; // 책 줄거리 (네이버 description)
  pub_date: string | null; // 발행일 (YYYY-MM-DD)
  source_url: string | null; // 외부 정보 출처(네이버 도서 페이지) URL
  // 0013 — 도서 상태 상세 체크리스트 (jsonb). 미체크 / 기존 데이터는 null
  condition_detail: ConditionDetail | null;
  created_at: string;
  updated_at: string;
}

// 채팅방(구매자 ↔ 판매자 1:1) 한 행
export interface ChatRoomRow {
  id: string;
  book_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

// 채팅방 안에 쌓이는 메시지 한 행
// type: 텍스트/이미지/시스템 메시지 등 구분 (현재는 단순 문자열로 운용)
export interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
}

// DB enum → 사용자에게 보여줄 한글 라벨로 변환하는 매핑
// (UI 출력 시 STATE_LABEL[row.state] 형태로 사용)
export const STATE_LABEL: Record<BookState, string> = {
  A_PLUS: "A+급",
  A: "A급",
  B: "B급",
  C: "C급",
};

// 거래 진행 단계 enum → 한글 라벨
export const TX_LABEL: Record<TxStatus, string> = {
  OFFERED: "제안",
  ACCEPTED: "거래중",
  PAID: "결제완료",
  SHIPPING: "배송중",
  COMPLETED: "거래완료",
  CANCELED: "취소",
};

// 0012_shelf_items.sql — 사용자 개인 책장
// READING(읽는 중) / FINISHED(완독) / FOR_SALE(판매예정) / OWNED(소장)
export type ShelfStatus = "READING" | "FINISHED" | "FOR_SALE" | "OWNED";

export const SHELF_STATUS_LABEL: Record<ShelfStatus, string> = {
  READING: "읽는 중",
  FINISHED: "완독",
  FOR_SALE: "판매예정",
  OWNED: "소장",
};

// shelf_items 테이블 한 행. books 와 분리된 개인 컬렉션이라
// 메타데이터(title/author/...)는 denormalize 해서 저장한다.
export interface ShelfItemRow {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  category: string | null;
  cover_url: string | null;
  status: ShelfStatus;
  started_at: string | null; // YYYY-MM-DD
  finished_at: string | null; // YYYY-MM-DD
  rating: number | null; // 1-5 개인 별점
  memo: string | null;
  linked_book_id: string | null; // 판매 등록한 books.id (있을 수도 없을 수도)
  created_at: string;
  updated_at: string;
}

// 화면에서 쓸 정규화된 형태 (camelCase + 비어 있는 값은 undefined)
export interface ShelfItem {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  category?: string;
  coverUrl?: string;
  status: ShelfStatus;
  startedAt?: string;
  finishedAt?: string;
  rating?: number;
  memo?: string;
  linkedBookId?: string;
  createdAt: string;
  updatedAt: string;
}

export function shelfRowToItem(r: ShelfItemRow): ShelfItem {
  return {
    id: r.id,
    title: r.title,
    author: r.author ?? undefined,
    publisher: r.publisher ?? undefined,
    isbn: r.isbn ?? undefined,
    category: r.category ?? undefined,
    coverUrl: r.cover_url ?? undefined,
    status: r.status,
    startedAt: r.started_at ?? undefined,
    finishedAt: r.finished_at ?? undefined,
    rating: r.rating ?? undefined,
    memo: r.memo ?? undefined,
    linkedBookId: r.linked_book_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------------- 쿠폰 (0017) ----------------
export type CouponDiscountType = "FIXED" | "PERCENT";
export type CouponIssueKind = "SIGNUP" | "EVENT" | "MANUAL";
export type UserCouponStatus = "AVAILABLE" | "USED" | "EXPIRED";

export const USER_COUPON_STATUS_LABEL: Record<UserCouponStatus, string> = {
  AVAILABLE: "사용 가능",
  USED: "사용 완료",
  EXPIRED: "기간 만료",
};

// /mypage/coupons / /checkout 에서 함께 쓰는 평탄화된 형태.
// template 필드를 분리하지 않고 한 객체에 합쳐 화면이 단순해지게.
export interface UserCoupon {
  id: string;
  templateId: string;
  status: UserCouponStatus;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
  usedTransactionId?: string;
  // template 메타데이터 (denormalize)
  name: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  code?: string;
}

// 결제 시 쿠폰을 적용했을 때 실제 깎이는 금액 계산.
// PERCENT 는 max_discount 상한이 있으면 클램프. min_order_amount 미달이면 0.
export function calcCouponDiscount(
  coupon: Pick<
    UserCoupon,
    "discountType" | "discountValue" | "minOrderAmount" | "maxDiscount"
  >,
  goodsAmount: number
): number {
  if (goodsAmount < coupon.minOrderAmount) return 0;
  if (coupon.discountType === "FIXED") {
    return Math.min(coupon.discountValue, goodsAmount);
  }
  // PERCENT
  const raw = Math.floor((goodsAmount * coupon.discountValue) / 100);
  const capped =
    coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.min(capped, goodsAmount);
}

// 사용자에게 보여주는 할인 표기 (카드/적용 영역 공용)
export function formatCouponDiscount(
  coupon: Pick<UserCoupon, "discountType" | "discountValue" | "maxDiscount">
): string {
  if (coupon.discountType === "FIXED") {
    return `${coupon.discountValue.toLocaleString()}원 할인`;
  }
  const max =
    coupon.maxDiscount != null
      ? ` (최대 ${coupon.maxDiscount.toLocaleString()}원)`
      : "";
  return `${coupon.discountValue}%${max} 할인`;
}
