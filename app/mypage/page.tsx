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
      { label: "최근 본 상품", icon: <HistoryRoundedIcon />, comingSoon: true },
      { label: "내 채팅", href: "/chat", icon: <ChatBubbleRoundedIcon /> },
    ],
  },
  {
    title: "혜택",
    items: [
      { label: "쿠폰함", icon: <LocalActivityRoundedIcon />, comingSoon: true },
    ],
  },
  {
    title: "고객 지원",
    items: [
      { label: "공지사항", icon: <HelpOutlineRoundedIcon />, comingSoon: true },
      { label: "1:1 문의", icon: <HelpOutlineRoundedIcon />, comingSoon: true },
      { label: "이용 약관", icon: <HelpOutlineRoundedIcon />, comingSoon: true },
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

  const sellingCount = myBooks
    ? myBooks.filter((b) => {
        const s = b.status ?? (b.free ? "free" : "selling");
        return s === "selling" || s === "free" || s === "reserved";
      }).length
    : null;
  const buyingCount = orders
    ? orders.filter((o) => o.side === "buy").length
    : null;

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
            background: palette.surface,
            borderRadius: 4,
            p: 2.5,
            border: `1px solid ${palette.line}`,
          }}
        >
          <Stack direction="row" gap={1.5} alignItems="center">
            <Box sx={{ position: "relative" }}>
              <BookImage seed="me" width={64} height={64} radius={999} />
              <Box
                sx={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: palette.primary,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  border: `2px solid ${palette.surface}`,
                }}
              >
                ✓
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 800 }}>
                {displayName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
                {handle} · 마포구
              </Typography>
              <Typography
                onClick={() => router.push("/mypage/settings")}
                sx={{
                  display: "inline-block",
                  mt: 0.5,
                  fontSize: 11.5,
                  color: palette.primary,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                프로필 수정 →
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <MannerTemperature value={38.6} size="lg" />
          </Box>
          <Stack direction="row" gap={0.75} mt={1.5} flexWrap="wrap">
            {["응답이 빨라요", "친절해요", "도서 상태 좋아요"].map((t) => (
              <Box
                key={t}
                sx={{
                  background: palette.primarySoft,
                  color: palette.primary,
                  fontSize: 11,
                  fontWeight: 700,
                  px: 1,
                  py: 0.4,
                  borderRadius: 999,
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
                // "최근 본"은 view-history 추적이 아직 없어 placeholder. 클릭 시 토스트로 안내
                {
                  label: "최근 본",
                  val: null,
                  icon: <HistoryRoundedIcon />,
                  comingSoon: true,
                },
              ] as {
                label: string;
                val: number | null;
                icon: React.ReactNode;
                href?: string;
                comingSoon?: boolean;
              }[]
            ).map((s) => {
              const clickable = !!s.href || !!s.comingSoon;
              return (
                <Box
                  key={s.label}
                  onClick={() => {
                    if (s.href) router.push(s.href);
                    else if (s.comingSoon) toast?.show("준비중이에요");
                  }}
                  sx={{
                    background: palette.surface,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 3,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    cursor: clickable ? "pointer" : "default",
                    "&:hover": clickable ? { background: palette.lineSoft } : {},
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      background: palette.primarySoft,
                      color: palette.primary,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                      {s.val == null ? "-" : s.val}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                      {s.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {SECTIONS.map((section) => (
          <Box key={section.title} sx={{ px: 2, mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: palette.inkSubtle,
                px: 0.5,
                mb: 0.5,
              }}
            >
              {section.title}
            </Typography>
            <Box
              sx={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
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
                    gap={1.25}
                    sx={{
                      p: 1.5,
                      borderTop: i === 0 ? "none" : `1px solid ${palette.line}`,
                      cursor: clickable ? "pointer" : "default",
                      "&:hover": clickable ? { background: palette.lineSoft } : {},
                    }}
                    onClick={() => {
                      if (item.href) router.push(item.href);
                      else if (item.comingSoon) toast?.show("준비중이에요");
                    }}
                  >
                    <Box sx={{ color: palette.inkMute }}>{item.icon}</Box>
                    <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
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
                    <KeyboardArrowRightRoundedIcon sx={{ color: palette.inkSubtle }} />
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
