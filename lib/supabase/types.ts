export type BookState = "A_PLUS" | "A" | "B" | "C";
export type TradeMethod = "DIRECT" | "PARCEL" | "BOTH";
export type BookStatus = "SELLING" | "RESERVED" | "SOLD" | "HIDDEN";
export type TxStatus =
  | "OFFERED"
  | "ACCEPTED"
  | "PAID"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELED";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  rating_avg: number;
  trade_count: number;
  preferred_genres: string[];
}

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
  created_at: string;
  updated_at: string;
}

export interface ChatRoomRow {
  id: string;
  book_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
}

export const STATE_LABEL: Record<BookState, string> = {
  A_PLUS: "A+급",
  A: "A급",
  B: "B급",
  C: "C급",
};

export const TX_LABEL: Record<TxStatus, string> = {
  OFFERED: "제안",
  ACCEPTED: "거래중",
  PAID: "결제완료",
  SHIPPING: "배송중",
  COMPLETED: "거래완료",
  CANCELED: "취소",
};
