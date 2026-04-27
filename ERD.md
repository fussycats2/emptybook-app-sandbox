# EmptyBook (책장비움) — 데이터베이스 ERD

> 기준 파일: [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
> 최종 업데이트: 2026-04-23

## 1. Mermaid ERD

GitHub / Notion / VSCode 등에서 자동 렌더링된다.

```mermaid
erDiagram
    auth_users ||--|| profiles : "1:1 (trigger)"

    profiles ||--o{ books : "seller_id"
    profiles ||--o{ likes : "user_id"
    profiles ||--o{ transactions : "buyer_id"
    profiles ||--o{ transactions : "seller_id"
    profiles ||--o{ reviews : "reviewer_id"
    profiles ||--o{ reviews : "reviewee_id"
    profiles ||--o{ chat_rooms : "buyer_id"
    profiles ||--o{ chat_rooms : "seller_id"
    profiles ||--o{ messages : "sender_id"
    profiles ||--o{ notifications : "user_id"

    books ||--o{ book_images : "book_id"
    books ||--o{ likes : "book_id"
    books ||--o{ transactions : "book_id"
    books ||--o{ chat_rooms : "book_id (nullable)"

    transactions ||--|| payments : "1:1"
    transactions ||--|| reviews : "1:1"

    chat_rooms ||--o{ messages : "room_id"

    profiles {
        uuid id PK "FK auth.users"
        text username UK
        text display_name
        text phone
        text avatar_url
        numeric rating_avg
        int trade_count
        text_array preferred_genres
    }

    books {
        uuid id PK
        uuid seller_id FK
        text title
        text author
        text publisher
        text isbn
        text category
        enum state "A_PLUS|A|B|C"
        int price
        int original_price
        enum trade_method "DIRECT|PARCEL|BOTH"
        text region
        text description
        enum status "SELLING|RESERVED|SOLD|HIDDEN"
        int view_count
        int like_count
    }

    book_images {
        uuid id PK
        uuid book_id FK
        text storage_path
        int sort_order
    }

    likes {
        uuid user_id PK,FK
        uuid book_id PK,FK
        timestamptz created_at
    }

    transactions {
        uuid id PK
        uuid book_id FK
        uuid buyer_id FK
        uuid seller_id FK
        int offered_price
        enum trade_method
        enum status "OFFERED→ACCEPTED→PAID→SHIPPING→COMPLETED|CANCELED"
        timestamptz meet_at
        jsonb shipping_address
        text message
    }

    payments {
        uuid id PK
        uuid transaction_id FK,UK
        text method
        int amount
        int shipping_fee
        int coupon_discount
        timestamptz paid_at
        text status
    }

    reviews {
        uuid id PK
        uuid transaction_id FK,UK
        uuid reviewer_id FK
        uuid reviewee_id FK
        int rating "1-5"
        text match_level
        text_array tags
        text comment
    }

    chat_rooms {
        uuid id PK
        uuid book_id FK "nullable"
        uuid buyer_id FK
        uuid seller_id FK
        text last_message
        timestamptz last_message_at
    }

    messages {
        uuid id PK
        uuid room_id FK
        uuid sender_id FK
        text body
        text type "TEXT|IMAGE|SYSTEM"
        timestamptz read_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text kind
        jsonb payload
        timestamptz read_at
    }
```

## 2. 관계 요약 표

| From | → | To | 관계 | FK / 키 | 비고 |
|---|---|---|---|---|---|
| `auth.users` | → | `profiles` | 1:1 | `profiles.id` | `on_auth_user_created` 트리거가 자동 생성 |
| `profiles` | → | `books` | 1:N | `books.seller_id` | 판매자 |
| `books` | → | `book_images` | 1:N | `book_images.book_id` | `sort_order`로 정렬 |
| `profiles` ↔ `books` |  |  | N:M | `likes(user_id, book_id)` | 복합 PK |
| `books` | → | `transactions` | 1:N | `transactions.book_id` | `on delete restrict` (이력 보존) |
| `profiles` | → | `transactions` | 1:N × 2 | `buyer_id`, `seller_id` | 두 개의 FK |
| `transactions` | → | `payments` | 1:1 | `payments.transaction_id` UNIQUE | 결제 |
| `transactions` | → | `reviews` | 1:1 | `reviews.transaction_id` UNIQUE | 거래 1건당 후기 1개 |
| `profiles` | → | `reviews` | 1:N × 2 | `reviewer_id`, `reviewee_id` | 작성자 / 대상자 |
| `books` | → | `chat_rooms` | 1:N | `chat_rooms.book_id` | nullable, `on delete set null` |
| `profiles` | → | `chat_rooms` | 1:N × 2 | `buyer_id`, `seller_id` | `UNIQUE(book_id, buyer_id, seller_id)` |
| `chat_rooms` | → | `messages` | 1:N | `messages.room_id` | Realtime 구독 |
| `profiles` | → | `messages` | 1:N | `sender_id` |  |
| `profiles` | → | `notifications` | 1:N | `user_id` | Realtime 구독 |

## 3. Enum 타입

| Enum | 값 |
|---|---|
| `book_state` | `A_PLUS`, `A`, `B`, `C` |
| `trade_method` | `DIRECT`, `PARCEL`, `BOTH` |
| `book_status` | `SELLING`, `RESERVED`, `SOLD`, `HIDDEN` |
| `tx_status` | `OFFERED` → `ACCEPTED` → `PAID` → `SHIPPING` → `COMPLETED` / `CANCELED` |

## 4. 부가 사항

- **Realtime 구독 테이블**: `messages`, `chat_rooms`, `notifications`
- **Storage 버킷**: `book-images` (public read, 인증 사용자 upload)
- **RLS**: 전 테이블 활성화
  - `profiles` / `books` / `book_images` / `reviews` — public read
  - `likes` / `notifications` — 본인만
  - `transactions` / `payments` / `chat_rooms` / `messages` — 거래 당사자(buyer·seller)만

## 5. 이미지로 추출하려면

```bash
# mermaid-cli 설치 후
npx -p @mermaid-js/mermaid-cli mmdc -i ERD.md -o ERD.png
```

또는 [Mermaid Live Editor](https://mermaid.live)에 위 ` ```mermaid ` 블록을 붙여넣으면 PNG/SVG로 내보낼 수 있다.
