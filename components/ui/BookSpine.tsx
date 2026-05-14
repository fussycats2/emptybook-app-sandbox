"use client";

// 책장(/mypage/shelf) 에 진열되는 "책등(book spine)" 카드.
//
// 표지가 책등 형태에 어울리지 않게 늘어붙는 문제 → CSS 만으로 책등을 자동 생성.
// - book.id (또는 title) 해시로 테마·색·너비·장식을 결정적으로 선택
// - 4가지 테마: 하드커버 / 페이퍼백 / 빈티지 / 메탈릭
// - 12가지 컬러 팔레트 + 가로 너비 42~58px 변주로 실제 책장처럼 다양한 룩
// - 본문 레이아웃(실제 책등 모방):
//     · 제목: 가운데 영역에 vertical-rl 로 표시, 길면 여러 컬럼으로 wrap
//             — 제목 글자수가 넘치면 잘라서 "…" 로 마무리 (전부 표현하려 하지 않음)
//     · 저자: 하단 가로 1줄로 작게 — 길면 ellipsis

import { Box } from "@mui/material";
import { palette, radius, shadow } from "@/lib/theme";

interface Props {
  title: string;
  author?: string;
  category?: string; // 호환용 — 지금은 사용하지 않음
  coverUrl?: string; // 호환용 — 책장 뷰에서는 무시
  onClick?: () => void;
  rating?: number;
  // 해시 시드 — 보통 book.id. 없으면 title 로 폴백
  seed?: string;
  // 매물 등록된 책에 띠지(obi) 표시 — 책장 외부에서도 한눈에 알아보게
  listed?: boolean;
}

// 책등 베이스 컬러 — 이미지의 톤을 참고한 12종 (어두운/뮤트 위주, 책장 분위기)
const COLORS: { bg: string; ink: string; tint: string }[] = [
  { bg: "#5C2A2E", ink: "#F2E3C6", tint: "#7A3A40" }, // burgundy
  { bg: "#2D4A36", ink: "#E8D9B8", tint: "#3F6249" }, // forest
  { bg: "#1F3552", ink: "#E0D6BC", tint: "#2C476B" }, // navy
  { bg: "#7A5A1F", ink: "#F4E4BC", tint: "#9B7530" }, // mustard
  { bg: "#D4C4A4", ink: "#3D2E1F", tint: "#E8DCC4" }, // cream — bg=어두운 크림, tint=밝은 크림 (다른 색들과 동일한 컨벤션)
  { bg: "#8E6E48", ink: "#F2E3C6", tint: "#A38259" }, // tan
  { bg: "#2A4F4F", ink: "#E0DBC4", tint: "#3D6868" }, // dark teal
  { bg: "#4A2B47", ink: "#E8D5C0", tint: "#653F62" }, // plum
  { bg: "#2A2A2A", ink: "#D9C9A8", tint: "#3F3F3F" }, // charcoal
  { bg: "#3F2A1A", ink: "#E8D5B5", tint: "#5A3F2A" }, // dark brown
  { bg: "#535A2D", ink: "#F0E5B8", tint: "#6B7340" }, // olive
  { bg: "#3E5C7E", ink: "#E5DDC4", tint: "#557396" }, // slate blue
];

const ACCENT = {
  gold: "#C9A96E",
  silver: "#C5C7CC",
  copper: "#B07852",
};

type Theme = "hardcover" | "paperback" | "vintage" | "metallic";

interface SpineSpec {
  theme: Theme;
  color: (typeof COLORS)[number];
  accent: string;
  width: number;
  font: "serif" | "sans";
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
  }
  return Math.abs(h | 0);
}

function specFromSeed(seed: string): SpineSpec {
  const h = hash(seed || "x");
  const themes: Theme[] = ["hardcover", "paperback", "vintage", "metallic"];
  const theme = themes[h % themes.length];
  const color = COLORS[(h >> 3) % COLORS.length];
  const accent =
    theme === "metallic"
      ? ((h >> 6) & 1) === 0
        ? ACCENT.silver
        : ACCENT.copper
      : ACCENT.gold;
  const width = 44 + ((h >> 9) % 15); // 44..58 — 너무 좁으면 글자 wrap 이 어색해서 하한 살짝 올림
  const font: "serif" | "sans" =
    theme === "hardcover" || theme === "vintage" ? "serif" : "sans";
  return { theme, color, accent, width, font };
}

const SERIF = '"Noto Serif KR", "Pretendard Variable", serif';
const SANS = '"Pretendard Variable", "Noto Sans KR", sans-serif';

