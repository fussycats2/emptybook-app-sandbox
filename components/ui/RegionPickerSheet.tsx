"use client";

// 동네(지역) 선택 BottomSheet
// - 홈 헤더 LocationChip 클릭 시 노출
// - 25개 서울 자치구 + 검색 입력 → 클릭 즉시 regionStore 업데이트 후 닫힘
// - 선택된 동네는 강조 표시(체크 + sage 톤). 다른 화면(홈 섹션 헤더 등) 에서도 같은 store 구독

import {
  Box,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import { palette, radius } from "@/lib/theme";
import { SEOUL_DISTRICTS, useRegionStore } from "@/lib/store/regionStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RegionPickerSheet({ open, onClose }: Props) {
  const region = useRegionStore((s) => s.region);
  const setRegion = useRegionStore((s) => s.setRegion);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return SEOUL_DISTRICTS;
    return SEOUL_DISTRICTS.filter((d) => d.includes(term));
  }, [q]);

  const handlePick = (next: string) => {
    setRegion(next);
    setQ("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="동네 선택" height={520}>
      <Stack gap={1.5} sx={{ pt: 0.5, pb: 0.5 }}>
        <Typography sx={{ fontSize: 12.5, color: palette.inkMute, lineHeight: 1.55 }}>
          내 동네를 선택하면 홈 피드와 라벨이 함께 바뀌어요.
        </Typography>

        <OutlinedInput
          fullWidth
          placeholder="동네 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: palette.inkSubtle }} />
            </InputAdornment>
          }
          sx={{
            background: palette.lineSoft,
            borderRadius: 999,
            "& fieldset": { border: "none" },
            "& input": { py: 1.2, fontSize: 13.5 },
          }}
        />

        <Box>
          {filtered.length === 0 && (
            <Typography
              sx={{
                py: 4,
                textAlign: "center",
                fontSize: 13,
                color: palette.inkSubtle,
              }}
            >
              검색 결과가 없어요
            </Typography>
          )}
          {filtered.map((d) => {
            const on = region === d;
            return (
              <Stack
                key={d}
                direction="row"
                alignItems="center"
                gap={1.25}
                onClick={() => handlePick(d)}
                sx={{
                  py: 1.25,
                  px: 1,
                  borderRadius: `${radius.sm}px`,
                  cursor: "pointer",
                  transition: "background 140ms ease",
                  "&:hover": { background: palette.surfaceAlt },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: on ? palette.primarySoft : palette.lineSoft,
                    color: on ? palette.primary : palette.inkSubtle,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <LocationOnRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: 14.5,
                    fontWeight: on ? 800 : 600,
                    color: on ? palette.primary : palette.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {d}
                </Typography>
                {on && (
                  <CheckRoundedIcon
                    sx={{ fontSize: 18, color: palette.primary, flexShrink: 0 }}
                  />
                )}
              </Stack>
            );
          })}
        </Box>
      </Stack>
    </BottomSheet>
  );
}
