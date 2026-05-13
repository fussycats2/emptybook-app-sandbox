"use client";

// 내 책장에 책 추가 (/mypage/shelf/add)
// - 네이버 검색 또는 ISBN 바코드 스캔으로 책 메타데이터 가져옴
// - 초기 상태(읽는 중/완독/판매예정/소장) 선택해서 책장에 추가
// - 추가 후 /mypage/shelf 로 복귀

import {
  Box,
  Button,
  Chip,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import { useToast } from "@/components/ui/ToastProvider";
import { palette, radius } from "@/lib/theme";
import { useNaverBookSearch } from "@/lib/query/naverBookHooks";
import { useAddShelfItem } from "@/lib/query/shelfHooks";
import { inferCategory } from "@/lib/categoryMap";
import {
  SHELF_STATUS_LABEL,
  type ShelfStatus,
} from "@/lib/supabase/types";
import type { BookSearchItem } from "@/app/api/books/search/route";

const STATUS_ORDER: ShelfStatus[] = ["READING", "FINISHED", "FOR_SALE", "OWNED"];

export default function ShelfAddPage() {
  const router = useRouter();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchItem[] | null>(null);
  const [picked, setPicked] = useState<BookSearchItem | null>(null);
  const [status, setStatus] = useState<ShelfStatus>("OWNED");
  const [scannerOpen, setScannerOpen] = useState(false);

  const naverSearch = useNaverBookSearch();
  const addMut = useAddShelfItem();
  const searching = naverSearch.isPending;

  const runSearch = async (override?: string) => {
    const q = (override ?? query).trim();
    if (!q) {
      toast?.show("검색어를 입력해주세요", "warning");
      return;
    }
    if (searching) return;
    setResults(null);
    setPicked(null);
    if (override) setQuery(override);
    try {
      const items = (await naverSearch.mutateAsync(q)) as BookSearchItem[];
      if (items.length === 0) {
        toast?.show("검색 결과가 없어요");
      } else if (items.length === 1) {
        setPicked(items[0]);
      } else {
        setResults(items);
      }
    } catch {
      toast?.show("검색에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  const handleScanned = (isbn: string) => {
    setScannerOpen(false);
    toast?.show("바코드를 인식했어요");
    void runSearch(isbn);
  };

  const handleAdd = async () => {
    if (!picked) return;
    if (addMut.isPending) return;
    try {
      const result = await addMut.mutateAsync({
        title: picked.title,
        author: picked.author || undefined,
        publisher: picked.publisher || undefined,
        isbn: picked.isbn || undefined,
        category: inferCategory(`${picked.title} ${picked.description}`),
        coverUrl: picked.image || undefined,
        status,
      });
      if (!result.ok) {
        toast?.show("추가에 실패했어요", "error");
        return;
      }
      if (result.duplicate) {
        toast?.show("이미 책장에 있는 책이에요");
      } else {
        toast?.show(`${SHELF_STATUS_LABEL[status]} 책장에 추가했어요`);
      }
      // replace — 책장에서 뒤로가기 누르면 add 페이지로 다시 떨어지던 어색함 제거.
      // 책 추가는 끝났으니 stack 에서 add 폼을 빼고 책장 화면이 종착점이 되게.
      router.replace("/mypage/shelf");
    } catch {
      toast?.show("추가에 실패했어요", "error");
    }
  };

  return (
    <>
      <AppHeader title="책장에 책 추가" left="back" homeButton />

      <ScrollBody>
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: palette.inkSubtle,
              mb: 1,
            }}
          >
            책 찾기
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<QrCodeScannerRoundedIcon />}
            onClick={() => setScannerOpen(true)}
            sx={{
              mb: 1.25,
              borderStyle: "dashed",
              borderWidth: 1.5,
              borderColor: palette.primary,
              color: palette.primary,
              background: palette.primaryTint,
              "&:hover": {
                borderStyle: "dashed",
                borderWidth: 1.5,
                background: palette.primarySoft,
              },
            }}
          >
            바코드로 찾기
          </Button>

          {/* 입력 + 검색 버튼 분리 — endAdornment 에 박으면 좁은 화면에서 결과 입력 영역이 가려짐.
              /register 와 동일 패턴. */}
          <Stack direction="row" gap={1} alignItems="stretch">
            <OutlinedInput
              fullWidth
              placeholder="ISBN 또는 책 제목으로 검색"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (picked) setPicked(null);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                runSearch();
              }}
              startAdornment={
                <SearchRoundedIcon sx={{ color: palette.inkSubtle, mr: 1 }} />
              }
              sx={{ flex: 1, height: 48 }}
            />
            <Button
              onClick={() => runSearch()}
              disabled={searching}
              sx={{
                flexShrink: 0,
                minWidth: 88,
                px: 2,
                whiteSpace: "nowrap",
              }}
            >
              {searching ? "검색 중…" : "검색"}
            </Button>
          </Stack>

          {/* 단건 결과 / 사용자가 고른 항목 — 큰 카드로 강조 */}
          {picked && (
            <Box
              sx={{
                mt: 1.5,
                border: `1px solid ${palette.primary}`,
                background: palette.primarySoft,
                borderRadius: `${radius.md}px`,
                p: 1.75,
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                boxShadow: `0 0 0 4px ${palette.primaryGlow}`,
              }}
            >
              <BookImage
                seed={picked.isbn || picked.title}
                src={picked.image || undefined}
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
                  {picked.title}
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
                  {[picked.author, picked.publisher, picked.isbn]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setPicked(null)}>
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          )}

          {results && results.length > 0 && (
            <Stack
              gap={0.75}
              sx={{
                mt: 1.5,
                maxHeight: 360,
                overflowY: "auto",
                border: `1px solid ${palette.line}`,
                borderRadius: `${radius.md}px`,
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
                  onClick={() => {
                    setPicked(it);
                    setResults(null);
                  }}
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

        <Box sx={{ p: 2, pt: 0 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: palette.inkSubtle,
              mb: 1,
            }}
          >
            어떤 상태로 추가할까요?
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0.75,
            }}
          >
            {STATUS_ORDER.map((s) => {
              const on = status === s;
              return (
                <Box
                  key={s}
                  onClick={() => setStatus(s)}
                  sx={{
                    p: "14px 16px",
                    borderRadius: `${radius.sm}px`,
                    border: `1.5px solid ${on ? palette.primary : palette.lineSoft}`,
                    background: on ? palette.primaryTint : palette.surface,
                    color: on ? palette.primary : palette.ink,
                    fontWeight: on ? 800 : 700,
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 140ms ease",
                    boxShadow: on ? `0 0 0 4px ${palette.primaryGlow}` : "none",
                    "&:hover": on
                      ? undefined
                      : { borderColor: palette.line, background: palette.surfaceAlt },
                    "&:active": { transform: "scale(0.98)" },
                  }}
                >
                  {SHELF_STATUS_LABEL[s]}
                </Box>
              );
            })}
          </Box>
          <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 1 }}>
            상태는 책장에서 언제든 바꿀 수 있어요.
          </Typography>
        </Box>
      </ScrollBody>

      <FixedFooter>
        <Button
          fullWidth
          onClick={handleAdd}
          disabled={!picked || addMut.isPending}
        >
          {addMut.isPending ? "추가하는 중…" : "책장에 추가"}
        </Button>
      </FixedFooter>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScanned}
      />
    </>
  );
}
