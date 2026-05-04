"use client";

// 마이페이지 (/mypage) — 사용자 프로필 카드 + 매너온도 + 통계 + 메뉴 섹션
// 로그인 사용자가 있으면 profiles 테이블에서 display_name/username 조회

import { Box, IconButton, Stack, Typography } from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LocalActivityRoundedIcon from "@mui/icons-material/LocalActivityRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { ScrollBody } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import MannerTemperature from "@/components/ui/MannerTemperature";
import { palette } from "@/lib/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { useMyBooks } from "@/lib/query/bookHooks";
import { useOrders } from "@/lib/query/orderHooks";
import { useMyProfile } from "@/lib/query/profileHooks";
import { useLikesStore } from "@/lib/store/likesStore";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";

// 메뉴 항목 정의 — href 가 있으면 라우팅, comingSoon 이면 "준비중" 칩 + 토스트로 안내
type MenuItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  comingSoon?: boolean;
};

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "내 거래",
    items: [
      { label: "구매 내역", href: "/mypage/orders", icon: <ShoppingBagRoundedIcon /> },
      { label: "판매 내역", href: "/mypage/selling", icon: <StorefrontRoundedIcon /> },
      { label: "받은 후기", href: "/mypage/reviews", icon: <StarRoundedIcon /> },
    ],
  },
  {
    title: "내 활동",
    items: [
      { label: "찜한 상품", href: "/mypage/likes", icon: <FavoriteRoundedIcon /> },
      { label: "최근 본 상품", href: "/mypage/recent", icon: <HistoryRoundedIcon /> },
      { label: "내 채팅", href: "/chat", icon: <ChatBubbleRoundedIcon /> },
    ],
  },
  {
    title: "혜택",
    items: [
      { label: "쿠폰함", href: "/mypage/coupons", icon: <LocalActivityRoundedIcon /> },
    ],
  },
  {
    title: "고객 지원",
    items: [
      { label: "공지사항", href: "/notices", icon: <HelpOutlineRoundedIcon /> },
      { label: "1:1 문의", href: "/help", icon: <HelpOutlineRoundedIcon /> },
      { label: "이용 약관", href: "/terms", icon: <HelpOutlineRoundedIcon /> },
    ],
  },
];

