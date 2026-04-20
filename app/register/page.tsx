"use client";

import {
  Box,
  Button,
  Chip,
  IconButton,
  OutlinedInput,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { createBook } from "@/lib/repo";

const STATES = [
  { key: "최상", label: "최상", desc: "거의 새책" },
  { key: "상", label: "상", desc: "사용감 적음" },
  { key: "중", label: "중", desc: "사용감 보통" },
  { key: "하", label: "하", desc: "사용감 많음" },
] as const;
const TRADE = [
  { key: "DIRECT", label: "직거래" },
  { key: "PARCEL", label: "택배" },
  { key: "BOTH", label: "둘 다" },
];

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [photos, setPhotos] = useState<number[]>([0, 1]);
  const [state, setState] = useState<"최상" | "상" | "중" | "하">("상");
  const [trade, setTrade] = useState("DIRECT");
  const [free, setFree] = useState(false);
  const [price, setPrice] = useState("6000");
  const [bookFound, setBookFound] = useState(false);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      toast?.show("도서 제목을 입력해주세요", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const priceNumber = free ? 0 : parseInt(price || "0", 10) || 0;
      const { id } = await createBook({
        title: title.trim(),
        author: bookFound ? "한강" : undefined,
        publisher: bookFound ? "창비" : undefined,
        isbn: bookFound ? "9788936434267" : undefined,
        category: "소설",
        state,
        priceNumber,
        free,
        region: region.trim() || "마포구",
        description: description.trim() || undefined,
        comment: description.trim() || undefined,
        tradeMethod:
          trade === "DIRECT"
            ? "직거래"
            : trade === "PARCEL"
            ? "택배"
            : "직거래, 택배 가능",
      });
      toast?.show("등록되었어요!");
      router.push(`/register/complete?id=${id}`);
    } catch (e) {
      toast?.show("등록에 실패했어요. 다시 시도해주세요.", "error");
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader
        title="도서 등록"
        left="close"
        right={
          <Button
            variant="text"
            sx={{ minWidth: 0, color: palette.inkMute, fontSize: 13 }}
            onClick={() => toast?.show("임시저장했어요")}
          >
            임시저장
          </Button>
        }
      />
      <ScrollBody>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
            사진{" "}
            <span style={{ color: palette.inkSubtle }}>{photos.length}/10</span>
          </Typography>
          <Box
            className="no-scrollbar"
            sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}
          >
            <Box
              onClick={() => setPhotos((p) => [...p, p.length])}
              sx={{
                flexShrink: 0,
                width: 92,
                height: 92,
                border: `1.5px dashed ${palette.line}`,
                borderRadius: 2.5,
                background: palette.lineSoft,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: palette.inkMute,
              }}
            >
              <Stack alignItems="center" gap={0.25}>
                <AddPhotoAlternateRoundedIcon />
                <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                  {photos.length} / 10
                </Typography>
              </Stack>
            </Box>
            {photos.map((p, i) => (
              <Box key={i} sx={{ position: "relative", flexShrink: 0 }}>
                <BookImage
                  seed={`reg-${i}`}
                  width={92}
                  height={92}
                  radius={12}
                />
                {i === 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 4,
                      left: 4,
                      background: palette.primary,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 999,
                      px: 0.75,
                      py: 0.25,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                    }}
                  >
                    <StarRoundedIcon sx={{ fontSize: 11 }} /> 대표
                  </Box>
                )}
                <IconButton
                  size="small"
                  onClick={() =>
                    setPhotos((arr) => arr.filter((_, j) => j !== i))
                  }
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    background: palette.ink,
                    color: "#fff",
                    "&:hover": { background: palette.ink },
                  }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
            도서 검색
          </Typography>
          <OutlinedInput
            fullWidth
            placeholder="ISBN 또는 책 제목으로 검색"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            startAdornment={
              <SearchRoundedIcon sx={{ color: palette.inkSubtle, mr: 1 }} />
            }
            endAdornment={
              <Button
                size="small"
                onClick={() => {
                  if (!title.trim()) {
                    toast?.show("검색어를 입력해주세요", "warning");
                    return;
                  }
                  setBookFound(true);
                }}
                sx={{ minWidth: 60 }}
              >
                검색
              </Button>
            }
          />
          {bookFound && (
            <Box
              sx={{
                mt: 1.5,
                border: `1px solid ${palette.primary}`,
                background: palette.primarySoft,
                borderRadius: 3,
                p: 1.5,
                display: "flex",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <BookImage seed="reg-found" width={56} height={72} radius={8} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
                  채식주의자
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: palette.inkMute }}>
                  한강 · 창비 · 9788936434267
                </Typography>
                <Typography
                  sx={{ fontSize: 11.5, color: palette.inkMute, mt: 0.25 }}
                >
                  정가 13,000원
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                sx={{ background: "#fff" }}
                onClick={() => toast?.show("도서 정보를 가져왔어요")}
              >
                이 책 맞아요
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              판매 가격
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Typography sx={{ fontSize: 12.5, color: palette.inkMute }}>
                무료나눔으로 등록
              </Typography>
              <Switch
                checked={free}
                onChange={(_, v) => {
                  setFree(v);
                  if (v) setPrice("0");
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <OutlinedInput
              fullWidth
              placeholder="0"
              type="number"
              disabled={free}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              endAdornment={
                <Typography sx={{ fontSize: 14, fontWeight: 700, mr: 1 }}>
                  원
                </Typography>
              }
            />
          </Stack>
          {free && (
            <Box
              sx={{
                mt: 1,
                background: "#FCE8E5",
                color: palette.accent,
                borderRadius: 999,
                px: 1.5,
                py: 0.75,
                display: "inline-flex",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              💝 무료나눔으로 등록되어요
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
            도서 상태
          </Typography>
          <Stack direction="row" gap={1}>
            {STATES.map((s) => {
              const on = state === s.key;
              return (
                <Box
                  key={s.key}
                  onClick={() => setState(s.key as typeof state)}
                  sx={{
                    flex: 1,
                    border: `1.5px solid ${on ? palette.primary : palette.line}`,
                    background: on ? palette.primarySoft : palette.surface,
                    borderRadius: 2,
                    py: 1,
                    px: 0.75,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: on ? palette.primary : palette.ink,
                    }}
                  >
                    {s.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: palette.inkSubtle,
                      mt: 0.25,
                    }}
                  >
                    {s.desc}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
            거래 방식
          </Typography>
          <Stack direction="row" gap={1}>
            {TRADE.map((t) => {
              const on = trade === t.key;
              return (
                <Chip
                  key={t.key}
                  label={t.label}
                  onClick={() => setTrade(t.key)}
                  sx={{
                    flex: 1,
                    height: 40,
                    fontSize: 13,
                    ...(on && { background: palette.primary, color: "#fff" }),
                  }}
                  variant={on ? "filled" : "outlined"}
                />
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
            거래 지역
          </Typography>
          <OutlinedInput
            fullWidth
            placeholder="동/구 선택 (예: 마포구)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </Box>

        <Box sx={{ p: 2, pb: 3 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
            상세 설명
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={5}
            placeholder="책 상태, 거래 시 참고사항 등을 자유롭게 적어주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
      </ScrollBody>
      <FixedFooter>
        <Button fullWidth onClick={submit} disabled={submitting}>
          {free ? "무료나눔 등록하기" : "판매 등록하기"}
        </Button>
      </FixedFooter>
    </>
  );
}
