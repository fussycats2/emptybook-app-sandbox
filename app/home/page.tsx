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
import { useRouter } from "next/navigation";
import BottomTabNav from "@/components/ui/BottomTabNav";
import LocationChip from "@/components/ui/LocationChip";
import { BookFeedItem } from "@/components/ui/BookCard";
import BookImage from "@/components/ui/BookImage";
import { SectionLabel, ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { palette, radius } from "@/lib/theme";
import { meta } from "@/lib/repo";
import { useRecentBooks } from "@/lib/query/bookHooks";
import { useNotificationsStore } from "@/lib/store/notificationsStore";

const { CATEGORIES, POPULAR_SELLERS } = meta;
import MannerTemperature from "@/components/ui/MannerTemperature";

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  // React Query — 캐시 공유 + 자동 refetch 정책 + 에러 시 빈 배열 처리
  const { data: books, isLoading } = useRecentBooks(10);
  // 알림 unread 개수 — 0 이면 헤더의 빨간점을 숨긴다
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  return (
    <>
      <Box
        sx={{
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          px: 2,
          pt: 1.5,
          pb: 1.5,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
          <LocationChip onClick={() => toast?.show("동네 변경은 준비 중이에요")} />
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
            "& input": { py: 1.25, fontSize: 13.5, cursor: "pointer" },
            cursor: "pointer",
          }}
        />
      </Box>

      <ScrollBody>
        {/* 이벤트 배너 — 거대 이모지 대신 추상적인 라운드 도형으로 데코 */}
        <Box
          onClick={() => toast?.show("이벤트 페이지는 준비 중이에요")}
          sx={{
            mx: 2,
            mt: 2,
            borderRadius: `${radius.lg}px`,
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            color: "#fff",
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
            cursor: "pointer",
          }}
        >
          {/* 우측 추상 데코 — 책장 실루엣 느낌의 라운드 도형 */}
          <Box
            sx={{
              position: "absolute",
              right: -28,
              top: -18,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 70%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 18,
              bottom: -22,
              width: 96,
              height: 96,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1, maxWidth: "70%" }}>
            <Stack direction="row" alignItems="center" gap={0.75} mb={0.75}>
              <CampaignRoundedIcon sx={{ fontSize: 16 }} />
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  opacity: 0.9,
                }}
              >
                EVENT
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1.4,
                letterSpacing: "-0.015em",
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
              sx={{ mt: 1.25, fontSize: 12, opacity: 0.85, fontWeight: 600 }}
            >
              참여하기
              <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Stack>
          </Box>
        </Box>

        <Box sx={{ pt: 2.25 }}>
          <Box
            className="no-scrollbar"
            sx={{
              display: "flex",
              gap: 1.25,
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
                  gap: 0.6,
                  width: 64,
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: palette.primaryTint,
                    border: `1px solid ${palette.lineSoft}`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 24,
                    transition: "transform 120ms ease, background 120ms ease",
                    "&:hover": {
                      background: palette.primarySoft,
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {c.emoji}
                </Box>
                <Typography
                  sx={{ fontSize: 11.5, color: palette.inkMute, fontWeight: 600 }}
                >
                  {c.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <SectionLabel
          right={
            <Stack direction="row" alignItems="center" gap={0.5}>
              <LocalFireDepartmentRoundedIcon
                sx={{ fontSize: 16, color: palette.accent }}
              />
              <Typography
                sx={{ fontSize: 12, color: palette.inkMute, fontWeight: 600 }}
              >
                실시간 인기
              </Typography>
            </Stack>
          }
        >
          마포구의 따끈한 책
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
          sx={{ display: "flex", gap: 1.5, px: 2, pb: 3, overflowX: "auto" }}
        >
          {POPULAR_SELLERS.map((u) => (
            <Box
              key={u.name}
              sx={{
                flexShrink: 0,
                width: 168,
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: `${radius.md}px`,
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                transition: "border-color 120ms ease, transform 120ms ease",
                "&:hover": { borderColor: palette.primary, transform: "translateY(-1px)" },
              }}
            >
              <Stack direction="row" gap={1} alignItems="center">
                <BookImage seed={u.name} width={36} height={36} radius={999} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {u.name}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: palette.inkSubtle }}>
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
    </>
  );
}
