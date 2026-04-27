"use client";

// 검색 화면에서 띄우는 필터 BottomSheet
// 도서 상태 / 가격 / 카테고리 / 거래 방식 / 지역을 한 번에 설정할 수 있다
// 적용 시 onApply 로 결과를 부모에 넘겨주고 시트를 닫는 구조

import {
  Box,
  Button,
  Chip,
  OutlinedInput,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import { palette } from "@/lib/theme";

// DB enum(key) ↔ 사용자에게 보여줄 라벨(label)
const STATES = [
  { key: "A_PLUS", label: "최상" },
  { key: "A", label: "상" },
  { key: "B", label: "중" },
  { key: "C", label: "하" },
];

const CATEGORIES = [
  "소설",
  "에세이",
  "자기계발",
  "경제/경영",
  "역사",
  "과학",
  "아동",
  "만화",
];

const TRADE_METHODS = [
  { key: "DIRECT", label: "직거래" },
  { key: "PARCEL", label: "택배" },
  { key: "BOTH", label: "둘 다" },
];

// 필터에서 다루는 모든 옵션을 한 객체로 묶음
export interface FilterValue {
  states: string[]; // 다중선택: 상태 등급 키 배열
  category?: string;
  trade?: string;
  priceRange: [number, number]; // [min, max]
  region?: string;
  freeOnly?: boolean;
}

// "초기화" 버튼이 누르면 돌아갈 기본값
const DEFAULT: FilterValue = {
  states: [],
  category: undefined,
  trade: "BOTH",
  priceRange: [0, 50000],
  region: "",
  freeOnly: false,
};

export default function FilterSheet({
  open,
  onClose,
  initial,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  initial?: FilterValue;
  onApply: (v: FilterValue) => void;
}) {
  // 부모가 initial 을 안 주면 기본값에서 시작
  const [v, setV] = useState<FilterValue>(initial ?? DEFAULT);
  // 일부 필드만 patch 형태로 갱신 — setV({ ...v, key: val }) 보다 호출이 짧아짐
  const update = (patch: Partial<FilterValue>) => setV({ ...v, ...patch });

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="필터"
      footer={
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            sx={{ flex: 1 }}
            onClick={() => setV(DEFAULT)}
          >
            초기화
          </Button>
          <Button
            sx={{ flex: 2 }}
            onClick={() => {
              onApply(v);
              onClose();
            }}
          >
            결과 보기
          </Button>
        </Stack>
      }
    >
      <Section title="도서 상태">
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {STATES.map((s) => {
            const on = v.states.includes(s.key);
            return (
              <Chip
                key={s.key}
                label={s.label}
                // 다중선택 토글: 이미 있으면 빼고, 없으면 추가
                onClick={() =>
                  update({
                    states: on
                      ? v.states.filter((k) => k !== s.key)
                      : [...v.states, s.key],
                  })
                }
                sx={{
                  fontSize: 13,
                  height: 36,
                  px: 1.25,
                  ...(on && { background: palette.primary, color: "#fff" }),
                }}
                variant={on ? "filled" : "outlined"}
              />
            );
          })}
        </Box>
      </Section>

      <Section title="가격 범위" right={
        <Typography sx={{ fontSize: 12, color: palette.inkMute }}>
          {v.priceRange[0].toLocaleString()}원 ~ {v.priceRange[1].toLocaleString()}원
        </Typography>
      }>
        <Box sx={{ px: 1.25 }}>
          <Slider
            value={v.priceRange}
            min={0}
            max={50000}
            step={500}
            onChange={(_, val) =>
              update({ priceRange: val as [number, number] })
            }
            sx={{
              color: palette.primary,
              "& .MuiSlider-thumb": { background: "#fff", border: `2px solid ${palette.primary}` },
            }}
          />
        </Box>
        <Stack direction="row" gap={1}>
          <Chip
            label="무료나눔만 보기"
            variant={v.freeOnly ? "filled" : "outlined"}
            onClick={() => update({ freeOnly: !v.freeOnly })}
            sx={{
              ...(v.freeOnly && { background: palette.accent, color: "#fff" }),
            }}
          />
        </Stack>
      </Section>

      <Section title="카테고리">
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <Chip
            label="전체"
            onClick={() => update({ category: undefined })}
            variant={!v.category ? "filled" : "outlined"}
            sx={{ ...(!v.category && { background: palette.primary, color: "#fff" }) }}
          />
          {CATEGORIES.map((c) => {
            const on = v.category === c;
            return (
              <Chip
                key={c}
                label={c}
                onClick={() => update({ category: c })}
                variant={on ? "filled" : "outlined"}
                sx={{ ...(on && { background: palette.primary, color: "#fff" }) }}
              />
            );
          })}
        </Box>
      </Section>

      <Section title="거래 방식">
        <Stack direction="row" gap={1}>
          {TRADE_METHODS.map((t) => {
            const on = v.trade === t.key;
            return (
              <Chip
                key={t.key}
                label={t.label}
                onClick={() => update({ trade: t.key })}
                variant={on ? "filled" : "outlined"}
                sx={{
                  flex: 1,
                  height: 38,
                  ...(on && { background: palette.primary, color: "#fff" }),
                }}
              />
            );
          })}
        </Stack>
      </Section>

      <Section title="지역">
        <OutlinedInput
          fullWidth
          placeholder="동/구 입력 (예: 마포구)"
          value={v.region}
          onChange={(e) => update({ region: e.target.value })}
        />
      </Section>
    </BottomSheet>
  );
}

// 필터 시트 내부에서만 쓰는 작은 섹션 래퍼 (제목 + 옵션 우측 보조 텍스트 + 본문)
function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ py: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.25}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{title}</Typography>
        {right}
      </Stack>
      {children}
    </Box>
  );
}
