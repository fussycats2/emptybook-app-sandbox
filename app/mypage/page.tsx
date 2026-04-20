"use client";

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

const STATS = [
  { label: "판매중", val: "3", icon: <StorefrontRoundedIcon />, href: "/mypage/orders" },
  { label: "구매내역", val: "12", icon: <ShoppingBagRoundedIcon />, href: "/mypage/orders" },
  { label: "찜", val: "7", icon: <FavoriteRoundedIcon /> },
  { label: "최근 본", val: "23", icon: <HistoryRoundedIcon /> },
];

const SECTIONS: {
  title: string;
  items: { label: string; href?: string; icon?: React.ReactNode }[];
}[] = [
  {
    title: "내 거래",
    items: [
      { label: "구매 내역", href: "/mypage/orders", icon: <ShoppingBagRoundedIcon /> },
      { label: "판매 내역", href: "/mypage/orders", icon: <StorefrontRoundedIcon /> },
      { label: "받은 후기", icon: <StarRoundedIcon /> },
    ],
  },
  {
    title: "내 활동",
    items: [
      { label: "찜한 상품", icon: <FavoriteRoundedIcon /> },
      { label: "최근 본 상품", icon: <HistoryRoundedIcon /> },
      { label: "내 채팅", href: "/chat", icon: <ChatBubbleRoundedIcon /> },
    ],
  },
  {
    title: "혜택",
    items: [{ label: "쿠폰함", icon: <LocalActivityRoundedIcon /> }],
  },
  {
    title: "고객 지원",
    items: [
      { label: "공지사항", icon: <HelpOutlineRoundedIcon /> },
      { label: "1:1 문의", icon: <HelpOutlineRoundedIcon /> },
      { label: "이용 약관", icon: <HelpOutlineRoundedIcon /> },
    ],
  },
];

export default function MyPage() {
  const router = useRouter();

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
              <Typography sx={{ fontSize: 17, fontWeight: 800 }}>홍길동</Typography>
              <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
                @bookworm_hong · 마포구
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
            {STATS.map((s) => (
              <Box
                key={s.label}
                onClick={() => s.href && router.push(s.href)}
                sx={{
                  background: palette.surface,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 3,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  cursor: s.href ? "pointer" : "default",
                  "&:hover": s.href ? { background: palette.lineSoft } : {},
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
                    {s.val}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                    {s.label}
                  </Typography>
                </Box>
              </Box>
            ))}
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
              {section.items.map((item, i) => (
                <Stack
                  key={item.label}
                  direction="row"
                  alignItems="center"
                  gap={1.25}
                  sx={{
                    p: 1.5,
                    borderTop: i === 0 ? "none" : `1px solid ${palette.line}`,
                    cursor: item.href ? "pointer" : "default",
                    "&:hover": item.href ? { background: palette.lineSoft } : {},
                  }}
                  onClick={() => item.href && router.push(item.href)}
                >
                  <Box sx={{ color: palette.inkMute }}>{item.icon}</Box>
                  <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <KeyboardArrowRightRoundedIcon sx={{ color: palette.inkSubtle }} />
                </Stack>
              ))}
            </Box>
          </Box>
        ))}

        <Box sx={{ pt: 1, pb: 4, textAlign: "center" }}>
          <Typography
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
