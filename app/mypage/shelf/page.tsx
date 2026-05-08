"use client";

// 내 책장 (/mypage/shelf) — 사용자가 가진 책을 4가지 상태로 분류해 관리
// READING(읽는 중) / FINISHED(완독) / FOR_SALE(판매예정) / OWNED(소장)
//
// 디자인:
// - 상단 탭 (전체 + 4가지 상태) — 카운트 배지
// - 본문: "나무결" 톤 책장 이미지 위에 BookSpine 진열 — status 별 한 줄씩
// - 책 클릭 → BottomSheet 상세 (상태 변경 / 메모 / 별점 / 등록하기 / 삭제)
// - 우상단 "+" 버튼 → /mypage/shelf/add (네이버 검색 + 바코드 스캔 재사용)

import {
  Box,
  Button,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import OpenBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InventoryRoundedIcon from "@mui/icons-material/Inventory2Rounded";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import BookSpine from "@/components/ui/BookSpine";
import BookImage from "@/components/ui/BookImage";
import { useToast } from "@/components/ui/ToastProvider";
import { palette, radius, shadow } from "@/lib/theme";
import {
  SHELF_STATUS_LABEL,
  type ShelfItem,
  type ShelfStatus,
} from "@/lib/supabase/types";
import {
  useMyShelf,
  useRemoveShelfItem,
  useUpdateShelfItem,
} from "@/lib/query/shelfHooks";
import { useShelfStore } from "@/lib/store/shelfStore";

const STATUS_ORDER: ShelfStatus[] = ["READING", "FINISHED", "FOR_SALE", "OWNED"];

const STATUS_META: Record<
  ShelfStatus,
  { icon: React.ReactNode; description: string }
> = {
  READING: {
    icon: <OpenBookRoundedIcon sx={{ fontSize: 18 }} />,
    description: "지금 읽고 있는 책",
  },
  FINISHED: {
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />,
    description: "완독한 책 — 별점·메모 정리",
  },
  FOR_SALE: {
    icon: <StorefrontRoundedIcon sx={{ fontSize: 18 }} />,
    description: "정리할 책 — 판매로 등록할 수 있어요",
  },
  OWNED: {
    icon: <InventoryRoundedIcon sx={{ fontSize: 18 }} />,
    description: "소장 중인 책",
  },
};

type TabKey = "ALL" | ShelfStatus;

export default function ShelfPage() {
  const router = useRouter();
  const toast = useToast();

  const { data: items = [], isLoading } = useMyShelf();
  const updateMut = useUpdateShelfItem();
  const removeMut = useRemoveShelfItem();
  const byStatus = useShelfStore((s) => s.byStatus);
  const total = useShelfStore((s) => s.total);

  const [tab, setTab] = useState<TabKey>("ALL");
  const [selected, setSelected] = useState<ShelfItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // BottomSheet 안 메모/별점 편집을 위한 로컬 폼 — 시트 닫힐 때 초기화
  const [memoDraft, setMemoDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState<number | undefined>(undefined);

  // 탭별로 필터된 결과 — useMemo 로 토글마다 새 배열 만들지 않음
  const filtered = useMemo(() => {
    if (tab === "ALL") return items;
    return items.filter((it) => it.status === tab);
  }, [items, tab]);

  // 상태별 그룹 — "ALL" 탭에서 책장 섹션 분리해 표시
  const grouped = useMemo(() => {
    const map: Record<ShelfStatus, ShelfItem[]> = {
      READING: [],
      FINISHED: [],
      FOR_SALE: [],
      OWNED: [],
    };
    for (const it of items) map[it.status].push(it);
    return map;
  }, [items]);

  const openItem = (it: ShelfItem) => {
    setSelected(it);
    setMemoDraft(it.memo ?? "");
    setRatingDraft(it.rating);
  };
  const closeSheet = () => {
    setSelected(null);
    setMemoDraft("");
    setRatingDraft(undefined);
  };

  const persistDraft = async () => {
    if (!selected) return;
    const memoChanged = (memoDraft || "") !== (selected.memo ?? "");
    const ratingChanged = (ratingDraft ?? null) !== (selected.rating ?? null);
    if (!memoChanged && !ratingChanged) return;
    await updateMut.mutateAsync({
      id: selected.id,
      patch: {
        memo: memoChanged ? memoDraft.trim() || null : undefined,
        rating: ratingChanged ? ratingDraft ?? null : undefined,
      },
    });
  };

  const changeStatus = async (next: ShelfStatus) => {
    if (!selected || selected.status === next) return;
    // status 변경과 메모/별점 draft 를 한 번의 PATCH 로 묶어 네트워크 1회로 처리.
    // undefined 필드는 repo 가 무시하므로 변경된 값만 골라 넣는다.
    const memoChanged = (memoDraft || "") !== (selected.memo ?? "");
    const ratingChanged = (ratingDraft ?? null) !== (selected.rating ?? null);
    const updated = await updateMut.mutateAsync({
      id: selected.id,
      patch: {
        status: next,
        memo: memoChanged ? memoDraft.trim() || null : undefined,
        rating: ratingChanged ? ratingDraft ?? null : undefined,
      },
    });
    if (updated) setSelected(updated);
    toast?.show(`${SHELF_STATUS_LABEL[next]} 으로 옮겼어요`);
  };

  const handleSell = async () => {
    if (!selected) return;
    // 판매 등록 흐름 — /register 가 ?shelfId 로 prefill
    await persistDraft();
    closeSheet();
    router.push(`/register?shelfId=${selected.id}`);
  };

  // 이미 판매로 등록된 책장 항목 — 매물 상세로 이동 (재등록 방지)
  const handleViewListing = async () => {
    if (!selected?.linkedBookId) return;
    await persistDraft();
    closeSheet();
    router.push(`/books/${selected.linkedBookId}`);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await removeMut.mutateAsync(selected.id);
    setConfirmDelete(false);
    closeSheet();
    toast?.show("책장에서 삭제했어요");
  };

  return (
    <>
      <AppHeader
        title="내 책장"
        left="back"
        right={
          <IconButton onClick={() => router.push("/mypage/shelf/add")}>
            <AddRoundedIcon />
          </IconButton>
        }
      />

      {/* 상태 탭 */}
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.lineSoft}`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as TabKey)}
          variant="scrollable"
          scrollButtons={false}
          sx={{
            minHeight: 44,
            px: 1,
            "& .MuiTab-root": {
              minHeight: 44,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              color: palette.inkMute,
              letterSpacing: "-0.01em",
              minWidth: 0,
              px: 1.5,
            },
            "& .Mui-selected": { color: palette.primary },
            "& .MuiTabs-indicator": {
              background: palette.primary,
              height: 3,
              borderRadius: 999,
            },
          }}
        >
          <Tab value="ALL" label={`전체 ${total}`} />
          {STATUS_ORDER.map((s) => (
            <Tab
              key={s}
              value={s}
              label={`${SHELF_STATUS_LABEL[s]} ${byStatus[s]}`}
            />
          ))}
        </Tabs>
      </Box>

      <ScrollBody>
        {/* 책장 비주얼 — 따뜻한 라이트 우드 톤 배경 */}
        <Box
          sx={{
            background: `linear-gradient(180deg, ${palette.surfaceAlt} 0%, ${palette.lineSoft} 100%)`,
            minHeight: "100%",
            pb: 4,
          }}
        >
          {!isLoading && items.length === 0 && (
            <Box sx={{ pt: 4 }}>
              <EmptyState
                icon="📚"
                title="아직 책장이 비어있어요"
                description={
                  "ISBN 또는 책 제목으로 검색해서\n첫 책을 책장에 올려보세요."
                }
                actionLabel="책 추가하기"
                onAction={() => router.push("/mypage/shelf/add")}
              />
            </Box>
          )}

          {/* 전체 탭 — 상태별 섹션을 모두 노출 */}
          {tab === "ALL" &&
            STATUS_ORDER.map((s) => {
              const list = grouped[s];
              if (list.length === 0) return null;
              return (
                <ShelfRow
                  key={s}
                  status={s}
                  items={list}
                  onItemClick={openItem}
                  onSeeAll={() => setTab(s)}
                />
              );
            })}

          {/* 특정 상태 탭 — 한 섹션만 노출 (제목은 탭이 이미 알려줌) */}
          {tab !== "ALL" && filtered.length > 0 && (
            <ShelfRow
              status={tab}
              items={filtered}
              onItemClick={openItem}
              dense
            />
          )}

          {tab !== "ALL" && !isLoading && filtered.length === 0 && (
            <Box sx={{ pt: 4 }}>
              <EmptyState
                icon="📖"
                title={`${SHELF_STATUS_LABEL[tab]} 인 책이 없어요`}
                description="책을 추가하거나 다른 상태에서 옮겨와보세요."
                actionLabel="책 추가하기"
                onAction={() => router.push("/mypage/shelf/add")}
              />
            </Box>
          )}
        </Box>
      </ScrollBody>

      {/* 책 상세 BottomSheet — 상태 변경 + 별점 + 메모 + 액션 */}
      <BottomSheet
        open={!!selected}
        onClose={() => {
          // 닫을 때 변경된 메모/별점 자동 저장 (의도한 작업 그대로 보존)
          void persistDraft().finally(() => closeSheet());
        }}
        title={selected?.title}
        footer={
          selected && (
            <Stack direction="row" gap={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={() => setConfirmDelete(true)}
                sx={{
                  borderColor: palette.line,
                  color: palette.inkMute,
                  "&:hover": {
                    borderColor: palette.accent,
                    color: palette.accent,
                    background: palette.accentSoft,
                  },
                }}
              >
                삭제
              </Button>
              {selected.status === "FOR_SALE" && selected.linkedBookId ? (
                // 판매중 + 매물 연결됨 — 중복 등록 방지 + 매물로 점프
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<StorefrontRoundedIcon />}
                  onClick={handleViewListing}
                  sx={{
                    borderColor: palette.primary,
                    color: palette.primary,
                    background: palette.primaryTint,
                    "&:hover": {
                      borderColor: palette.primary,
                      background: palette.primarySoft,
                    },
                  }}
                >
                  등록된 매물 보기
                </Button>
              ) : selected.status === "FOR_SALE" ? (
                <Button
                  fullWidth
                  startIcon={<StorefrontRoundedIcon />}
                  onClick={handleSell}
                >
                  판매 등록하기
                </Button>
              ) : (
                <Button fullWidth onClick={() => persistDraft().finally(closeSheet)}>
                  저장하고 닫기
                </Button>
              )}
            </Stack>
          )
        }
      >
        {selected && (
          <Stack gap={2} sx={{ pt: 1, pb: 1 }}>
            {/* 책 정보 헤더 — 상세 시트는 책장 진열대가 아니므로 표지 이미지 사용 */}
            <Stack direction="row" gap={1.5} alignItems="center">
              <BookImage
                seed={selected.id}
                src={selected.coverUrl}
                width={72}
                height={96}
                radius={8}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}
                >
                  {selected.title}
                </Typography>
                <Typography
                  sx={{ fontSize: 12, color: palette.inkMute, mt: 0.25 }}
                >
                  {[selected.author, selected.publisher]
                    .filter(Boolean)
                    .join(" · ") || "정보 없음"}
                </Typography>
                {(selected.startedAt || selected.finishedAt) && (
                  <Typography
                    sx={{ fontSize: 11, color: palette.inkSubtle, mt: 0.25 }}
                  >
                    {selected.startedAt && `시작 ${selected.startedAt}`}
                    {selected.startedAt && selected.finishedAt && " · "}
                    {selected.finishedAt && `완독 ${selected.finishedAt}`}
                  </Typography>
                )}
                {selected.status === "FOR_SALE" && selected.linkedBookId && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.4,
                      mt: 0.6,
                      px: 0.85,
                      py: 0.25,
                      borderRadius: 999,
                      background: palette.primarySoft,
                      color: palette.primary,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <StorefrontRoundedIcon sx={{ fontSize: 12 }} />
                    매물로 등록됨
                  </Box>
                )}
              </Box>
            </Stack>

            {/* 상태 변경 — 4분할 세그먼티드 */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: palette.inkSubtle,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: 0.75,
                }}
              >
                상태
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0.75,
                }}
              >
                {STATUS_ORDER.map((s) => {
                  const on = selected.status === s;
                  return (
                    <Box
                      key={s}
                      onClick={() => changeStatus(s)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        p: "10px 12px",
                        borderRadius: `${radius.sm}px`,
                        border: `1.5px solid ${on ? palette.primary : palette.lineSoft}`,
                        background: on ? palette.primaryTint : palette.surface,
                        color: on ? palette.primary : palette.ink,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 140ms ease",
                        boxShadow: on ? `0 0 0 4px ${palette.primaryGlow}` : "none",
                        "&:active": { transform: "scale(0.98)" },
                      }}
                    >
                      {STATUS_META[s].icon}
                      {SHELF_STATUS_LABEL[s]}
                    </Box>
                  );
                })}
              </Box>
              <Typography
                sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.75 }}
              >
                {STATUS_META[selected.status].description}
              </Typography>
            </Box>

            {/* 별점 — 1~5 */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: palette.inkSubtle,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: 0.75,
                }}
              >
                내 별점
              </Typography>
              <Stack direction="row" gap={0.5} alignItems="center">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = (ratingDraft ?? 0) >= n;
                  return (
                    <IconButton
                      key={n}
                      size="small"
                      onClick={() =>
                        setRatingDraft(
                          ratingDraft === n ? undefined : n
                        )
                      }
                      sx={{ p: 0.5, color: filled ? palette.warn : palette.line }}
                    >
                      {filled ? (
                        <StarRoundedIcon sx={{ fontSize: 28 }} />
                      ) : (
                        <StarBorderRoundedIcon sx={{ fontSize: 28 }} />
                      )}
                    </IconButton>
                  );
                })}
                {ratingDraft !== undefined && (
                  <Typography
                    sx={{
                      ml: 0.5,
                      fontSize: 13,
                      fontWeight: 800,
                      color: palette.warn,
                    }}
                  >
                    {ratingDraft}.0
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* 메모 */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: palette.inkSubtle,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: 0.75,
                }}
              >
                메모
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="감상, 인용, 거래 시 참고할 메모…"
                value={memoDraft}
                onChange={(e) => setMemoDraft(e.target.value.slice(0, 300))}
              />
              <Typography
                sx={{
                  textAlign: "right",
                  fontSize: 11,
                  color: palette.inkSubtle,
                  mt: 0.5,
                }}
              >
                {memoDraft.length}/300
              </Typography>
            </Box>
          </Stack>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        title="책장에서 삭제할까요?"
        description="별점 / 메모는 함께 사라져요."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

// 한 줄짜리 책장 행 — status 라벨 + 책등 가로 스크롤
function ShelfRow({
  status,
  items,
  onItemClick,
  onSeeAll,
  dense,
}: {
  status: ShelfStatus;
  items: ShelfItem[];
  onItemClick: (it: ShelfItem) => void;
  onSeeAll?: () => void;
  dense?: boolean;
}) {
  return (
    <Box sx={{ pt: dense ? 1.5 : 2.5, pb: 0.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, mb: 1 }}
      >
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 1,
              background: palette.primaryTint,
              color: palette.primary,
              display: "grid",
              placeItems: "center",
            }}
          >
            {STATUS_META[status].icon}
          </Box>
          <Typography
            sx={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.01em" }}
          >
            {SHELF_STATUS_LABEL[status]}
          </Typography>
          <Typography sx={{ fontSize: 12, color: palette.inkSubtle, ml: 0.25 }}>
            {items.length}권
          </Typography>
        </Stack>
        {onSeeAll && items.length > 6 && (
          <Typography
            onClick={onSeeAll}
            sx={{
              fontSize: 12,
              color: palette.primary,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            전체 보기
          </Typography>
        )}
      </Stack>

      {/* 나무 받침대 + 책등 진열 */}
      <Box
        sx={{
          mx: 2,
          position: "relative",
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
          border: `1px solid ${palette.lineSoft}`,
          borderRadius: `${radius.lg}px`,
          p: 1.5,
          boxShadow: shadow.card,
          overflow: "hidden",
          // 빈 공간에 깔리는 미세한 격자 — 책장 안쪽 음영처럼
          backgroundImage: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%), repeating-linear-gradient(90deg, transparent 0 8px, rgba(140,115,80,0.04) 8px 9px)`,
          backgroundBlendMode: "normal, multiply",
        }}
      >
        <Box
          className="no-scrollbar"
          sx={{
            display: "flex",
            gap: 0.75,
            overflowX: "auto",
            alignItems: "flex-end",
            pb: 0.75,
            minHeight: 156,
          }}
        >
          {items.map((it) => (
            <BookSpine
              key={it.id}
              seed={it.id}
              title={it.title}
              author={it.author}
              category={it.category}
              coverUrl={it.coverUrl}
              rating={it.rating}
              listed={it.status === "FOR_SALE" && !!it.linkedBookId}
              onClick={() => onItemClick(it)}
            />
          ))}
        </Box>
        {/* 나무 받침대 — 그라데이션 + 가는 하이라이트 라인으로 입체감 */}
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
