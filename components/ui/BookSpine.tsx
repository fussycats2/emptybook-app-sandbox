"use client";

// 책장(/mypage/shelf) 에 진열되는 "책등(book spine)" 카드.
// - cover_url 이 있으면 표지 이미지를 그대로 세로 직사각형으로 표시
// - 없으면 카테고리별 색상 띠 + 제목/저자 텍스트로 가짜 책등 그리기
// - 너비 48px, 높이 156px 로 실제 책장처럼 빽빽하게 진열

import { Box, Typography } from "@mui/material";
import { palette, radius, shadow } from "@/lib/theme";

// 카테고리별 책등 색 — 책장이 알록달록해 보이도록.
// 매핑되지 않은 카테고리는 sage 기본 톤
const CATEGORY_COLOR: Record<string, { from: string; to: string; ink: string }> = {
  소설: { from: "#2D5F4A", to: "#1E4434", ink: "#fff" },
  에세이: { from: "#D9695A", to: "#B85546", ink: "#fff" },
  자기계발: { from: "#C58A2C", to: "#9B6B1F", ink: "#fff" },
  "경제/경영": { from: "#3E5C7E", to: "#2A3F58", ink: "#fff" },
  과학: { from: "#3E9166", to: "#2D6F4D", ink: "#fff" },
  역사: { from: "#7C5933", to: "#5C4124", ink: "#fff" },
  아동: { from: "#E7A4A4", to: "#C57878", ink: "#fff" },
  만화: { from: "#7E5DB8", to: "#5E4490", ink: "#fff" },
};

const FALLBACK = { from: palette.primary, to: palette.primaryDark, ink: "#fff" };

interface Props {
  title: string;
  author?: string;
  category?: string;
  coverUrl?: string;
  onClick?: () => void;
  // 작은 별점 뱃지 — 우측 상단에 노출
  rating?: number;
}

export default function BookSpine({
  title,
  author,
  category,
  coverUrl,
  onClick,
  rating,
}: Props) {
  const tone = (category && CATEGORY_COLOR[category]) || FALLBACK;
  return (
    <Box
      onClick={onClick}
      sx={{
        flexShrink: 0,
        width: 48,
        height: 156,
        borderRadius: `${radius.xs}px`,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        boxShadow: shadow.card,
        transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease",
        "&:hover": {
          transform: "translateY(-4px) rotate(-1deg)",
          boxShadow: shadow.cardHover,
        },
        // 표지 이미지가 있으면 그대로 사용
        ...(coverUrl
          ? {
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              background: `linear-gradient(180deg, ${tone.from} 0%, ${tone.to} 100%)`,
            }),
      }}
    >
      {/* 표지 없을 때 — 책등 텍스트 (수직 정렬) */}
      {!coverUrl && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            px: 0.5,
            py: 1.25,
          }}
        >
          <Typography
            sx={{
              writingMode: "vertical-rl",
              fontSize: 12,
              fontWeight: 800,
              color: tone.ink,
              letterSpacing: "0.04em",
              lineHeight: 1.2,
              maxHeight: "78%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
          {author && (
            <Typography
              sx={{
                writingMode: "vertical-rl",
                fontSize: 9.5,
                fontWeight: 600,
                color: tone.ink,
                opacity: 0.8,
                mt: 0.5,
                maxHeight: "60%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {author}
            </Typography>
          )}
        </Box>
      )}

      {/* 표지 위에 살짝 그라데이션 — 텍스트가 없어도 입체감 부여 */}
      {coverUrl && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.10) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 별점 뱃지 (있을 때만) */}
      {rating !== undefined && (
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontSize: 9.5,
            fontWeight: 800,
            borderRadius: 999,
            px: 0.6,
            py: 0.1,
            letterSpacing: "-0.02em",
          }}
        >
          ★ {rating}
        </Box>
      )}
    </Box>
  );
}
