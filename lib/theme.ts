"use client";

// MUI(Material UI) 디자인 시스템 테마 정의 파일
// - 색상/모서리/그림자 토큰을 한 곳에 모아두고 앱 전체에서 재사용
// - createTheme 으로 만든 테마는 app/providers.tsx 의 ThemeProvider 에 전달됨

import { createTheme, alpha } from "@mui/material/styles";

// 앱 전역 색상 팔레트 ("도서관 그린" 톤)
// 색상 변경이 필요할 때는 이 객체만 바꾸면 전체에 반영된다
export const palette = {
  primary: "#1F6F4E",
  primaryDark: "#155A3E",
  primarySoft: "#E8F2EC",
  ink: "#1A2B22",
  inkMute: "#5A6B62",
  inkSubtle: "#8A968F",
  line: "#E8E4DC",
  lineSoft: "#F2EFE8",
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  accent: "#FF6B5E",
  warn: "#E0A526",
  kakao: "#FEE500",
  kakaoText: "#3C1E1E",
  gray1: "#F2EFE8",
  gray2: "#E8E4DC",
  gray3: "#A8B0AB",
  gray4: "#5A6B62",
  border: "#E8E4DC",
};

// 모서리 둥글기(radius) 토큰 — 버튼/카드/Chip 등에서 일관된 라운드값 사용
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999, // 알약(pill) 모양: 양 끝이 완전히 둥근 형태
};

// 그림자(shadow) 토큰 — 카드/스티키 영역/팝업 등 깊이 표현에 사용
export const shadow = {
  card: "0 1px 2px rgba(26, 43, 34, 0.04), 0 4px 16px rgba(26, 43, 34, 0.04)",
  sticky: "0 -4px 16px rgba(26, 43, 34, 0.06)", // 화면 하단 고정 영역(예: 결제 버튼 바)에 위로 떠 보이도록
  raised: "0 8px 24px rgba(26, 43, 34, 0.12)",
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
    body1: { fontSize: 14, lineHeight: 1.5 },
    body2: { fontSize: 12, lineHeight: 1.5, color: palette.inkMute },
    caption: { fontSize: 11, color: palette.inkSubtle },
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
        },
        sizeSmall: { minHeight: 36, padding: "8px 14px", fontSize: 13 },
        contained: {
          background: palette.primary,
          color: "#fff",
          "&:hover": { background: palette.primaryDark },
        },
        outlined: {
          borderColor: palette.line,
          color: palette.ink,
          background: palette.surface,
          "&:hover": {
            borderColor: palette.primary,
            background: palette.primarySoft,
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
            borderColor: palette.inkMute,
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
        track: { background: palette.lineSoft, opacity: 1 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: palette.ink },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
    },
  },
});

export default theme;
