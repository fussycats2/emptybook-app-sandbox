"use client";

// 홈 화면 (/home) — 앱의 메인 피드
// 구성: 위치/검색바 → 이벤트 배너 → 카테고리 가로 스크롤 → 최근 등록 책 목록 → 인기 판매자

import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
  OutlinedInput,
  Badge,
} from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomTabNav from "@/components/ui/BottomTabNav";
import LocationChip from "@/components/ui/LocationChip";
import RegionPickerSheet from "@/components/ui/RegionPickerSheet";
import { BookFeedItem } from "@/components/ui/BookCard";
import BookImage from "@/components/ui/BookImage";
import { SectionLabel, ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { palette, radius, shadow } from "@/lib/theme";
import { meta } from "@/lib/repo";
import { useRecentBooks } from "@/lib/query/bookHooks";
import { useNotificationsStore } from "@/lib/store/notificationsStore";
import { useMyShelf } from "@/lib/query/shelfHooks";
import { useShelfStore } from "@/lib/store/shelfStore";
import { useRegionStore } from "@/lib/store/regionStore";
import { SHELF_STATUS_LABEL } from "@/lib/supabase/types";

const { CATEGORIES, POPULAR_SELLERS } = meta;
import MannerTemperature from "@/components/ui/MannerTemperature";

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  // React Query — 캐시 공유 + 자동 refetch 정책 + 에러 시 빈 배열 처리
  const { data: books, isLoading } = useRecentBooks(10);
  // 알림 unread 개수 — 0 이면 헤더의 빨간점을 숨긴다
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  // 책장 카운트 — 홈 바로가기 카드에 권수/상태별 요약 노출
  // useMyShelf 가 결과를 받아 shelfStore 에 카운트를 동기화하므로 여기서 직접 데이터는 안 씀
  useMyShelf();
  const shelfTotal = useShelfStore((s) => s.total);
  const shelfByStatus = useShelfStore((s) => s.byStatus);
  // 사용자가 선택한 동네 — 헤더 칩 라벨 + 섹션 헤더 라벨에 일관 적용
  const region = useRegionStore((s) => s.region);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${palette.surface} 0%, ${palette.surface}F2 100%)`,
          backdropFilter: "saturate(160%) blur(8px)",
          WebkitBackdropFilter: "saturate(160%) blur(8px)",
          borderBottom: `1px solid ${palette.lineSoft}`,
          px: 2,
          pt: 1.5,
          pb: 1.5,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
          <LocationChip label={region} onClick={() => setRegionPickerOpen(true)} />
          <Stack direction="row">
            <IconButton onClick={() => router.push("/search")}>
              <SearchRoundedIcon />
            </IconButton>
            <IconButton onClick={() => router.push("/notifications")}>
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
                invisible={unreadCount === 0}
              >
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
          </Stack>
        </Stack>
        {/* 입력은 받지 않고(readOnly), 클릭만으로 검색 페이지로 이동시키는 패턴 */}
        <OutlinedInput
          fullWidth
          placeholder="찾고 있는 책이 있나요?"
          onClick={() => router.push("/search")}
          readOnly
          startAdornment={
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: palette.inkSubtle }} />
            </InputAdornment>
          }
          sx={{
            background: palette.lineSoft,
            borderRadius: 999,
            "& fieldset": { border: "none" },
            "& input": { py: 1.4, fontSize: 13.5, cursor: "pointer" },
            cursor: "pointer",
            transition: "background 160ms ease",
            "&:hover": { background: palette.surfaceAlt, boxShadow: `0 0 0 1px ${palette.line}` },
          }}
        />
      </Box>

      <ScrollBody>
        {/* 이벤트 배너 — 거대 이모지 대신 추상적인 라운드 도형으로 데코 */}
        <Box
          onClick={() => toast?.show("이벤트 페이지는 준비 중이에요")}
          className="card-lift"
          sx={{
            mx: 2,
            mt: 2,
            borderRadius: `${radius.lg}px`,
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 60%, #14302A 100%)`,
            color: "#fff",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
            cursor: "pointer",
            boxShadow: shadow.pop,
          }}
        >
          {/* 우측 추상 데코 — 책장 실루엣 느낌의 라운드 도형 */}
          <Box
            sx={{
              position: "absolute",
              right: -40,
              top: -30,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 60%, transparent 70%)",
              filter: "blur(2px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 18,
              bottom: -30,
              width: 110,
              height: 110,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.20)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 60,
              top: 30,
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1, maxWidth: "70%" }}>
            <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 999,
                  px: 1,
                  py: 0.4,
                }}
              >
                <CampaignRoundedIcon sx={{ fontSize: 13 }} />
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                  }}
                >
                  EVENT
                </Typography>
              </Box>
            </Stack>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1.4,
                letterSpacing: "-0.025em",
              }}
            >
              내 책장 정리하면
              <br />
              스타벅스 쿠폰 추첨!
            </Typography>
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              sx={{ mt: 1.5, fontSize: 12.5, opacity: 0.92, fontWeight: 700 }}
            >
              참여하기
              <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Stack>
          </Box>
        </Box>

        {/* 내 책장 바로가기 — 이벤트 배너 바로 아래, 카테고리 위에 배치 */}
        <Box
          onClick={() => router.push("/mypage/shelf")}
          className="card-lift"
          sx={{
            mx: 2,
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: `linear-gradient(135deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
            border: `1px solid ${palette.lineSoft}`,
            borderRadius: `${radius.lg}px`,
            p: 1.75,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            boxShadow: shadow.card,
            "&:hover": {
              borderColor: palette.line,
              boxShadow: shadow.cardHover,
            },
          }}
        >
          {/* 미니 책등 데코 — 3장이 살짝 겹친 모양 */}
          <Box
            sx={{
              flexShrink: 0,
              position: "relative",
              width: 64,
              height: 56,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 4,
                bottom: 0,
                width: 16,
                height: 50,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
                transform: "rotate(-4deg)",
                transformOrigin: "bottom",
                boxShadow: shadow.card,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 22,
                bottom: 0,
                width: 18,
                height: 56,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
                boxShadow: shadow.card,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 42,
                bottom: 0,
                width: 16,
                height: 48,
                borderRadius: 1,
                background: `linear-gradient(180deg, ${palette.warn} 0%, #9B6B1F 100%)`,
                transform: "rotate(3deg)",
                transformOrigin: "bottom",
                boxShadow: shadow.card,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -2,
                height: 4,
                borderRadius: 999,
                background: "linear-gradient(180deg, #B59B6E 0%, #8C7350 100%)",
                opacity: 0.85,
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <AutoStoriesRoundedIcon sx={{ fontSize: 16, color: palette.primary }} />
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                }}
              >
                내 책장
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 11.5,
                color: palette.inkSubtle,
                mt: 0.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shelfTotal === 0
                ? "읽고 있는 책, 정리할 책을 한 곳에 모아보세요."
                : `총 ${shelfTotal}권 · 읽는 중 ${shelfByStatus.READING} · ${SHELF_STATUS_LABEL.FOR_SALE} ${shelfByStatus.FOR_SALE}`}
            </Typography>
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: palette.primaryTint,
              color: palette.primary,
              display: "grid",
              placeItems: "center",
            }}
          >
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>

        <Box sx={{ pt: 2.5 }}>
          <Box
            className="no-scrollbar"
            sx={{
              display: "flex",
              gap: 1.5,
              px: 2,
              overflowX: "auto",
              pb: 0.5,
            }}
          >
            {CATEGORIES.map((c) => (
              <Box
                key={c.name}
                onClick={() =>
                  router.push(`/search?category=${encodeURIComponent(c.name)}`)
                }
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.75,
                  width: 64,
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${palette.primaryTint} 0%, ${palette.primarySoft} 100%)`,
                    border: `1px solid ${palette.lineSoft}`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 26,
                    transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease",
                    "&:hover": {
                      transform: "translateY(-2px) scale(1.04)",
                      boxShadow: `0 8px 20px ${palette.primaryGlow}`,
                    },
                  }}
                >
                  {c.emoji}
                </Box>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: palette.inkMute,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {c.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <SectionLabel
          right={
            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              sx={{
                px: 1,
                py: 0.4,
                borderRadius: 999,
                background: palette.accentSoft,
              }}
            >
              <LocalFireDepartmentRoundedIcon
                sx={{ fontSize: 13, color: palette.accent }}
              />
              <Typography
                sx={{
                  fontSize: 11,
                  color: palette.accent,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                실시간 인기
              </Typography>
            </Stack>
          }
        >
          {region}의 따끈한 책
        </SectionLabel>

        <Box sx={{ background: palette.surface }}>
          {/* 로딩 → 스켈레톤, 빈 결과 → EmptyState, 데이터 있음 → 카드 목록 */}
          {isLoading && <ListSkeleton count={4} />}
          {books && books.length === 0 && (
            <EmptyState
              icon="📚"
              title="아직 등록된 책이 없어요"
              description="첫 번째 판매자가 되어 우리 동네에 책을 나눠보세요."
              actionLabel="책 등록하기"
              onAction={() => router.push("/register")}
            />
          )}
          {books?.map((b) => (
            <BookFeedItem key={b.id} book={b} />
          ))}
        </Box>

        <SectionLabel>이 동네 인기 판매자</SectionLabel>
        <Box
          className="no-scrollbar"
          sx={{ display: "flex", gap: 1.5, px: 2, pb: 4, overflowX: "auto" }}
        >
          {POPULAR_SELLERS.map((u) => (
            <Box
              key={u.name}
              className="card-lift"
              sx={{
                flexShrink: 0,
                width: 176,
                background: palette.surface,
                border: `1px solid ${palette.lineSoft}`,
                borderRadius: `${radius.md}px`,
                p: 1.75,
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                cursor: "pointer",
                "&:hover": { borderColor: palette.line, boxShadow: shadow.cardHover },
              }}
            >
              <Stack direction="row" gap={1} alignItems="center">
                <BookImage seed={u.name} width={40} height={40} radius={999} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {u.name}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: palette.inkSubtle, mt: 0.25 }}>
                    거래 {u.trades}회
                  </Typography>
                </Box>
              </Stack>
              <MannerTemperature value={u.manner} size="sm" />
            </Box>
          ))}
        </Box>
      </ScrollBody>

      <BottomTabNav />
      <RegionPickerSheet
        open={regionPickerOpen}
        onClose={() => setRegionPickerOpen(false)}
      />
    </>
  );
}
