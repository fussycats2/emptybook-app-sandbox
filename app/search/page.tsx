"use client";

// 검색 페이지 (/search) — 두 가지 모드를 한 화면에서 처리
//   1) 검색 입력/필터가 비어있을 때: 최근 검색어 + 인기 검색어 + 카테고리 추천
//   2) 입력이나 필터가 있을 때: 결과 리스트 + 정렬 칩
// useSearchParams 사용 → Suspense 경계 필요 → 외부에서 한 번 감쌈

import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { BookListRow, type BookSummary } from "@/components/ui/BookCard";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { palette } from "@/lib/theme";
import { searchBooks, meta } from "@/lib/repo";
import FilterSheet, { type FilterValue } from "@/components/search/FilterSheet";

const { POPULAR_SEARCHES, RECENT_SEARCHES, CATEGORIES } = meta;

// 결과 정렬 옵션 — 칩 형태로 노출하고 sort state 와 연동
const SORTS = [
  { key: "recent", label: "최신순" },
  { key: "low", label: "가격↓" },
  { key: "high", label: "가격↑" },
  { key: "popular", label: "인기순" },
];

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialCategory = params.get("category") ?? undefined;
  const openFilterFlag = params.get("openFilter") === "1";

  const [q, setQ] = useState(initialQ);
  const [filterOpen, setFilterOpen] = useState(openFilterFlag);
  const [filter, setFilter] = useState<FilterValue>({
    states: [],
    category: initialCategory,
    trade: "BOTH",
    priceRange: [0, 50000],
    freeOnly: false,
    region: "",
  });
  const [sort, setSort] = useState("recent");
  const [results, setResults] = useState<BookSummary[] | null>(null);
  const [recent, setRecent] = useState<string[]>(RECENT_SEARCHES);

  // 결과 모드 진입 조건: 검색어가 있거나, 카테고리/상태/무료나눔 필터가 활성화된 경우
  const isResultMode =
    q.trim().length > 0 ||
    !!filter.category ||
    filter.states.length > 0 ||
    !!filter.freeOnly;

  // 검색어/카테고리 바뀔 때마다 서버에 다시 질의
  // 결과 모드가 아니면 빈 배열로 두고, 결과 모드 진입 시 null(=로딩) 상태로 만든 후 호출
  useEffect(() => {
    if (!isResultMode) {
      setResults([]);
      return;
    }
    setResults(null);
    searchBooks({ q, category: filter.category })
      .then((r) => setResults(r))
      .catch(() => setResults([]));
  }, [q, filter.category, isResultMode]);

  // 서버 응답을 받아 클라이언트에서 추가 필터(가격/상태/무료) 적용
  // 서버는 키워드/카테고리만 처리하고, 나머지는 클라이언트에서 가벼운 후처리로 끝낸다
  const filtered = useMemo(() => {
    if (!results) return null;
    return results.filter((b) => {
      if (filter.freeOnly && !b.free) return false;
      if (filter.states.length > 0) {
        // 서버/UI 가 어떤 표기를 줘도 받을 수 있게 다양한 라벨을 enum 으로 매핑
        const label = b.state;
        const mapped =
          label === "A+급"
            ? "A_PLUS"
            : label === "A급"
            ? "A"
            : label === "B급"
            ? "B"
            : label === "C급"
            ? "C"
            : label === "최상"
            ? "A_PLUS"
            : label === "상"
            ? "A"
            : label === "중"
            ? "B"
            : label === "하"
            ? "C"
            : "";
        if (!filter.states.includes(mapped)) return false;
      }
      const p = price(b);
      if (!b.free && (p < filter.priceRange[0] || p > filter.priceRange[1])) {
        return false;
      }
      return true;
    });
  }, [results, filter.freeOnly, filter.states, filter.priceRange]);

  // 정렬 — 원본 배열을 보존하기 위해 복사본([...filtered])을 만들어 sort
  const sorted = useMemo(() => {
    if (!filtered) return null;
    const arr = [...filtered];
    if (sort === "low") arr.sort((a, b) => price(a) - price(b));
    if (sort === "high") arr.sort((a, b) => price(b) - price(a));
    if (sort === "popular")
      arr.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    return arr;
  }, [filtered, sort]);

  // 검색 실행: 최근 검색어 맨 앞에 끼워 넣고, 동일어 중복 제거 후 8개로 유지
  const submit = (term: string) => {
    if (!term.trim()) return;
    setQ(term);
    setRecent((r) => [term, ...r.filter((x) => x !== term)].slice(0, 8));
  };

  const activeChips = [
    filter.category && {
      label: filter.category,
      onRemove: () => setFilter({ ...filter, category: undefined }),
    },
    filter.freeOnly && {
      label: "무료나눔",
      onRemove: () => setFilter({ ...filter, freeOnly: false }),
    },
    filter.states.length > 0 && {
      label: `상태 ${filter.states.length}`,
      onRemove: () => setFilter({ ...filter, states: [] }),
    },
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  return (
    <>
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ px: 1, py: 1.25 }} gap={1}>
          <IconButton onClick={() => router.back()}>
            <ArrowBackIosNewRoundedIcon fontSize="small" />
          </IconButton>
          <OutlinedInput
            fullWidth
            value={q}
            autoFocus
            placeholder="책 제목, 저자, 출판사"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter 는 무시 (글자 확정용 키)
              if (e.key === "Enter" && !e.nativeEvent.isComposing) submit(q);
            }}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: palette.inkSubtle, fontSize: 20 }} />
              </InputAdornment>
            }
            endAdornment={
              q && (
                <IconButton size="small" onClick={() => setQ("")}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              )
            }
            sx={{
              background: palette.lineSoft,
              borderRadius: 999,
              height: 40,
              "& fieldset": { border: "none" },
              "& input": { fontSize: 14, py: 0 },
            }}
          />
          <IconButton onClick={() => setFilterOpen(true)}>
            <TuneRoundedIcon />
          </IconButton>
        </Stack>
        {isResultMode && (
          <Stack
            direction="row"
            gap={0.75}
            className="no-scrollbar"
            sx={{
              overflowX: "auto",
              px: 2,
              pb: 1,
            }}
          >
            {activeChips.map((c) => (
              <Chip
                key={c.label}
                label={c.label}
                onDelete={c.onRemove}
                deleteIcon={<CloseRoundedIcon />}
                size="small"
                sx={{
                  background: palette.primarySoft,
                  color: palette.primary,
                  fontWeight: 700,
                  flexShrink: 0,
                  "& .MuiChip-deleteIcon": { color: palette.primary, fontSize: 16 },
                }}
              />
            ))}
            {SORTS.map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                onClick={() => setSort(s.key)}
                size="small"
                variant={sort === s.key ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  ...(sort === s.key && {
                    background: palette.ink,
                    color: "#fff",
                  }),
                }}
              />
            ))}
          </Stack>
        )}
      </Box>

      <ScrollBody>
        {!isResultMode && (
          <Stack gap={3} sx={{ p: 2.5 }}>
            <Section title="최근 검색어" icon={<HistoryRoundedIcon fontSize="small" />}>
              {recent.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: palette.inkSubtle }}>
                  최근 검색 기록이 없어요
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {recent.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      variant="outlined"
                      onClick={() => submit(t)}
                      onDelete={() =>
                        setRecent((r) => r.filter((x) => x !== t))
                      }
                      deleteIcon={<CloseRoundedIcon />}
                      sx={{
                        "& .MuiChip-deleteIcon": { fontSize: 14 },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Section>
            <Section title="실시간 인기" icon={<LocalFireDepartmentRoundedIcon sx={{ color: palette.accent }} />}>
              <Stack divider={<Box sx={{ height: 1, background: palette.lineSoft }} />}>
                {POPULAR_SEARCHES.map((t, i) => (
                  <Stack
                    key={t}
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                    sx={{
                      py: 1,
                      cursor: "pointer",
                      "&:hover": { background: palette.lineSoft },
                    }}
                    onClick={() => submit(t)}
                  >
                    <Typography
                      sx={{
                        width: 22,
                        fontWeight: 800,
                        color: i < 3 ? palette.accent : palette.inkMute,
                      }}
                    >
                      {i + 1}
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {t}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Section>
            <Section title="카테고리">
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.name}
                    label={`${c.emoji} ${c.name}`}
                    variant="outlined"
                    onClick={() =>
                      setFilter({ ...filter, category: c.name })
                    }
                  />
                ))}
              </Box>
            </Section>
          </Stack>
        )}

        {isResultMode && (
          <>
            {!sorted && <ListSkeleton count={5} />}
            {sorted && sorted.length === 0 && (
              <EmptyState
                icon={<SearchRoundedIcon />}
                title="검색 결과가 없어요"
                description="검색어를 다시 확인하거나 필터를 조정해보세요."
              />
            )}
            {sorted && sorted.length > 0 && (
              <Box sx={{ background: palette.surface }}>
                <Typography sx={{ px: 2, pt: 2, pb: 0.5, fontSize: 12, color: palette.inkMute }}>
                  검색결과 <strong style={{ color: palette.ink }}>{sorted.length}</strong>건
                </Typography>
                {sorted.map((b) => (
                  <BookListRow key={b.id} book={b} />
                ))}
              </Box>
            )}
          </>
        )}
      </ScrollBody>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        initial={filter}
        onApply={(v) => setFilter(v)}
      />

      <BottomTabNav />
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Stack direction="row" gap={0.75} alignItems="center" mb={1}>
        {icon}
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

// 표시용 가격 문자열("6,000원")에서 숫자만 뽑아 정렬용으로 변환
function price(b: BookSummary) {
  const num = parseInt(String(b.price).replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
