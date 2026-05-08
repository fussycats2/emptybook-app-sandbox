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
import { Suspense, useMemo, useState } from "react";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { BookListRow, type BookSummary } from "@/components/ui/BookCard";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton, SkeletonBox } from "@/components/ui/Skeleton";
import { palette } from "@/lib/theme";
import { meta } from "@/lib/repo";
import { useSearchBooks } from "@/lib/query/bookHooks";
import { useAladinBestseller } from "@/lib/query/aladinHooks";
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
  const [recent, setRecent] = useState<string[]>(RECENT_SEARCHES);

  // 결과 모드 진입 조건: 검색어가 있거나, 카테고리/상태/무료나눔 필터가 활성화된 경우
  const isResultMode =
    q.trim().length > 0 ||
    !!filter.category ||
    filter.states.length > 0 ||
    !!filter.freeOnly;

  // React Query — q/category 조합별 캐시. enabled 로 결과 모드일 때만 호출
  const searchQuery = useSearchBooks(
    isResultMode ? { q, category: filter.category } : {}
  );
  const results = isResultMode ? searchQuery.data ?? null : [];
  const isLoadingResults = isResultMode && searchQuery.isLoading;

  // 알라딘 베스트셀러 — 결과 모드 아닐 때(=초기 검색 화면) "베스트셀러" 섹션에 노출.
  // 키 미설정 / 알라딘 응답 실패 시 unavailable=true → 기존 mock(POPULAR_SEARCHES) 폴백.
  const bestseller = useAladinBestseller(10);
  const hasRealBestseller =
    !!bestseller.data?.items && bestseller.data.items.length > 0;
  const popularItems = hasRealBestseller
    ? bestseller.data!.items!
    : POPULAR_SEARCHES.map((title) => ({ title, author: "", isbn: "", cover: "" }));
  // 데이터 출처/기준 시점 캡션 — 실데이터일 때만. 한국 출판계 컨벤션의 "N월 N주차" 표기
  const popularCaption = hasRealBestseller
    ? `알라딘 · ${formatBestsellerWeek(new Date())} 기준`
    : undefined;

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

  // 가격 범위가 디폴트(0~50000)에서 벗어났는지 — 빈 결과 안내·필터 초기화 판정에 사용
  const priceCustom =
    filter.priceRange[0] > 0 || filter.priceRange[1] < 50000;
  const hasActiveFilters =
    activeChips.length > 0 || priceCustom;
  const resetFilters = () =>
    setFilter({
      states: [],
      category: undefined,
      trade: "BOTH",
      priceRange: [0, 50000],
      freeOnly: false,
      region: "",
    });

  return (
    <>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`,
          backdropFilter: "saturate(160%) blur(8px)",
          WebkitBackdropFilter: "saturate(160%) blur(8px)",
          borderBottom: `1px solid ${palette.lineSoft}`,
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
              height: 42,
              "& fieldset": { border: "none" },
              "& input": { fontSize: 14, py: 0 },
              "&.Mui-focused": {
                background: palette.surface,
                boxShadow: `0 0 0 1px ${palette.line}, 0 0 0 5px ${palette.primaryGlow}`,
              },
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
              pb: 1.25,
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
                    "&:hover": { background: palette.ink },
                  }),
                }}
              />
            ))}
          </Stack>
        )}
      </Box>

      <ScrollBody>
        {!isResultMode && (
          <Stack gap={3.5} sx={{ p: 2.5 }}>
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
            <Section
              title="베스트셀러"
              icon={<LocalFireDepartmentRoundedIcon sx={{ color: palette.accent }} />}
              caption={popularCaption}
            >
              <Box
                sx={{
                  background: palette.surface,
                  borderRadius: 3,
                  border: `1px solid ${palette.lineSoft}`,
                  overflow: "hidden",
                }}
              >
                {bestseller.isLoading ? (
                  // 첫 진입 시 mock → 실데이터 swap 으로 깜빡이지 않도록 skeleton 행 노출
                  Array.from({ length: 6 }).map((_, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      alignItems="center"
                      gap={1.5}
                      sx={{
                        px: 1.75,
                        py: 1.1,
                        borderTop: i === 0 ? "none" : `1px solid ${palette.lineSoft}`,
                      }}
                    >
                      <SkeletonBox width={14} height={14} radius={4} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <SkeletonBox width={`${60 + ((i * 7) % 30)}%`} height={13} />
                        <SkeletonBox
                          width={`${30 + ((i * 11) % 25)}%`}
                          height={9}
                          sx={{ mt: 0.6 }}
                        />
                      </Box>
                    </Stack>
                  ))
                ) : (
                popularItems.map((item, i) => (
                  <Stack
                    key={`${item.title}-${i}`}
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                    sx={{
                      px: 1.75,
                      py: 1.1,
                      cursor: "pointer",
                      borderTop: i === 0 ? "none" : `1px solid ${palette.lineSoft}`,
                      transition: "background 140ms ease",
                      "&:hover": { background: palette.surfaceAlt },
                    }}
                    onClick={() => submit(item.title)}
                  >
                    <Typography
                      sx={{
                        width: 22,
                        fontSize: 14,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        color: i < 3 ? palette.accent : palette.inkSubtle,
                      }}
                    >
                      {i + 1}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </Typography>
                      {item.author && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: palette.inkSubtle,
                            mt: 0.25,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.author}
                        </Typography>
                      )}
                    </Box>
                    {i < 3 && (
                      <LocalFireDepartmentRoundedIcon
                        sx={{ fontSize: 14, color: palette.accent, opacity: 0.5 }}
                      />
                    )}
                  </Stack>
                ))
                )}
              </Box>
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
            {isLoadingResults && <ListSkeleton count={5} />}
            {sorted && sorted.length === 0 && (
              <EmptyState
                icon={<SearchRoundedIcon />}
                title={
                  q.trim()
                    ? `'${q.trim()}'에 대한 검색 결과가 없어요`
                    : "조건에 맞는 책이 없어요"
                }
                description={
                  hasActiveFilters
                    ? "필터를 조정하거나 초기화해 다시 시도해보세요."
                    : "다른 키워드로 검색해보세요."
                }
                actionLabel={hasActiveFilters ? "필터 초기화" : undefined}
                onAction={hasActiveFilters ? resetFilters : undefined}
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
  caption,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  // 제목 옆 작게 노출되는 부가 설명 (예: 데이터 출처/기준 시각)
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Stack direction="row" gap={0.75} alignItems="center" mb={1.25}>
        {icon}
        <Typography
          sx={{
            fontSize: 14.5,
            fontWeight: 800,
            letterSpacing: "-0.025em",
          }}
        >
          {title}
        </Typography>
        {caption && (
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: palette.inkSubtle,
              ml: 0.25,
              letterSpacing: "-0.01em",
            }}
          >
            {caption}
          </Typography>
        )}
      </Stack>
      {children}
    </Box>
  );
}

// "5월 1주차" 같은 한국 출판계 베스트셀러 표기.
// - 그 달 첫 월요일이 시작하는 주를 1주차로 셈 (Mon~Sun 한 주)
// - 1일~첫 월요일 직전 며칠은 전 달의 마지막 주로 흡수 (월~일 같은 주이므로)
//   예: 2026-05-01(금) ~ 05-03(일) 은 "4월 N주차" 로 표시
function formatBestsellerWeek(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // 그 달 1일의 요일 (0=Sun, 1=Mon, …)
  const firstDow = new Date(year, month, 1).getDay();
  // 1일이 월요일이면 offset 0, 아니면 다음 월요일까지 거리
  const firstMondayOffset = (1 - firstDow + 7) % 7;
  const firstMondayDay = 1 + firstMondayOffset;

  if (day < firstMondayDay) {
    // 이 달의 첫 월요일 이전 → 전 달 마지막 날 기준으로 재귀 (같은 주에 속함)
    const lastDayOfPrev = new Date(year, month, 0);
    return formatBestsellerWeek(lastDayOfPrev);
  }
  const week = Math.floor((day - firstMondayDay) / 7) + 1;
  return `${month + 1}월 ${week}주차`;
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
