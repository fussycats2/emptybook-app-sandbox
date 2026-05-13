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
import { palette } from "@/lib/theme";

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
        height: 68,
        borderTop: `1px solid ${palette.lineSoft}`,
        display: "flex",
        marginTop: "auto",
        flexShrink: 0,
        // 살짝 글래시한 탭바 — 모던한 폰 앱 느낌
        background: `linear-gradient(180deg, ${palette.surface}F2 0%, ${palette.surface} 100%)`,
        backdropFilter: "saturate(160%) blur(8px)",
        WebkitBackdropFilter: "saturate(160%) blur(8px)",
        boxShadow: "0 -1px 0 rgba(26,38,32,0.02), 0 -8px 24px rgba(26,38,32,0.04)",
        position: "relative",
      }}
    >
      {TABS.map((tab) => {
        // /chat 활성 판별 시 /chat/123 같은 하위 경로도 활성으로 인정
        const active =
          pathname === tab.path || pathname.startsWith(tab.path + "/");
        const Icon = active ? tab.on : tab.off;
        const color = active ? palette.primary : palette.inkSubtle;
        if (tab.primary) {
          // v10.1: 톤 다운 — 가운데 + 버튼이 너무 튀어 보여 사이즈/lift/그림자 한 단계씩 차분하게.
          // 그라데이션 → 단색 primary, lift -14 → -8, pop shadow → card shadow.
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
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: palette.primary,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `0 2px 6px rgba(45, 95, 74, 0.16), 0 8px 18px rgba(45, 95, 74, 0.18)`,
                  transform: "translateY(-8px)",
                  border: `3px solid ${palette.bg}`,
                  transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    transform: "translateY(-10px)",
                    background: palette.primaryDark,
                    boxShadow: `0 4px 10px rgba(45, 95, 74, 0.20), 0 12px 24px rgba(45, 95, 74, 0.22)`,
                  },
                  "&:active": { transform: "translateY(-8px) scale(0.94)" },
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 24 }} />
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
              gap: 0.3,
              cursor: "pointer",
              color,
              position: "relative",
              transition: "color 160ms ease",
            }}
          >
            {/* 활성 탭 상단의 작은 dot 인디케이터 — 모던한 강조 */}
            <Box
              sx={{
                position: "absolute",
                top: 6,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: palette.primary,
                opacity: active ? 1 : 0,
                transform: active ? "scale(1)" : "scale(0.4)",
                transition: "opacity 160ms ease, transform 160ms ease",
              }}
            />
            <Icon sx={{ fontSize: 24, mt: 0.5 }} />
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: active ? 800 : 600,
                letterSpacing: "-0.02em",
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
