"use client";

// 도서 상태 상세 체크리스트 BottomSheet
// - 등록 폼(/register) 의 "상세 체크" 버튼에서 호출
// - 카테고리(표지/책등/모서리/본문/부속) 별 체크박스 + 자동 추정 등급 미리보기
// - "적용" 버튼: 부모에게 (detail, suggestedGrade) 콜백 — 부모가 BookState 와 detail 둘 다 갱신
// - 닫을 때 변경 안 된 상태로 빠지면 onApply 호출 X (취소와 동일 동작)

import { Box, Button, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import { palette, radius } from "@/lib/theme";
import {
  CONDITION_CATEGORIES,
  emptyConditionDetail,
  hasAnyChecked,
  inferGrade,
  type GradeKor,
} from "@/lib/conditionGrade";
import type { ConditionDetail } from "@/lib/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  // 시트 진입 시 기본 체크 상태 (이미 한 번 작성한 적이 있으면 그대로 복원)
  initial?: ConditionDetail;
  // 적용 — 사용자가 결정한 detail + 추정 등급 둘 다 부모에게
  onApply: (detail: ConditionDetail, suggestedGrade: GradeKor) => void;
}

export default function ConditionDetailSheet({
  open,
  onClose,
  initial,
  onApply,
}: Props) {
  // open 이 true 로 열릴 때마다 initial 로 폼 리셋 — 닫고 다시 열면 마지막 저장본 기준
  const [draft, setDraft] = useState<ConditionDetail>(emptyConditionDetail);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? deepClone(initial) : emptyConditionDetail());
  }, [open, initial]);

  const grade = useMemo(() => inferGrade(draft), [draft]);
  const hasAny = hasAnyChecked(draft);

  // 카테고리 + 항목 토글
  const toggle = (cat: string, item: string) => {
    setDraft((prev) => {
      const next = deepClone(prev) as Record<string, Record<string, boolean>>;
      if (!next[cat]) next[cat] = {};
      next[cat][item] = !next[cat][item];
      return next as ConditionDetail;
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="상태 상세 체크"
      footer={
        <Stack direction="row" gap={1} alignItems="center">
          {/* 추정 등급 칩 — footer 좌측에 항상 보이게 */}
          <Box
            sx={{
              flexShrink: 0,
              px: 1.25,
              py: 0.6,
              borderRadius: 999,
              background: hasAny ? palette.warnSoft : palette.primarySoft,
              color: hasAny ? palette.warn : palette.primary,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            추정 {grade}
          </Box>
          <Button
            fullWidth
            onClick={() => {
              onApply(draft, grade);
              onClose();
            }}
          >
            상태 적용 ({grade})
          </Button>
        </Stack>
      }
    >
      <Stack gap={2} sx={{ pt: 0.5, pb: 1 }}>
        <Typography sx={{ fontSize: 12.5, color: palette.inkMute, lineHeight: 1.55 }}>
          해당하는 항목을 체크하면 등급이 자동 추천돼요. 분쟁 시 객관적 근거로 활용돼요.
        </Typography>

        {CONDITION_CATEGORIES.map((cat) => (
          <Box key={cat.key}>
            <Stack
              direction="row"
              alignItems="baseline"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: palette.inkSubtle,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {cat.title}
              </Typography>
              {cat.description && (
                <Typography sx={{ fontSize: 11, color: palette.inkSubtle }}>
                  {cat.description}
                </Typography>
              )}
            </Stack>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
              }}
            >
              {cat.items.map((it) => {
                const checked = !!(
                  draft as Record<string, Record<string, boolean | undefined> | undefined>
                )[cat.key]?.[it.key];
                return (
                  <Box
                    key={it.key}
                    onClick={() => toggle(cat.key, it.key)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.25,
                      py: 0.85,
                      borderRadius: `${radius.sm}px`,
                      border: `1.5px solid ${
                        checked ? palette.primary : palette.lineSoft
                      }`,
                      background: checked ? palette.primaryTint : palette.surface,
                      color: checked ? palette.primary : palette.ink,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      cursor: "pointer",
                      transition: "all 140ms ease",
                      boxShadow: checked
                        ? `0 0 0 4px ${palette.primaryGlow}`
                        : "none",
                      "&:active": { transform: "scale(0.97)" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: 1,
                        border: `1.5px solid ${
                          checked ? palette.primary : palette.line
                        }`,
                        background: checked ? palette.primary : palette.surface,
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                      }}
                    >
                      {checked && <CheckRoundedIcon sx={{ fontSize: 14 }} />}
                    </Box>
                    {it.label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Stack>
    </BottomSheet>
  );
}

// jsonb 트리 얕은 복제만으로는 부족 — 카테고리 객체도 같이 복제
function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}
