"use client";

// 임시 프리뷰 페이지 — BookSpine 가시성 QA 용. 작업 끝나면 삭제.
// 실제 /mypage/shelf 의 wooden shelf 카드 레이아웃과 동일하게 감싸 둠.

import { Box, Stack, Typography } from "@mui/material";
import BookSpine from "@/components/ui/BookSpine";
import { palette, radius, shadow } from "@/lib/theme";

const SAMPLES_SHORT: { id: string; title: string; author?: string; rating?: number; listed?: boolean }[] = [
  { id: "s1", title: "어린왕자", author: "생텍쥐페리" },
  { id: "s2", title: "사피엔스", author: "유발 하라리" },
  { id: "s3", title: "데미안", author: "헤르만 헤세" },
  { id: "s4", title: "1984", author: "조지 오웰" },
];

const SAMPLES_LISTED: { id: string; title: string; author?: string; rating?: number; listed?: boolean }[] = [
  { id: "ls1", title: "어린왕자", author: "생텍쥐페리", listed: true },
  { id: "ls2", title: "데미안", author: "헤르만 헤세", listed: true, rating: 4 },
  { id: "ls3", title: "스물다섯 스물하나", author: "정해인", listed: true },
  { id: "ls4", title: "데이터 중심 애플리케이션 설계", author: "마틴 클레프만", listed: true },
];

const SAMPLES_MED: { id: string; title: string; author?: string; rating?: number }[] = [
  { id: "m1", title: "나미야 잡화점의 기적", author: "히가시노 게이고" },
  { id: "m2", title: "불편한 편의점", author: "김호연", rating: 4.5 },
  { id: "m3", title: "스물다섯 스물하나", author: "정해인" },
  { id: "m4", title: "공정하다는 착각", author: "마이클 샌델" },
  { id: "m5", title: "클린 코드", author: "로버트 마틴" },
];

const SAMPLES_LONG: { id: string; title: string; author?: string; rating?: number }[] = [
  { id: "l1", title: "데이터 중심 애플리케이션 설계", author: "마틴 클레프만" },
  { id: "l2", title: "객체지향의 사실과 오해", author: "조영호" },
  { id: "l3", title: "프로젝트 매니지먼트의 기본", author: "PMI" },
  { id: "l4", title: "리액트(React)로 만드는 우아한 형제들의 배달의민족 개발 사례로 살펴보는", author: "우아한형제들" },
];

function Shelf({ title, items }: { title: string; items: typeof SAMPLES_SHORT }) {
  return (
    <Box sx={{ pb: 3 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.25, px: 0.5 }}>
        {title}
      </Typography>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
          backgroundImage: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%), repeating-linear-gradient(90deg, transparent 0 8px, rgba(140,115,80,0.04) 8px 9px)`,
          backgroundBlendMode: "normal, multiply",
          border: `1px solid ${palette.lineSoft}`,
          borderRadius: `${radius.lg}px`,
          p: 1.5,
          boxShadow: shadow.card,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          gap={0.75}
          sx={{
            overflowX: "auto",
            alignItems: "flex-end",
            pb: 0.75,
            minHeight: 156,
          }}
          className="no-scrollbar"
        >
          {items.map((s) => (
            <BookSpine
              key={s.id}
              seed={s.id}
              title={s.title}
              author={s.author}
              rating={s.rating}
              listed={s.listed}
            />
          ))}
        </Stack>
        <Box
          sx={{
            mt: 0.75,
            position: "relative",
            height: 8,
            borderRadius: 999,
            background:
              "linear-gradient(180deg, #C4A879 0%, #A8895C 45%, #7A6342 100%)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.35) inset, 0 2px 4px rgba(122,99,66,0.25)",
          }}
        />
      </Box>
    </Box>
  );
}

export default function SpinePreviewPage() {
  return (
    <Box sx={{ minHeight: "100vh", background: palette.bg, p: 2, maxWidth: 420, mx: "auto" }}>
      <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 2 }}>
        BookSpine 프리뷰 — 가시성 QA
      </Typography>
      <Shelf title="짧은 제목" items={SAMPLES_SHORT} />
      <Shelf title="보통 제목" items={SAMPLES_MED} />
      <Shelf title="긴 제목 (잘림 확인)" items={SAMPLES_LONG} />
      <Shelf title="매물 등록 띠지" items={SAMPLES_LISTED} />
    </Box>
  );
}
