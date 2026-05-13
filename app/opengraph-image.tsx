// 사이트 공유 시 카카오톡/페이스북/트위터 등에서 노출되는 미리보기 카드 이미지.
// Next.js 가 빌드 타임/요청 시 1200×630 PNG 를 자동 생성한다.
// - 외부 이미지 다운로드 없이 ImageResponse 만으로 그려서 추가 의존성 0.
// - 글꼴은 시스템 sans-serif (한글 포함) — Pretendard 까지 임베드하면 번들이 커져 의도적으로 제외.
// - 같은 alt/size/contentType 을 named export 로 노출해야 Next.js 메타데이터가 인식.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "책장비움 — 내 책장을 비우고 이웃과 중고 도서를 거래해요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          background:
            "linear-gradient(135deg, #F7F4ED 0%, #FBF9F4 55%, #E6EFEA 100%)",
          color: "#1A2620",
          fontFamily:
            'Pretendard, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif',
        }}
      >
        {/* 상단: 브랜드 마크 + 워드마크 */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: "#2D5F4A",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              boxShadow: "0 8px 24px rgba(45, 95, 74, 0.28)",
            }}
          >
            EB
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#2D5F4A",
            }}
          >
            EmptyBook
          </div>
        </div>

        {/* 중앙: 헤드라인 + 부제 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#1A2620",
            }}
          >
            책장비움
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.35,
              color: "#5C6B63",
              maxWidth: 880,
            }}
          >
            내 책장을 비우고 이웃과 중고 도서를 거래해요.
            사진 한 장으로 등록하고, 채팅으로 바로 만나요.
          </div>
        </div>

        {/* 하단: 액센트 라인 + 도메인 힌트 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 6,
              borderRadius: 999,
              background: "#D9695A",
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#94A099",
            }}
          >
            동네 중고 도서 거래
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
