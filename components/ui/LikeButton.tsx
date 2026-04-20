"use client";

import { IconButton } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useState } from "react";
import { palette } from "@/lib/theme";
import { useToast } from "./ToastProvider";

interface Props {
  defaultLiked?: boolean;
  size?: "small" | "medium" | "large";
  onChange?: (liked: boolean) => void;
  bg?: string;
  stopPropagation?: boolean;
}

export default function LikeButton({
  defaultLiked = false,
  size = "medium",
  onChange,
  bg,
  stopPropagation = true,
}: Props) {
  const [liked, setLiked] = useState(defaultLiked);
  const [pop, setPop] = useState(false);
  const toast = useToast();

  return (
    <IconButton
      size={size}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        const next = !liked;
        setLiked(next);
        onChange?.(next);
        setPop(true);
        setTimeout(() => setPop(false), 400);
        toast?.show(next ? "찜 목록에 추가했어요" : "찜을 해제했어요");
      }}
      sx={{
        color: liked ? palette.accent : palette.inkSubtle,
        background: bg ?? "transparent",
        "&:hover": { background: bg ?? "transparent" },
      }}
      aria-label="like"
    >
      {liked ? (
        <FavoriteRoundedIcon
          fontSize={size === "large" ? "medium" : "small"}
          className={pop ? "animate-pop" : undefined}
        />
      ) : (
        <FavoriteBorderRoundedIcon
          fontSize={size === "large" ? "medium" : "small"}
        />
      )}
    </IconButton>
  );
}
