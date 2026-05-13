"use client";

// 화면 아래에서 올라오는 시트(BottomSheet) 컴포넌트
// - 검색 필터, 옵션 선택, 신고/삭제 메뉴 등에 사용
// - MUI의 Drawer를 anchor="bottom" 으로 사용하고 모바일 카드 폭(420)에 맞게 보정
// - swipe-to-close: grabber + title 영역을 터치해서 아래로 드래그하면 임계값 이상 시 onClose.
//   본문(children)은 스크롤 가능 영역이라 swipe 핸들러를 본문에 부착하면 스크롤이 막힘 → 헤더만 활성.

import { Box, Drawer, Typography } from "@mui/material";
import { useRef } from "react";
import { palette, radius } from "@/lib/theme";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  height?: number | string;
}

const SNAP_TRANSITION = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  height = "auto",
}: Props) {
  // Drawer Paper element 참조 — swipe 중 transform 직접 조작.
  // 닫힐 때(Drawer 자체 transition) 와 충돌하지 않게 임시로 transition: none 했다가 복원.
  const paperRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const onDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    dragDelta.current = 0;
    if (paperRef.current) paperRef.current.style.transition = "none";
  };

  const onDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    const dy = clientY - dragStartY.current;
    // 위로 올리는 건 탄성 — 0.2 배율 (살짝 따라오기만)
    const delta = dy > 0 ? dy : dy * 0.2;
    dragDelta.current = delta;
    if (paperRef.current) {
      paperRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const onDragEnd = () => {
    if (dragStartY.current === null) return;
    // 임계값: 시트 높이의 25% 또는 100px 중 작은 값.
    const paperH = paperRef.current?.offsetHeight ?? 0;
    const threshold = Math.min(100, paperH * 0.25);
    const shouldClose = dragDelta.current > threshold;
    if (paperRef.current) {
      paperRef.current.style.transition = SNAP_TRANSITION;
      if (shouldClose) {
        // 닫힘 방향으로 finish — 시트 전체 높이만큼 내려간 후 onClose 호출.
        // 그래야 Drawer 의 close transition 과 자연스럽게 이어짐.
        paperRef.current.style.transform = `translateY(${paperH}px)`;
        const paper = paperRef.current;
        const cleanup = () => {
          if (paper) {
            paper.style.transition = "";
            paper.style.transform = "";
          }
          onClose();
        };
        // transitionend 이벤트가 호환성 이슈 있어 setTimeout 폴백
        setTimeout(cleanup, 220);
      } else {
        // 원위치로 spring back
        paperRef.current.style.transform = "";
      }
    }
    dragStartY.current = null;
    dragDelta.current = 0;
  };

  // 헤더(grabber + title) 영역 — touch / pointer 양쪽 모두 핸들.
  // pointerEvent 는 데스크톱 마우스 드래그까지 같이 잡음 — 데모용으로도 자연스러움.
  const dragHandlers = {
    onTouchStart: (e: React.TouchEvent) => onDragStart(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => onDragMove(e.touches[0].clientY),
    onTouchEnd: onDragEnd,
    onTouchCancel: onDragEnd,
    // pointer 는 보조 — capture 해서 손가락이 본문 영역으로 빠져도 추적 가능.
    onPointerDown: (e: React.PointerEvent) => {
      // touch 이벤트가 동시에 발생하면 중복 처리 회피
      if (e.pointerType === "touch") return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onDragStart(e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (dragStartY.current === null) return;
      onDragMove(e.clientY);
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      onDragEnd();
    },
    onPointerCancel: () => onDragEnd(),
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        ref: paperRef,
        sx: {
          maxWidth: 420,
          mx: "auto",
          borderTopLeftRadius: `${radius.xl}px`,
          borderTopRightRadius: `${radius.xl}px`,
          background: palette.surface,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -10px 40px rgba(26,38,32,0.20)",
          // touch action: pan-y 만 허용 — 헤더 영역의 가로 스와이프(브라우저 뒤로가기 등) 회피
          touchAction: "pan-y",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", md: 420 },
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(26, 38, 32, 0.45)",
          backdropFilter: "blur(2px)",
        },
      }}
    >
      {/* swipe 가능 영역 — grabber + (있으면) title.
          본문 children 은 자체 스크롤 영역이라 핸들러를 부착하면 스크롤이 막힘. */}
      <Box {...dragHandlers} sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}>
        {/* 시트 상단의 작은 손잡이(grabber) — 드래그할 수 있다는 시각적 힌트 */}
        <Box sx={{ display: "grid", placeItems: "center", pt: 1.25, pb: 0.5 }}>
          <Box
            sx={{
              width: 44,
              height: 4,
              borderRadius: 999,
              background: palette.line,
            }}
          />
        </Box>
        {title && (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.025em",
              }}
            >
              {title}
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2.5,
          pb: 2,
          height,
        }}
      >
        {children}
      </Box>
      {footer && (
        <Box
          sx={{
            borderTop: `1px solid ${palette.lineSoft}`,
            px: 1.75,
            pt: 1.75,
            pb: "calc(14px + env(safe-area-inset-bottom))",
            background: palette.surface,
          }}
        >
          {footer}
        </Box>
      )}
    </Drawer>
  );
}
