"use client";

// 공용 검색 입력 — 홈/채팅/통합검색이 같은 룩 & 사이즈를 공유하도록 추출.
// - 높이 44, pill 모양, 좌측 search 아이콘, 우측 endAdornment 슬롯
// - readOnly 모드: onClick 만 받으면 검색 페이지로 이동시키는 패턴(홈)
// - 입력 모드: value/onChange/onSubmit 으로 한글 IME Enter 가드 포함

import { InputAdornment, OutlinedInput, type OutlinedInputProps } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { palette } from "@/lib/theme";

interface Props extends Omit<OutlinedInputProps, "onSubmit"> {
  /** Enter 키 입력 시 호출 (한글 IME 조합 중에는 무시) */
  onSubmit?: (value: string) => void;
}

export default function SearchPill({
  onSubmit,
  startAdornment,
  endAdornment,
  sx,
  inputProps,
  onKeyDown,
  ...rest
}: Props) {
  return (
    <OutlinedInput
      fullWidth
      startAdornment={
        startAdornment ?? (
          <InputAdornment position="start" sx={{ mr: 1 }}>
            <SearchRoundedIcon sx={{ color: palette.inkSubtle, fontSize: 20 }} />
          </InputAdornment>
        )
      }
      endAdornment={endAdornment}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key !== "Enter") return;
        // 한글 IME 조합 중 Enter 는 글자 확정용. submit 발사 금지.
        if (e.nativeEvent.isComposing) return;
        if (onSubmit) {
          e.preventDefault();
          onSubmit((e.currentTarget as HTMLInputElement).value);
        }
      }}
      inputProps={{
        ...(inputProps ?? {}),
      }}
      sx={{
        height: 44,
        background: palette.lineSoft,
        borderRadius: 999,
        pl: 1.5,
        pr: 0.75,
        "& fieldset": { border: "none" },
        "& input": {
          py: 0,
          fontSize: 14,
          letterSpacing: "-0.01em",
        },
        transition: "background 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          background: palette.surfaceAlt,
          boxShadow: `0 0 0 1px ${palette.line}`,
        },
        "&.Mui-focused": {
          background: palette.surface,
          boxShadow: `0 0 0 1px ${palette.line}, 0 0 0 5px ${palette.primaryGlow}`,
        },
        ...(sx ?? {}),
      }}
      {...rest}
    />
  );
}
