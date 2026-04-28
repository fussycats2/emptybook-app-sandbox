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
  description: string | null;
  status: BookStatus;
  view_count: number;
  like_count: number;
  cover_url: string | null;
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
