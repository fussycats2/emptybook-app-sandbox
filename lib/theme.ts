"use client";

// MUI(Material UI) 디자인 시스템 테마 정의 파일
// - 색상/모서리/그림자 토큰을 한 곳에 모아두고 앱 전체에서 재사용
// - createTheme 으로 만든 테마는 app/providers.tsx 의 ThemeProvider 에 전달됨

import { createTheme, alpha } from "@mui/material/styles";

// 앱 전역 색상 팔레트 — "도서관/매거진" 톤
// 색상을 바꾸고 싶을 때는 이 객체만 수정하면 거의 모든 화면에 반영된다.
//
// 디자인 의도:
// - primary  : 깊고 차분한 포레스트 그린 (책방, 신뢰)
// - bg       : 살짝 따뜻한 오프화이트 (오래된 종이 느낌)
// - accent   : 라이트 코랄/테라코타 (찜·무료나눔 같은 강조 포인트)
// - 중립색은 ink/inkMute/inkSubtle 3단계 + line/lineSoft 로 일관 사용
export const palette = {
  primary: "#2D5F4A",
  primaryDark: "#1E4434",
  primarySoft: "#E6EFEA",
  primaryTint: "#F1F6F3",
  ink: "#1A2620",
  inkMute: "#5C6B63",
  inkSubtle: "#94A099",
  line: "#E5E1D7",
  lineSoft: "#F1EDE4",
  bg: "#F7F4ED",
  surface: "#FFFFFF",
  surfaceAlt: "#FBF9F4",
  accent: "#D9695A",
  accentSoft: "#FBE8E2",
  warn: "#C58A2C",
  warnSoft: "#FBEFD6",
  kakao: "#FEE500",
  kakaoText: "#1A1A1A",
  // 호환용 alias — 기존 코드가 gray1~gray4 로 직접 접근하던 곳을 위해 유지
  gray1: "#F1EDE4",
  gray2: "#E5E1D7",
  gray3: "#94A099",
  gray4: "#5C6B63",
  border: "#E5E1D7",
};

// 모서리 둥글기(radius) 토큰 — 버튼/카드/Chip 등에서 일관된 라운드값 사용
export const radius = {
  xs: 4,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999, // 알약(pill) 모양: 양 끝이 완전히 둥근 형태
};

// 그림자(shadow) 토큰 — 카드/스티키 영역/팝업 등 깊이 표현에 사용
// 그린 톤(브랜드 색)을 살짝 섞어 흑백 그림자보다 따뜻하게 깔린다
export const shadow = {
  card: "0 1px 2px rgba(26, 38, 32, 0.04), 0 6px 20px rgba(26, 38, 32, 0.05)",
  sticky: "0 -6px 20px rgba(26, 38, 32, 0.06)",
  raised: "0 14px 36px rgba(26, 38, 32, 0.16)",
  pop: "0 8px 24px rgba(45, 95, 74, 0.22)",
};

// MUI 테마 객체 생성: 색상, 타이포그래피, 컴포넌트별 기본 스타일을 한 번에 정의
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: palette.primary,
      dark: palette.primaryDark,
      light: palette.primarySoft,
      contrastText: "#fff",
    },
    secondary: { main: palette.accent, contrastText: "#fff" },
    background: { default: palette.bg, paper: palette.surface },
    text: { primary: palette.ink, secondary: palette.inkMute },
    divider: palette.line,
    warning: { main: palette.warn },
  },
  typography: {
    // 폰트 우선순위: Pretendard → 시스템 한글 폰트 → sans-serif
    // 앞쪽 폰트가 없으면 다음 폰트로 자동 대체된다
    fontFamily:
      'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", "Nanum Gothic", system-ui, sans-serif',
    h1: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
    body1: { fontSize: 14, lineHeight: 1.55, letterSpacing: "-0.005em" },
    body2: { fontSize: 12.5, lineHeight: 1.55, color: palette.inkMute },
    caption: { fontSize: 11, color: palette.inkSubtle, letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 },
  },
  shape: { borderRadius: radius.sm },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.bg },
      },
    },
    // MUI 버튼 기본 스타일 커스터마이징
    // - disableElevation: 기본 그림자 제거(플랫 디자인)
    // - variant: 별도 지정 안 하면 contained(채워진) 버튼
    // - minHeight 44: 모바일 터치 영역(권장 최소 44px) 확보
    MuiButton: {
      defaultProps: { disableElevation: true, variant: "contained" },
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          padding: "12px 18px",
          fontSize: 14,
          minHeight: 44,
          transition:
            "background 140ms ease, border-color 140ms ease, transform 80ms ease",
          "&:active": { transform: "scale(0.985)" },
        },
        sizeSmall: { minHeight: 36, padding: "8px 14px", fontSize: 13 },
        contained: {
          background: palette.primary,
          color: "#fff",
          "&:hover": { background: palette.primaryDark },
          "&.Mui-disabled": {
            background: palette.lineSoft,
            color: palette.inkSubtle,
          },
        },
        outlined: {
          borderColor: palette.line,
          color: palette.ink,
          background: palette.surface,
          "&:hover": {
            borderColor: palette.primary,
            background: palette.primaryTint,
          },
        },
        text: {
          color: palette.inkMute,
          "&:hover": { background: alpha(palette.primary, 0.06) },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          background: palette.surface,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.line,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.inkSubtle,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.primary,
            borderWidth: 1.5,
          },
        },
        input: { padding: "12px 14px", fontSize: 14 },
      },
    },
    // Chip(태그/필터 버튼)을 알약 모양으로 통일
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          fontSize: 12.5,
          height: 30,
          fontWeight: 600,
        },
        outlined: {
          borderColor: palette.line,
          background: palette.surface,
          color: palette.inkMute,
        },
        filled: {
          background: palette.primary,
          color: "#fff",
        },
        clickable: {
          "&:active": { transform: "scale(0.97)" },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: palette.surface,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          border: `1px solid ${palette.line}`,
          backgroundColor: palette.surface,
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: palette.line } } },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        switchBase: {
          "&.Mui-checked": {
            color: "#fff",
            "& + .MuiSwitch-track": { background: palette.primary, opacity: 1 },
          },
        },
        track: { background: palette.line, opacity: 1 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: palette.ink,
          transition: "background 140ms ease, color 140ms ease",
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
    },
  },
});

export default theme;
