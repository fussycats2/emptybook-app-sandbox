"use client";

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
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: palette.primary,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 6px 16px rgba(31, 111, 78, 0.35)",
                  transform: "translateY(-10px)",
                  transition: "transform 120ms ease",
                  "&:active": { transform: "translateY(-10px) scale(0.95)" },
                }}
              >
                <AddRoundedIcon />
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
              transition: "color 100ms",
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