const SPINE_HEIGHT = 156;
// 한 글자의 inline-axis(세로) advance 는 글자 종류에 따라 크게 다르다.
// - CJK(한글/한자/가나): vertical-rl 에서 정립 — advance ≈ fontSize × 1.0 (정사각형). 안전마진 포함 1.12.
// - Latin/숫자: text-orientation: mixed 기본값이라 90° 회전되어 누워 들어감 — advance = 가로 폭 = ~0.5em 평균.
//   (대문자 'M'≈1em, 소문자 'i'≈0.3em, 일반 단어 평균 ~0.55em)
// - 공백: ~0.3em.
// 이전엔 모든 글자에 1.12 를 곱해서 영문이 2배 가까이 과대평가됨 → 너무 일찍 잘리고 폰트도 과하게 축소.
const CJK_FACTOR = 1.12;
const LATIN_FACTOR = 0.6;
// 공백은 보통 half-width(~0.5em). 0.5 + 약간 의 추가 안전.
const SPACE_FACTOR = 0.55;
// CSS letter-spacing/line-height/round-up 으로 실제 advance 가 추정치보다 살짝 큼 — 안전 마진.
const FIT_SAFETY = 0.96;

function isCJK(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return (
    (c >= 0xac00 && c <= 0xd7a3) || // 한글 음절
    (c >= 0x3040 && c <= 0x309f) || // 히라가나
    (c >= 0x30a0 && c <= 0x30ff) || // 가타카나
    (c >= 0x4e00 && c <= 0x9fff) || // CJK 통합
    (c >= 0x3400 && c <= 0x4dbf) || // CJK 확장 A
    (c >= 0xf900 && c <= 0xfaff) // CJK 호환
  );
}

function charFactor(ch: string): number {
  if (ch === " ") return SPACE_FACTOR;
  if (isCJK(ch)) return CJK_FACTOR;
  return LATIN_FACTOR;
}

// 텍스트 전체가 fontSize 에서 차지할 inline-axis(세로) 길이 추정.
function estimateInline(text: string, fontSize: number): number {
  let total = 0;
  for (const ch of text) total += charFactor(ch) * fontSize;
  return total;
}

