"use client";

// 찜(좋아요) 토글 하트 버튼
// - bookId 가 주어지면 useBookLike 훅으로 store(Zustand) + mutation(React Query) 사용
//   → 같은 책이 여러 화면에 떠 있어도 토글이 자동 동기화된다
// - bookId 가 없으면 단순 비제어 토글로만 동작 (디자인 시안용)
// stopPropagation: 리스트 카드 위에서 사용 시 카드 클릭 이벤트로 번지지 않도록

import { IconButton } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useEffect, useRef, useState } from "react";
import { palette } from "@/lib/theme";
import { useToast } from "./ToastProvider";
import { useBookLike } from "@/lib/query/likeHooks";

interface Props {
  bookId?: string;
  defaultLiked?: boolean;
  size?: "small" | "medium" | "large";
  onChange?: (liked: boolean, likeCount?: number) => void;
  bg?: string;
  stopPropagation?: boolean;
}

export default function LikeButton({
  bookId,
  defaultLiked = false,
  size = "medium",
  onChange,
  bg,
  stopPropagation = true,
}: Props) {
  const toast = useToast();
  const [pop, setPop] = useState(false);
  // bookId 없는 경우(디자인 데모)에 쓰이는 로컬 상태
  const [localLiked, setLocalLiked] = useState(defaultLiked);

  // bookId 가 있는 정상 모드: 전역 store + mutation 훅 사용
  const { liked: storeLiked, count, toggle, isPending } = useBookLike(bookId);
  const liked = bookId ? storeLiked : localLiked;

  // onChange 콜백을 store 변화에 맞춰 통지 (이전 값과 비교해 중복 통지 방지)
  const lastNotified = useRef<{ liked: boolean; count?: number } | null>(null);
  useEffect(() => {
    if (!bookId || !onChange) return;
    const snapshot = { liked: storeLiked, count };
    if (
      lastNotified.current?.liked === snapshot.liked &&
      lastNotified.current?.count === snapshot.count
    )
      return;
    lastNotified.current = snapshot;
    onChange(storeLiked, count);
  }, [bookId, storeLiked, count, onChange]);

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();

    // pop 애니메이션은 즉시 (서버 응답 기다리지 않음)
    setPop(true);
    setTimeout(() => setPop(false), 400);

    if (!bookId) {
      const next = !localLiked;
      setLocalLiked(next);
      onChange?.(next);
      toast?.show(next ? "찜 목록에 추가했어요" : "찜을 해제했어요");
      return;
    }

    if (isPending) return; // 중복 토글 방지
    const optimistic = !liked;
    toggle();
    toast?.show(optimistic ? "찜 목록에 추가했어요" : "찜을 해제했어요");
  };

  return (
    <IconButton
      size={size}
      onClick={handleClick}
      sx={{
        color: liked ? palette.accent : palette.inkSubtle,
        background: bg ?? "transparent",
        "&:hover": { background: bg ?? "transparent" },
      }}
      aria-label="like"
      aria-pressed={liked}
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
