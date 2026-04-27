"use client";

// 찜(좋아요) 토글 하트 버튼
// - bookId 가 주어지면 마운트 시 isLiked()로 초기 상태 조회 + 클릭 시 toggleLike() 호출
// - bookId 가 없으면 단순 비제어 토글로만 동작 (디자인 시안용)
// stopPropagation: 리스트 카드 위에서 사용 시 카드 클릭 이벤트로 번지지 않도록

import { IconButton } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { useEffect, useState } from "react";
import { palette } from "@/lib/theme";
import { useToast } from "./ToastProvider";
import { isLiked as fetchIsLiked, toggleLike } from "@/lib/repo";

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
  const [liked, setLiked] = useState(defaultLiked);
  const [pop, setPop] = useState(false);
  const [pending, setPending] = useState(false);
  const toast = useToast();

  // 마운트 시 1회: bookId 가 있으면 서버에서 실제 찜 여부를 가져와 동기화
  // (cancelled 플래그: 빠른 페이지 이탈 시 setLiked 호출을 막는다)
  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    fetchIsLiked(bookId)
      .then((v) => {
        if (!cancelled) setLiked(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const handleClick = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (pending) return; // 더블클릭으로 인한 중복 토글 방지

    // pop 애니메이션은 즉시 트리거 (서버 응답 기다리지 않음 → 반응 빠르게)
    setPop(true);
    setTimeout(() => setPop(false), 400);

    // bookId 가 없으면 로컬 토글만 — 디자인 데모용 동작 유지
    if (!bookId) {
      const next = !liked;
      setLiked(next);
      onChange?.(next);
      toast?.show(next ? "찜 목록에 추가했어요" : "찜을 해제했어요");
      return;
    }

    // 낙관적 업데이트(optimistic): 응답 전에 UI 부터 토글해 끊김 없게
    const optimistic = !liked;
    setLiked(optimistic);
    setPending(true);
    try {
      const res = await toggleLike(bookId);
      // 서버 결과로 한 번 더 정정 (보통 동일하지만 경쟁 상태 방지)
      setLiked(res.liked);
      onChange?.(res.liked, res.likeCount);
      toast?.show(res.liked ? "찜 목록에 추가했어요" : "찜을 해제했어요");
    } catch {
      // 실패 시 원복
      setLiked(!optimistic);
      toast?.show("잠시 후 다시 시도해주세요", "error");
    } finally {
      setPending(false);
    }
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