// 제목 정리 — "(부제/시리즈)" 같은 괄호 이후는 떼어버린다. 책등은 좁아서 본 제목만 보여주는 게 자연.
// "(" / "（"(전각) / "[" 모두 처리.
function stripParenthesis(text: string): string {
  return text.split(/[(（[]/)[0].trim();
}

// 제목 폰트 크기 — 한 컬럼(=한 줄) 안에 들어가도록 산출.
// minFont 까지 줄여도 안 들어가면 호출자가 미리 자르므로 여기서는 단순히 fit 만.
function pickTitleFont(
  text: string,
  availableInline: number,
  maxFont: number,
  minFont = 9,
): number {
  if (text.length === 0) return maxFont;
  const unitAdvance = estimateInline(text, 1); // fontSize=1 일 때 inline 길이
  if (unitAdvance === 0) return maxFont;
  const fitted = (availableInline / unitAdvance) * FIT_SAFETY;
  return Math.max(minFont, Math.min(maxFont, fitted));
}

// 한 컬럼(=한 줄)에 들어갈 만큼만 남기고 나머지는 "…" 로 잘라낸다.
// minFont 기준으로 fit 검사 — minFont 까지 줄여도 안 들어가면 잘라야 함.
function clipTitleForSpine(
  text: string,
  availableInline: number,
  minFont = 9,
): string {
  if (estimateInline(text, minFont) <= availableInline) return text;
  const chars = Array.from(text);
  const ellipsisAdvance = LATIN_FACTOR * minFont; // "…" 는 Latin 1글자 폭 정도
  const target = availableInline - ellipsisAdvance;
  let acc = 0;
  let cut = 0;
  for (let i = 0; i < chars.length; i++) {
    const w = charFactor(chars[i]) * minFont;
    if (acc + w > target) break;
    acc += w;
    cut = i + 1;
  }
  return chars.slice(0, Math.max(1, cut)).join("") + "…";
}

export default function BookSpine({
  title,
  author,
  onClick,
  rating,
  seed,
  listed,
}: Props) {
  const spec = specFromSeed(seed || `${title}|${author ?? ""}`);
  const { color, accent, width, font, theme } = spec;
  const fontFamily = font === "serif" ? SERIF : SANS;

  // 모든 테마 배경은 단색(`color.bg`).
  // 이전엔 vintage 만 세로 그라디언트(tint→bg→bg→tint) 였는데, 다른 책들은 background-color 로 채워지고
  // vintage 만 background-image 로 채워져서 톤이 다르게 보임("이 책만 처리가 다르다"는 사용자 보고).
  // 가로 그라디언트는 이미 좌우 색 분리 환상 때문에 제거했고, 세로도 같은 이유로 제거 — 일관성 우선.
  // 테마 구분은 장식 줄(hardcover/vintage), 가로 액센트 띠(metallic), 폰트(serif vs sans) 로 표현.
  const backgroundCss = color.bg;

  // 위/아래 여백 — 하드커버·빈티지는 장식 줄(top:8/12, bottom:8/12)을 넣되 본문 영역은 살짝만 양보
  const decoTop = theme === "hardcover" || theme === "vintage" ? 14 : 8;
  // 매물 등록 띠지(obi) — 본문 위에 14px 가로 띠, 빨간색 + 흰 글자로 외부에서도 한눈에
  const SASH_H = 14;
  const sashSpace = listed ? SASH_H : 0;
  const padTop = decoTop + sashSpace;
  // 저자 영역 (있을 때만) — 가로 텍스트, 하단 고정 ~20px
  const authorBoxH = author ? 20 : 0;
  const padBot =
    (theme === "hardcover" || theme === "vintage" ? 14 : 8) + authorBoxH;

  // 제목 가용 inline(세로) 길이 — 한 컬럼에 다 표시. 괄호 이후는 떼고, 그래도 길면 "…"
  const availableInline = SPINE_HEIGHT - padTop - padBot;
  const maxFont = theme === "paperback" ? 14 : 13.5;
  const cleanedTitle = stripParenthesis(title);
  const clippedTitle = clipTitleForSpine(cleanedTitle, availableInline, 9);
  const titleFont = pickTitleFont(clippedTitle, availableInline, maxFont, 9);

  return (
    <Box
      onClick={onClick}
      sx={{
        flexShrink: 0,
        width,
        height: SPINE_HEIGHT,
        borderRadius: `${radius.xs}px`,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        boxShadow: shadow.card,
        transition:
          "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease",
        "&:hover": {
          transform: "translateY(-4px) rotate(-1deg)",
          boxShadow: shadow.cardHover,
        },
        background: backgroundCss,
      }}
    >
      {/* 좌우 가장자리 미세 음영 — 책등 입체감 (롤백: 사용자 요청으로 이전처럼 복구). */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.10) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* 하드커버·빈티지 — 위/아래 장식 줄 (금박 느낌) */}
      {(theme === "hardcover" || theme === "vintage") && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: 5,
              left: 5,
              right: 5,
              height: 1,
              background: accent,
              opacity: 0.85,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 9,
              left: 5,
              right: 5,
              height: 1,
              background: accent,
              opacity: 0.55,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 5 + authorBoxH,
              left: 5,
              right: 5,
              height: 1,
              background: accent,
              opacity: 0.55,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 9 + authorBoxH,
              left: 5,
              right: 5,
              height: 1,
              background: accent,
              opacity: 0.85,
            }}
          />
        </>
      )}

      {/* 메탈릭 — 가운데 가로 액센트 띠 */}
      {theme === "metallic" && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 4,
            transform: "translateY(-50%)",
            background: `linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`,
            opacity: 0.75,
          }}
        />
      )}

      {/* 제목 — vertical-rl, 한 컬럼(한 줄) 만. 길면 호출자가 잘라서 "…" 처리. */}
      <Box
        sx={{
          position: "absolute",
          top: padTop,
          bottom: padBot,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            writingMode: "vertical-rl",
            fontFamily,
            fontSize: titleFont,
            fontWeight: 800,
            color: color.ink,
            letterSpacing: "0.04em",
            lineHeight: 1.0,
            whiteSpace: "nowrap",
          }}
        >
          {clippedTitle}
        </Box>
      </Box>

      {/* 저자 — 하단 가로 1줄, 작게. 길면 ellipsis */}
      {author && (
        <Box
          sx={{
            position: "absolute",
            left: 2,
            right: 2,
            bottom: 3,
            height: authorBoxH - 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // 본문 영역과 분리되도록 위에 가는 라인
            borderTop: `1px solid ${accent}40`,
            pt: "2px",
          }}
        >
          <Box
            sx={{
              fontFamily,
              fontSize: 8.5,
              fontWeight: 600,
              color: color.ink,
              opacity: 0.75,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              textAlign: "center",
            }}
          >
            {author}
          </Box>
        </Box>
      )}

      {/* 별점 뱃지 (있을 때만) — listed 면 띠지 아래로 내림 */}
      {rating !== undefined && (
        <Box
          sx={{
            position: "absolute",
            top: listed ? decoTop + SASH_H + 2 : 4,
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

      {/* 매물 등록 띠지(obi) — 본문 위에 가로로 두름. 외부에서도 한눈에 알아볼 수 있게 */}
      {listed && (
        <Box
          sx={{
            position: "absolute",
            top: decoTop,
            left: 0,
            right: 0,
            height: SASH_H,
            background: `linear-gradient(180deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
            color: "#fff",
            fontSize: 8.5,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "-0.02em",
            // 위·아래 가는 음영으로 띠 입체감
            boxShadow:
              "0 -1px 0 rgba(0,0,0,0.18) inset, 0 1px 0 rgba(255,255,255,0.18) inset",
          }}
        >
          판매중
        </Box>
      )}
    </Box>
  );
}