export default function MyPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();

  // React Query — 마이페이지 STATS / 프로필 모두 캐시 공유
  // - books / orders / profile 은 다른 화면에서도 같은 캐시 사용
  // - 찜 카운트는 Zustand likesStore 에서 즉시 구독 (다른 곳 토글 시 자동 반영)
  const { data: myBooks } = useMyBooks();
  const { data: orders } = useOrders();
  const { data: profile } = useMyProfile();
  const likeCount = useLikesStore((s) => s.liked.size);
  // 최근 본 책 개수 — localStorage persist 라 첫 프레임은 0 일 수 있다 (SSR/hydration 안전)
  const recentCount = useRecentlyViewedStore((s) => s.items.length);

  // "판매중" 카운트는 실제로 매물에 노출되는 상태만 — sold/canceled 는 제외
  // 로딩 중에는 0 으로 폴백 — 4개 STATS 카드가 모두 number 로 일관 표시되도록 (찜/최근 본 도 0 부터 시작)
  const sellingCount =
    myBooks?.filter((b) => {
      const s = b.status ?? (b.free ? "free" : "selling");
      return s === "selling" || s === "free" || s === "reserved";
    }).length ?? 0;
  const buyingCount = orders?.filter((o) => o.side === "buy").length ?? 0;

  // 표시 이름/핸들 결정 우선순위:
  // 1) profiles.display_name → 2) 이메일 앞부분 → 3) "게스트"
  const displayName =
    profile?.display_name ||
    (user?.email ? user.email.split("@")[0] : "게스트");
  const handle = profile?.username
    ? `@${profile.username}`
    : user?.email
    ? `@${user.email.split("@")[0]}`
    : "@guest";

  const handleLogout = async () => {
    await signOut();
    toast?.show("로그아웃되었어요");
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <AppHeader
        title="마이"
        left="none"
        bordered={false}
        right={
          <IconButton onClick={() => router.push("/mypage/settings")}>
            <SettingsRoundedIcon />
          </IconButton>
        }
      />
      <ScrollBody>
        <Box
          sx={{
            mx: 2,
            background: `linear-gradient(155deg, ${palette.surface} 0%, ${palette.surfaceAlt} 100%)`,
            borderRadius: 4,
            p: 2.5,
            border: `1px solid ${palette.lineSoft}`,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(26,38,32,0.03), 0 8px 24px rgba(26,38,32,0.05)",
          }}
        >
          {/* 배경 데코 — 살짝 비치는 라디얼 글로우 */}
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${palette.primaryGlow} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <Stack direction="row" gap={1.75} alignItems="center" sx={{ position: "relative" }}>
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  padding: "2px",
                  background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: palette.surface,
                  }}
                >
                  <BookImage seed="me" width={68} height={68} radius={999} />
                </Box>
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: `linear-gradient(155deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  border: `2px solid ${palette.surface}`,
                  boxShadow: "0 2px 6px rgba(45,95,74,0.30)",
                }}
              >
                <VerifiedRoundedIcon sx={{ fontSize: 14 }} />
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.025em" }}>
                {displayName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.inkSubtle, mt: 0.25 }}>
                {handle} · 마포구
              </Typography>
              <Typography
                onClick={() => router.push("/mypage/settings")}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  mt: 0.85,
                  fontSize: 11.5,
                  color: palette.primary,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  px: 1,
                  py: 0.35,
                  borderRadius: 999,
                  border: `1px solid ${palette.primarySoft}`,
                  background: palette.primaryTint,
                  transition: "background 140ms ease",
                  "&:hover": { background: palette.primarySoft },
                }}
              >
                프로필 수정 →
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ mt: 2.25, position: "relative" }}>
            <MannerTemperature value={38.6} size="lg" />
          </Box>
          <Stack direction="row" gap={0.75} mt={1.75} flexWrap="wrap" sx={{ position: "relative" }}>
            {["응답이 빨라요", "친절해요", "도서 상태 좋아요"].map((t) => (
              <Box
                key={t}
                sx={{
                  background: palette.primarySoft,
                  color: palette.primary,
                  fontSize: 11,
                  fontWeight: 700,
                  px: 1.1,
                  py: 0.45,
                  borderRadius: 999,
                  letterSpacing: "-0.01em",
                }}
              >
                {t}
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.25,
            }}
          >
            {(
              [
                {
                  label: "판매중",
                  val: sellingCount,
                  icon: <StorefrontRoundedIcon />,
                  href: "/mypage/selling",
                },
                {
                  label: "구매내역",
                  val: buyingCount,
                  icon: <ShoppingBagRoundedIcon />,
                  href: "/mypage/orders",
                },
                {
                  label: "찜",
                  val: likeCount,
                  icon: <FavoriteRoundedIcon />,
                  href: "/mypage/likes",
                },
                {
                  label: "최근 본",
                  val: recentCount,
                  icon: <HistoryRoundedIcon />,
                  href: "/mypage/recent",
                },
              ] as {
                label: string;
                val: number;
                icon: React.ReactNode;
                href?: string;
              }[]
            ).map((s) => {
              const clickable = !!s.href;
              return (
                <Box
                  key={s.label}
                  onClick={() => {
                    if (s.href) router.push(s.href);
                  }}
                  sx={{
                    background: palette.surface,
                    border: `1px solid ${palette.lineSoft}`,
                    borderRadius: 3,
                    p: 1.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    cursor: clickable ? "pointer" : "default",
                    transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": clickable
                      ? {
                          borderColor: palette.line,
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 18px rgba(26,38,32,0.06)",
                        }
                      : {},
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      background: `linear-gradient(135deg, ${palette.primaryTint} 0%, ${palette.primarySoft} 100%)`,
                      color: palette.primary,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 19,
                        fontWeight: 800,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.1,
                      }}
                    >
                      {s.val}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.25 }}>
                      {s.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {SECTIONS.map((section) => (
          <Box key={section.title} sx={{ px: 2, mb: 1.75 }}>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 800,
                color: palette.inkSubtle,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                px: 0.5,
                mb: 0.75,
              }}
            >
              {section.title}
            </Typography>
            <Box
              sx={{
                background: palette.surface,
                border: `1px solid ${palette.lineSoft}`,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, i) => {
                const clickable = !!item.href || !!item.comingSoon;
                return (
                  <Stack
                    key={item.label}
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                    sx={{
                      p: "14px 16px",
                      borderTop: i === 0 ? "none" : `1px solid ${palette.lineSoft}`,
                      cursor: clickable ? "pointer" : "default",
                      transition: "background 140ms ease",
                      "&:hover": clickable ? { background: palette.surfaceAlt } : {},
                    }}
                    onClick={() => {
                      if (item.href) router.push(item.href);
                      else if (item.comingSoon) toast?.show("준비중이에요");
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        background: palette.primaryTint,
                        color: palette.primary,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography
                      sx={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.label}
                    </Typography>
                    {item.comingSoon && (
                      <Box
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: palette.inkSubtle,
                          background: palette.lineSoft,
                          borderRadius: 999,
                          px: 0.85,
                          py: 0.2,
                        }}
                      >
                        준비중
                      </Box>
                    )}
                    <KeyboardArrowRightRoundedIcon sx={{ color: palette.inkSubtle, fontSize: 20 }} />
                  </Stack>
                );
              })}
            </Box>
          </Box>
        ))}

        <Box sx={{ pt: 1, pb: 4, textAlign: "center" }}>
          <Typography
            onClick={handleLogout}
            sx={{ fontSize: 12.5, color: palette.inkSubtle, cursor: "pointer" }}
          >
            로그아웃
          </Typography>
        </Box>
      </ScrollBody>
      <BottomTabNav />
    </>
  );
}
