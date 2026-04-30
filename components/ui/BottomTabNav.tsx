"use client";

// 화면 하단 5탭 네비게이션 (홈/검색/등록/채팅/마이)
// - "등록"은 가운데 떠 보이는 강조 버튼(FAB 스타일)으로 별도 처리
// - 현재 경로(usePathname)와 비교해 활성 탭을 판별

import { Box, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { usePathname, useRouter } from "next/navigation";
import { palette, shadow } from "@/lib/theme";

// 탭 정의: 활성 시(on) / 비활성 시(off) 아이콘을 분리해 시각적 강조 차이를 둔다
// primary: true 는 가운데 강조 등록 버튼 표시용 플래그
const TABS = [
  { label: "홈", path: "/home", on: HomeRoundedIcon, off: HomeOutlinedIcon },
  {
    label: "검색",
    path: "/search",
    on: SearchRoundedIcon,
    off: SearchOutlinedIcon,
  },
  { label: "등록", path: "/register", on: AddRoundedIcon, off: AddRoundedIcon, primary: true },
  {
    label: "채팅",
    path: "/chat",
    on: ChatBubbleRoundedIcon,
    off: ChatBubbleOutlineRoundedIcon,
  },
  {
    label: "마이",
    path: "/mypage",
    on: PersonRoundedIcon,
    off: PersonOutlineRoundedIcon,
  },
];

export default function BottomTabNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      className="safe-bottom"
      sx={{
        height: 64,
        borderTop: `1px solid ${palette.line}`,
        display: "flex",
        marginTop: "auto",
        flexShrink: 0,
        background: palette.surface,
      }}
    >
      {TABS.map((tab) => {
        // /chat 활성 판별 시 /chat/123 같은 하위 경로도 활성으로 인정
        const active =
          pathname === tab.path || pathname.startsWith(tab.path + "/");
        const Icon = active ? tab.on : tab.off;
        const color = active ? palette.primary : palette.inkSubtle;
        if (tab.primary) {
          return (
            <Box
              key={tab.path}
              onClick={() => router.push(tab.path)}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: `linear-gradient(160deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: shadow.pop,
                  transform: "translateY(-12px)",
                  transition: "transform 140ms ease, box-shadow 140ms ease",
                  "&:active": { transform: "translateY(-12px) scale(0.94)" },
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 26 }} />
              </Box>
            </Box>
          );
        }
        return (
          <Box
            key={tab.path}
            onClick={() => router.push(tab.path)}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              cursor: "pointer",
              color,
              transition: "color 120ms ease",
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color,
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
