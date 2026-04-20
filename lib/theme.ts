"use client";

import { createTheme, alpha } from "@mui/material/styles";

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

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const shadow = {
  card: "0 1px 2px rgba(26, 43, 34, 0.04), 0 4px 16px rgba(26, 43, 34, 0.04)",
  sticky: "0 -4px 16px rgba(26, 43, 34, 0.06)",
  raised: "0 8px 24px rgba(26, 43, 34, 0.12)",
};

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
