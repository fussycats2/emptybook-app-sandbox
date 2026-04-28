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
import { useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import BottomTabNav from "@/components/ui/BottomTabNav";
import { ScrollBody } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import MannerTemperature from "@/components/ui/MannerTemperature";
import { palette } from "@/lib/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import {
  isSupabaseConfigured,
  listLikedBookIds,
  listMyBooks,
  listOrders,
} from "@/lib/repo";

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
  const [profile, setProfile] = useState<{
    display_name: string | null;
    username: string | null;
  } | null>(null);
  // 통계 카운트 — 로딩 중에는 null("-" 표시), 실패해도 0 으로 폴백해 화면이 멈추지 않게 한다
  const [sellingCount, setSellingCount] = useState<number | null>(null);
  const [buyingCount, setBuyingCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  // STATS 카운트 한 번에 로드 (판매중 / 구매내역 / 찜)
  // - 판매중: 내 책 중 SOLD/취소 외 활성 상태(판매중·예약중·무료나눔)
  // - 구매내역: 트랜잭션 중 내가 buyer 인 행
  // - 비로그인/mock 환경이면 각 함수가 mock 저장소로 자동 폴백
  useEffect(() => {
    let cancelled = false;
    Promise.all([listMyBooks(), listOrders(), listLikedBookIds()])
      .then(([books, orders, liked]) => {
        if (cancelled) return;
        setSellingCount(
          books.filter((b) => {
            const s = b.status ?? (b.free ? "free" : "selling");
            return s === "selling" || s === "free" || s === "reserved";
          }).length
        );
        setBuyingCount(orders.filter((o) => o.side === "buy").length);
        setLikeCount(liked.size);
      })
      .catch(() => {
        if (cancelled) return;
        setSellingCount(0);
        setBuyingCount(0);
        setLikeCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 로그인 + Supabase 활성 상태일 때만 profiles 조회
  // (cancelled 플래그: 빠른 페이지 이탈 시 setProfile 호출 방지)
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    let cancelled = false;
    (async () => {
      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const { data } = await supabaseBrowser()
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setProfile(data as { display_name: string | null; username: string | null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
