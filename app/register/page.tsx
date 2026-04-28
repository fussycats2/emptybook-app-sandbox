"use client";

// 도서 등록 페이지 (/register)
// - 사진(최대 10장) / 도서 검색 / 가격 / 상태 / 거래 방식 / 지역 / 설명 입력
// - 도서 검색: /api/books/search 로 네이버 API 호출 → 결과 선택 시 폼 자동 채움
// - 등록 성공 시 /register/complete?id=... 로 이동
// TODO: 사진은 현재 클라이언트 상태만 보유. Storage 업로드 + book_images insert 연결 필요

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
import { createBook, meta } from "@/lib/repo";
import { inferCategory } from "@/lib/categoryMap";
import type { BookSearchItem } from "@/app/api/books/search/route";

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
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 카테고리 — 검색 결과 선택 시 inferCategory 로 자동 추정, 사용자가 chip 으로 직접 변경 가능
  const [category, setCategory] = useState<string>("소설");
  // 도서 검색 결과 + 선택된 항목
  // - results 가 채워지면 검색결과 리스트를 표시 (다수 매칭 시)
  // - selected 가 있으면 매칭된 도서 카드 표시 (단일 결과 / 사용자 선택 후)
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BookSearchItem[] | null>(null);
  const [selected, setSelected] = useState<BookSearchItem | null>(null);

  // 검색 실행 — 결과 1건이면 자동 선택, 다건이면 리스트 표시
  const handleSearch = async () => {
    const q = title.trim();
    if (!q) {
      toast?.show("검색어를 입력해주세요", "warning");
      return;
    }
    if (searching) return;
    setSearching(true);
    setResults(null);
    setSelected(null);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { items?: BookSearchItem[] };
      const items = data.items ?? [];
      if (items.length === 0) {
        toast?.show("검색 결과가 없어요");
      } else if (items.length === 1) {
        // 1건 매칭(주로 ISBN 검색): 바로 선택 + 제목도 정확한 값으로 교체
        setSelected(items[0]);
        setTitle(items[0].title);
        // 제목 + 설명 텍스트로 카테고리 자동 추정
        setCategory(inferCategory(`${items[0].title} ${items[0].description}`));
        toast?.show("도서 정보를 가져왔어요");
      } else {
        setResults(items);
      }
    } catch {
      toast?.show("검색에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setSearching(false);
    }
  };

  // 검색 결과 중 한 건 선택 — 폼에 반영
  const handlePick = (item: BookSearchItem) => {
    setSelected(item);
    setTitle(item.title);
    setCategory(inferCategory(`${item.title} ${item.description}`));
    setResults(null);
    toast?.show("도서 정보를 가져왔어요");
  };

  // 폼 검증 후 createBook 호출 → 성공 시 완료 페이지로 이동
  const submit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      toast?.show("도서 제목을 입력해주세요", "warning");
      return;
    }
    setSubmitting(true);
    try {
      // 무료나눔이면 가격 0, 아니면 입력값을 숫자로 변환 (입력이 비어있으면 0)
      const priceNumber = free ? 0 : parseInt(price || "0", 10) || 0;
      const { id } = await createBook({
        title: title.trim(),
        // 검색으로 선택한 도서가 있으면 그 정보를, 없으면 빈 값으로 등록
        author: selected?.author || undefined,
        publisher: selected?.publisher || undefined,
        isbn: selected?.isbn || undefined,
        coverUrl: selected?.image || undefined,
        category,
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
            <Box
              component="span"
              sx={{
                color: photos.length >= 10 ? palette.accent : palette.inkSubtle,
                fontWeight: 600,
                ml: 0.25,
              }}
            >
              {photos.length}
              <Box component="span" sx={{ color: palette.inkSubtle }}>
                /10
              </Box>
            </Box>
          </Typography>
          <Box
            className="no-scrollbar"
            sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}
          >
            {/* 사진 추가 박스 — 10장 한도 검사 후 placeholder 한 칸 추가 */}
            <Box
              onClick={() => {
                if (photos.length >= 10) {
                  toast?.show("사진은 최대 10장까지 등록할 수 있어요", "warning");
                  return;
                }
                setPhotos((p) => [...p, p.length]);
              }}
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
                opacity: photos.length >= 10 ? 0.5 : 1,
              }}
            >
              <Stack alignItems="center" gap={0.25}>
                <AddPhotoAlternateRoundedIcon />
                <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                  사진 추가
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
            onChange={(e) => {
              setTitle(e.target.value);
              // 사용자가 제목을 직접 수정하면 이전 선택은 더 이상 일치하지 않으므로 해제
              if (selected) setSelected(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            startAdornment={
              <SearchRoundedIcon sx={{ color: palette.inkSubtle, mr: 1 }} />
            }
            endAdornment={
              <Button
                size="small"
                onClick={handleSearch}
                disabled={searching}
                sx={{ minWidth: 60 }}
              >
                {searching ? "검색 중…" : "검색"}
              </Button>
            }
          />

          {/* 단일 결과(또는 사용자 선택 후): 매칭 카드 표시 */}
          {selected && (
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
              <BookImage
                seed={selected.isbn || selected.title}
                src={selected.image || undefined}
                width={56}
                height={72}
                radius={8}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {selected.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: palette.inkMute,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {[selected.author, selected.publisher, selected.isbn]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
                {selected.price > 0 && (
                  <Typography
                    sx={{ fontSize: 11.5, color: palette.inkMute, mt: 0.25 }}
                  >
                    정가 {selected.price.toLocaleString()}원
                  </Typography>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => setSelected(null)}
                aria-label="선택 해제"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          )}

          {/* 다수 결과: 클릭해서 선택할 수 있는 리스트 */}
          {results && results.length > 0 && (
            <Stack
              gap={0.75}
              sx={{
                mt: 1.5,
                maxHeight: 320,
                overflowY: "auto",
                border: `1px solid ${palette.line}`,
                borderRadius: 3,
                p: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11.5,
                  color: palette.inkSubtle,
                  fontWeight: 700,
                  px: 0.5,
                }}
              >
                검색 결과 {results.length}건 — 한 권을 선택해주세요
              </Typography>
              {results.map((it) => (
                <Stack
                  key={it.isbn || `${it.title}-${it.author}`}
                  direction="row"
                  gap={1}
                  onClick={() => handlePick(it)}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    "&:hover": { background: palette.lineSoft },
                  }}
                >
                  <BookImage
                    seed={it.isbn || it.title}
                    src={it.image || undefined}
                    width={44}
                    height={56}
                    radius={6}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {it.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: palette.inkSubtle,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {[it.author, it.publisher].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
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
            카테고리
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {meta.CATEGORIES.map((c) => {
              const on = category === c.name;
              return (
                <Chip
                  key={c.name}
                  label={`${c.emoji} ${c.name}`}
                  onClick={() => setCategory(c.name)}
                  variant={on ? "filled" : "outlined"}
                  sx={{
                    height: 34,
                    fontSize: 12.5,
                    ...(on && { background: palette.primary, color: "#fff" }),
                  }}
                />
              );
            })}
          </Box>
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
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          />
          <Typography
            sx={{
              textAlign: "right",
              fontSize: 11,
              color: palette.inkSubtle,
              mt: 0.5,
            }}
          >
            {description.length}/500
          </Typography>
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
