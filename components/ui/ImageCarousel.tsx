"use client";

// 도서 상세 화면 상단의 이미지 캐러셀(좌우 스와이프)
// CSS scroll-snap 으로 자연스러운 페이지 단위 스크롤을 구현하고
// scrollLeft 값을 보고 현재 인덱스를 계산해 인디케이터에 표시

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import BookImage from "./BookImage";
import { palette } from "@/lib/theme";

interface Props {
  count?: number;
  seed?: string | number;
  height?: number | string;
  coverUrl?: string; // 외부 표지 URL — imageUrls 가 비었을 때 첫 슬라이드로 폴백
  imageUrls?: string[]; // 사용자가 업로드한 사진들 — 있으면 슬라이드별로 매핑
}

export default function ImageCarousel({
  count = 4,
  seed,
  height = 380,
  coverUrl,
  imageUrls,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  // 우선순위: 업로드 이미지 → coverUrl 단일 슬라이드 → placeholder count
  const slides: (string | undefined)[] =
    imageUrls && imageUrls.length > 0
      ? imageUrls
      : coverUrl
      ? [coverUrl]
      : Array.from({ length: count }, () => undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 스크롤이 멈출 때 어느 페이지에 가까운지 반올림으로 계산
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIdx(i);
    };
    // passive: true → 스크롤 성능 향상 (preventDefault 안 쓰겠다는 약속)
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Box
        ref={ref}
        className="no-scrollbar"
        sx={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
        }}
      >
        {slides.map((src, i) => (
          <Box
            key={i}
            sx={{
              flex: "0 0 100%",
              scrollSnapAlign: "start",
            }}
          >
            <BookImage
              seed={`${seed}-${i}`}
              src={src}
              height={height}
              radius={0}
            />
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          right: 12,
          background: "rgba(26,43,34,0.55)",
          color: "#fff",
          px: 1.25,
          py: 0.25,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {idx + 1} / {slides.length}
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          left: 0,
          right: 0,
          display: "flex",
          gap: 0.5,
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {slides.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: i === idx ? 16 : 6,
              height: 6,
              borderRadius: 999,
              background: i === idx ? "#fff" : "rgba(255,255,255,0.55)",
              transition: "all 200ms",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
