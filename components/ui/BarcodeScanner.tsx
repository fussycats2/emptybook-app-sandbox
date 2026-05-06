"use client";

// ISBN 바코드 스캐너 — /register 폼에서 책 뒷면 EAN-13 / ISBN-10 바코드를 읽어
// 정규화된 ISBN-13 문자열을 onDetected 로 돌려준다.
// - @zxing/browser BrowserMultiFormatReader (EAN_13 / EAN_8 hint) 사용
// - 카메라 권한 거부 / getUserMedia 미지원 → 에러 화면 + "직접 입력" 폴백
// - 뒷면 카메라(facingMode: environment) 우선, 없으면 기본 카메라
// - 인식된 코드는 ISBN 체크섬 검증 후에만 onDetected 발사 (ISBN-10 은 13 으로 변환)

import {
  Box,
  Button,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardRoundedIcon from "@mui/icons-material/KeyboardRounded";
import { useEffect, useRef, useState } from "react";
import { palette, radius, shadow } from "@/lib/theme";
import { normalizeIsbn } from "@/lib/isbn";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (isbn13: string) => void;
}

type Phase = "idle" | "starting" | "scanning" | "denied" | "unsupported" | "manual";

export default function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // zxing IScannerControls — 마운트 사이클 외부에서 돌고 있어 ref 로 보관해 정리 시 호출
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  // 인식 직후부터 컴포넌트 close 까지 callback 중복 발사 방지
  const detectedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualInput, setManualInput] = useState("");

  // open 상태 토글에 맞춰 카메라 시작/정리
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    detectedRef.current = false;
    setPhase("starting");
    setErrorMsg("");
    setManualInput("");

    // SSR / 미지원 브라우저 가드
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      return;
    }

    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        // 동적 import — zxing 번들이 초기 페이지 로드에 포함되지 않게
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        if (cancelled) return;

        const hints = new Map();
        // 도서 바코드는 EAN-13. EAN-8 은 변형 도서 바코드(거의 없음) 백업
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
        ]);
        const reader = new BrowserMultiFormatReader(hints);

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current ?? undefined,
          (result) => {
            if (!result || detectedRef.current) return;
            const text = result.getText();
            const normalized = normalizeIsbn(text);
            if (!normalized) return; // 도서 prefix 아님 / 체크섬 불일치 → 계속 스캔
            detectedRef.current = true;
            // 햅틱 — 지원 환경에서만
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate(60);
              } catch {
                /* noop */
              }
            }
            controls.stop();
            controlsRef.current = null;
            onDetected(normalized);
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setPhase("scanning");
        cleanup = () => controls.stop();
      } catch (e: unknown) {
        if (cancelled) return;
        // DOMException name 로 권한 거부 vs 그 외 에러 분기
        const name = (e as { name?: string })?.name ?? "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setPhase("denied");
          setErrorMsg("카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setPhase("denied");
          setErrorMsg("카메라를 찾지 못했어요. 직접 입력해주세요.");
        } else {
          setPhase("denied");
          setErrorMsg("카메라를 시작하지 못했어요. 직접 입력해주세요.");
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [open, onDetected]);

  const submitManual = () => {
    const normalized = normalizeIsbn(manualInput);
    if (!normalized) {
      setErrorMsg("올바른 ISBN 형식이 아니에요 (10자리 또는 13자리)");
      return;
    }
    detectedRef.current = true;
    onDetected(normalized);
  };

  if (!open) return null;

  const showVideo = phase === "starting" || phase === "scanning";
  const showError = phase === "denied" || phase === "unsupported";
  const showManual = phase === "manual" || showError;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        // 데스크톱: 모바일 카드(420) 폭으로 한정
        maxWidth: { md: 420 },
        mx: { md: "auto" },
        background: "#0A1714",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 — 닫기 + 직접 입력 토글 */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1.25,
          pt: "max(env(safe-area-inset-top), 12px)",
          pb: 1,
          position: "relative",
          zIndex: 2,
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="닫기"
          sx={{
            color: "#fff",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
            "&:hover": { background: "rgba(255,255,255,0.16)" },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        <Typography sx={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>
          ISBN 바코드 스캔
        </Typography>
        <IconButton
          onClick={() => setPhase((p) => (p === "manual" ? "scanning" : "manual"))}
          aria-label="직접 입력"
          sx={{
            color: "#fff",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
            "&:hover": { background: "rgba(255,255,255,0.16)" },
          }}
        >
          <KeyboardRoundedIcon />
        </IconButton>
      </Stack>

      {/* 중앙 — 카메라 영역 또는 에러/수동입력 */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {showVideo && (
          <>
            {/* 카메라 미리보기 */}
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              muted
              playsInline
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: "#0A1714",
              }}
            />
            {/* 어둠 오버레이 + 사각 스캔 윈도우 */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 70% 32% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(86%, 340px)",
                aspectRatio: "16 / 7",
                borderRadius: `${radius.md}px`,
                border: `2px solid rgba(255,255,255,0.65)`,
                boxShadow:
                  "0 0 0 9999px rgba(10, 23, 20, 0.32), inset 0 0 24px rgba(255,255,255,0.12)",
                overflow: "hidden",
              }}
            >
              {/* 코너 가이드 */}
              {([
                { top: -2, left: -2, borderTop: 3, borderLeft: 3 },
                { top: -2, right: -2, borderTop: 3, borderRight: 3 },
                { bottom: -2, left: -2, borderBottom: 3, borderLeft: 3 },
                { bottom: -2, right: -2, borderBottom: 3, borderRight: 3 },
              ] as const).map((c, i) => (
                <Box
                  key={i}
                  sx={{
                    position: "absolute",
                    width: 22,
                    height: 22,
                    ...c,
                    borderColor: palette.accent,
                    borderStyle: "solid",
                  }}
                />
              ))}
              {/* 스캔 라인 애니메이션 */}
              <Box
                sx={{
                  position: "absolute",
                  left: "6%",
                  right: "6%",
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
                  filter: "blur(0.5px)",
                  animation: "scanLine 1.6s ease-in-out infinite",
                  "@keyframes scanLine": {
                    "0%": { top: "8%", opacity: 0.4 },
                    "50%": { top: "92%", opacity: 1 },
                    "100%": { top: "8%", opacity: 0.4 },
                  },
                }}
              />
            </Box>

            {/* 안내 카피 */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 24,
                textAlign: "center",
                px: 3,
              }}
            >
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95 }}>
                {phase === "starting"
                  ? "카메라 준비 중…"
                  : "책 뒷면 바코드를 사각형 안에 맞춰주세요"}
              </Typography>
              <Typography
                sx={{ fontSize: 11.5, opacity: 0.7, mt: 0.5 }}
              >
                ISBN-13 (978/979로 시작) 자동 인식
              </Typography>
            </Box>
          </>
        )}

        {showError && !showManual && (
          <Stack
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{ position: "absolute", inset: 0, p: 3, textAlign: "center" }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
              {phase === "unsupported"
                ? "이 브라우저는 카메라 스캔을 지원하지 않아요"
                : "카메라를 사용할 수 없어요"}
            </Typography>
            <Typography sx={{ fontSize: 12.5, opacity: 0.75 }}>
              {errorMsg || "직접 ISBN 을 입력하거나 검색을 사용해주세요."}
            </Typography>
          </Stack>
        )}
      </Box>

      {/* 하단 — 수동 입력 패널 (직접 입력 모드 또는 에러 시 노출) */}
      {showManual && (
        <Box
          className="safe-bottom"
          sx={{
            background: "rgba(10, 23, 20, 0.92)",
            backdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            p: 2,
          }}
        >
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1, opacity: 0.9 }}>
            ISBN 직접 입력
          </Typography>
          <Stack direction="row" gap={1}>
            <OutlinedInput
              fullWidth
              autoFocus
              placeholder="978..."
              inputMode="numeric"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                submitManual();
              }}
              sx={{
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.18)",
                },
                "& input": { color: "#fff" },
                "& input::placeholder": { color: "rgba(255,255,255,0.5)" },
              }}
            />
            <Button
              onClick={submitManual}
              sx={{ minWidth: 80, boxShadow: shadow.pop }}
            >
              검색
            </Button>
          </Stack>
          {errorMsg && phase === "manual" && (
            <Typography
              sx={{ fontSize: 11.5, color: palette.accent, mt: 0.75, fontWeight: 600 }}
            >
              {errorMsg}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
