"use client";

// 도서 상세 화면 상단의 이미지 캐러셀(좌우 스와이프)
// CSS scroll-snap 으로 자연스러운 페이지 단위 스크롤 + scrollLeft 로 인덱스 추적
//
// 슬라이드 구성 규칙
//   1) coverUrl 이 있으면 항상 첫 슬라이드 (네이버/알라딘 표지나 첫 업로드)
//   2) imageUrls(사용자 업로드) 를 그 뒤에 붙임 — coverUrl 과 같은 URL 은 중복 제거
//   3) 둘 다 없으면 placeholder count 로 BookImage 폴백
//   첫 슬라이드가 표지로 통일되어 사용자가 어떤 책인지 즉시 인지 가능
//
// 인디케이터: 점들을 직접 클릭(데스크톱) 하면 해당 슬라이드로 스크롤. 모바일은 스와이프 그대로.
//
// 표시 모드: 실사진은 object-fit: contain — 표지(세로) / 사용자 사진(가로/세로 혼재) 어느 쪽도
// 잘림 없이 전체 노출. 책 마켓플레이스의 신뢰감을 위해 letterbox 가 cover-crop 보다 자연스러움.

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import BookImage from "./BookImage";
import { palette } from "@/lib/theme";

interface Props {
  count?: number;
  seed?: string | number;
  height?: number | string;
  coverUrl?: string;
  imageUrls?: string[];
}

export default function ImageCarousel({
  count = 4,
  seed,
  height = 300,
  coverUrl,
  imageUrls,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  // 슬라이드 빌드 — coverUrl 우선, imageUrls 뒤에 dedup 으로 합치기
  const slides: (string | undefined)[] = (() => {
    const seen = new Set<string>();
    const arr: string[] = [];
    if (coverUrl) {
      arr.push(coverUrl);
      seen.add(coverUrl);
    }
    for (const url of imageUrls ?? []) {
      if (url && !seen.has(url)) {
        arr.push(url);
        seen.add(url);
      }
    }
    if (arr.length > 0) return arr;
    return Array.from({ length: count }, () => undefined);
  })();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIdx(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 점 클릭 → 해당 슬라이드로 부드럽게 스크롤 (데스크톱에서도 이동 가능)
  const scrollTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

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
              height,
              // 실사진의 contain 에서 letterbox 영역 — 책장 톤 cream 으로 자연스럽게
              background: palette.surfaceAlt,
              position: "relative",
            }}
          >
            {src ? (
              <Box
                component="img"
                src={src}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <BookImage seed={`${seed}-${i}`} height={height} radius={0} />
            )}
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
      {/* 인디케이터 — 각 점이 클릭 가능해야 데스크톱에서도 슬라이드 이동 가능 */}
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          left: 0,
          right: 0,
          display: "flex",
          gap: 0.6,
          justifyContent: "center",
        }}
      >
        {slides.map((_, i) => {
          const on = i === idx;
          return (
            <Box
              key={i}
              role="button"
              aria-label={`사진 ${i + 1}로 이동`}
              onClick={() => scrollTo(i)}
              sx={{
                width: on ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: on ? "#fff" : "rgba(255,255,255,0.55)",
                cursor: "pointer",
                transition: "width 200ms ease, background 160ms ease",
                "&:hover": {
                  background: on ? "#fff" : "rgba(255,255,255,0.8)",
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
