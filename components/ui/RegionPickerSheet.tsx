"use client";

// 동네(지역) 선택 BottomSheet
// - 홈 헤더 LocationChip 클릭 시 노출
// - 상단에 "현재 위치로 설정" 버튼 — Geolocation API + 자치구 매핑(lib/geo)
// - 25개 서울 자치구 + 검색 입력 → 클릭 즉시 regionStore 업데이트 후 닫힘
// - 선택된 동네는 강조 표시(체크 + sage 톤). 다른 화면(홈 섹션 헤더 등) 에서도 같은 store 구독

import {
  Box,
  CircularProgress,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import { useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import { palette, radius } from "@/lib/theme";
import { SEOUL_DISTRICTS, useRegionStore } from "@/lib/store/regionStore";
import { locateUserRegion } from "@/lib/geo";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 외부 컨트롤된 현재 값(예: /register 폼) — 없으면 store 의 region 사용 */
  value?: string;
  /** 선택 시 호출. 지정하면 store 갱신 대신 이걸 호출 (개별 폼 전용 선택) */
  onPick?: (next: string) => void;
}

export default function RegionPickerSheet({
  open,
  onClose,
  value,
  onPick,
}: Props) {
  const region = useRegionStore((s) => (value !== undefined ? value : s.region));
  const setRegion = useRegionStore((s) => s.setRegion);
  const setRegionAuto = useRegionStore((s) => s.setRegionAuto);
  const [q, setQ] = useState("");
  const [locating, setLocating] = useState(false);
  const toast = useToast();

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return SEOUL_DISTRICTS;
    return SEOUL_DISTRICTS.filter((d) => d.includes(term));
  }, [q]);

  const handlePick = (next: string) => {
    if (onPick) onPick(next);
    else setRegion(next);
    setQ("");
    onClose();
  };

  const handleLocate = async () => {
    if (locating) return;
    setLocating(true);
    const result = await locateUserRegion();
    setLocating(false);
    switch (result.kind) {
      case "ok":
        // onPick 가 있으면 호출자(예: /mypage/settings)가 저장 결과에 맞게 직접 토스트를 띄운다.
        // 시트가 미리 "설정했어요" 를 띄우면 백엔드 저장 실패 시 "성공/실패" 토스트가 동시에 보이는 모순이 생김.
        if (onPick) {
          onPick(result.region);
        } else {
          setRegionAuto(result.region);
          toast?.show(`현재 위치로 ${result.region}을(를) 설정했어요`);
        }
        setQ("");
        onClose();
        break;
      case "out_of_range":
        toast?.show(
          `서울 외 지역으로 보여요. 가까운 ${result.nearest}로 설정하거나 직접 선택해주세요`,
        );
        break;
      case "denied":
        toast?.show("위치 권한이 거부됐어요. 직접 선택해주세요");
        break;
      case "timeout":
        toast?.show("위치를 가져오는 데 시간이 너무 걸려요. 잠시 후 다시 시도해주세요");
        break;
      case "unsupported":
        toast?.show("이 브라우저는 위치 기능을 지원하지 않아요");
        break;
      case "unavailable":
      default:
        toast?.show("위치를 가져오지 못했어요");
        break;
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="동네 선택" height={560}>
      <Stack gap={1.5} sx={{ pt: 0.5, pb: 0.5 }}>
        <Typography sx={{ fontSize: 12.5, color: palette.inkMute, lineHeight: 1.55 }}>
          내 동네를 선택하면 홈 피드와 라벨이 함께 바뀌어요.
        </Typography>

        {/* 현재 위치로 설정 — Geolocation API + 좌표→자치구 매핑 */}
        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          onClick={locating ? undefined : handleLocate}
          sx={{
            py: 1.25,
            px: 1.25,
            borderRadius: `${radius.md}px`,
            background: palette.primaryTint,
            border: `1px solid ${palette.primarySoft}`,
            cursor: locating ? "default" : "pointer",
            opacity: locating ? 0.7 : 1,
            transition: "background 140ms ease",
            "&:hover": { background: locating ? palette.primaryTint : palette.primarySoft },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: palette.primary,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {locating ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              <MyLocationRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 800,
                color: palette.primary,
                letterSpacing: "-0.01em",
              }}
            >
              현재 위치로 설정
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: palette.inkMute, mt: 0.25 }}>
              {locating
                ? "위치를 확인하는 중…"
                : "GPS 로 가까운 자치구를 찾아 자동 설정해요"}
            </Typography>
          </Box>
        </Stack>

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
