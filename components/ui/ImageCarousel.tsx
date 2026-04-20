"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import BookImage from "./BookImage";
import { palette } from "@/lib/theme";

interface Props {
  count?: number;
  seed?: string | number;
  height?: number | string;
}

export default function ImageCarousel({ count = 4, seed, height = 380 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

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
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: "0 0 100%",
              scrollSnapAlign: "start",
            }}
          >
            <BookImage
              seed={`${seed}-${i}`}
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
        {idx + 1} / {count}
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
        {Array.from({ length: count }).map((_, i) => (
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
