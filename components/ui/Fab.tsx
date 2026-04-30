"use client";

// 화면 우하단에 떠 있는 둥근 버튼(FAB: Floating Action Button)
// 기본 동작은 /register(글쓰기) 이동. href 를 바꿔 다른 페이지로도 사용 가능

import { Fab as MuiFab } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useRouter } from "next/navigation";
import { palette, shadow } from "@/lib/theme";

export default function Fab({
  href = "/register",
  label = "글쓰기",
  bottom = 80,
}: {
  href?: string;
  label?: string;
  bottom?: number;
}) {
  const router = useRouter();
  return (
    <MuiFab
      onClick={() => router.push(href)}
      variant="extended"
      sx={{
        position: "absolute",
        right: 16,
        bottom,
        zIndex: 9,
        background: `linear-gradient(160deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
        color: "#fff",
        fontWeight: 800,
        boxShadow: shadow.pop,
        height: 48,
        px: 2.25,
        "&:hover": { background: palette.primaryDark },
      }}
    >
      <AddRoundedIcon sx={{ mr: 0.75 }} />
      {label}
    </MuiFab>
  );
}
