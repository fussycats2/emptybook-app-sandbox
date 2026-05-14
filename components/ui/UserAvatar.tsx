"use client";

// 사용자 프로필 아바타 — 채팅 목록 / 채팅 상세 / 마이페이지 등에서 "사람" 컨텍스트.
// BookImage 와 다른 점:
//  - placeholder 가 책 아이콘이 아니라 **이름 이니셜** (있으면) 또는 **person 아이콘**
//  - 항상 원형(circle), 책 비율 없음
//  - profiles 테이블에 avatar_url 컬럼이 없는 현 스키마에서 "프로필 사진" UX 자리 차지
//
// 같은 (seed → 색) 매핑 규칙을 BookImage 와 공유해 시각적 일관성 유지.

import { Box } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

interface Props {
  /** 표시할 사용자 이름 (있으면 첫 글자 이니셜로 사용). 익명화된 표시명(예: "김O") 도 그대로 OK. */
  name?: string;
  /** 색상 시드 — 같은 사용자/같은 방은 항상 같은 색이 나오도록 보장. 비우면 name 으로 폴백. */
  seed?: string | number;
  /** 정사각형 한 변 길이 (px). 기본 40. */
  size?: number;
  /** 실제 프로필 이미지 URL (현재 스키마엔 없음, 미래 확장 대비). */
  src?: string;
  sx?: any;
}

// BookImage 와 동일한 팔레트/해시 — 같은 시드면 같은 색이 나오게 통일
const PALETTES: ReadonlyArray<readonly [string, string]> = [
  ["#E6EFEA", "#2D5F4A"],
  ["#F6E6E1", "#A04A3D"],
  ["#ECE5E8", "#6B5060"],
  ["#F4ECD9", "#8C6B26"],
  ["#E5ECEF", "#3F5C70"],
  ["#EFEBE3", "#5C6B63"],
];

function pick(seed?: string | number): readonly [string, string] {
  const key = String(seed ?? "x");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// 이름 첫 한 글자(한글/영문 안전). 공백 제거 후 빈 문자열이면 undefined.
function firstChar(name?: string): string | undefined {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  // 코드 포인트 단위 — surrogate pair 안전 (대부분 한글/영문엔 무관하지만 이모지 닉네임 대비)
  return Array.from(trimmed)[0];
}

export default function UserAvatar({ name, seed, size = 40, src, sx }: Props) {
  const [bg, fg] = pick(seed ?? name);
  const initial = firstChar(name);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        // 이니셜 폰트 크기는 size 의 약 40% — 작은 사이즈에서도 가독
        fontSize: Math.round(size * 0.4),
        fontWeight: 800,
        letterSpacing: "-0.02em",
        userSelect: "none",
        ...sx,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : initial ? (
        <span>{initial}</span>
      ) : (
        <PersonRoundedIcon sx={{ fontSize: Math.round(size * 0.6), opacity: 0.7 }} />
      )}
    </Box>
  );
}
