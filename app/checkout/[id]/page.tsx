"use client";

import {
  Box,
  Button,
  Checkbox,
  Divider,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import { createOrder, fetchBook, type BookDetail } from "@/lib/repo";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";

const PAYMENTS: {
  key: string;
  label: string;
  bg?: string;
  fg?: string;
  recommended?: boolean;
}[] = [
  {
    key: "kakao",
    label: "카카오페이",
    bg: "#FEE500",
    fg: "#3C1E1E",
    recommended: true,
  },
  { key: "card", label: "신용 / 체크카드" },
  { key: "bank", label: "계좌이체" },
  { key: "naver", label: "네이버페이" },
];

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [pay, setPay] = useState("kakao");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBook(params.id).then(setBook);
  }, [params.id]);

  const goods = useMemo(() => book?.priceNumber ?? 0, [book]);
  const ship = book?.free ? 0 : 3000;
  const coupon = book?.free ? 0 : 1000;
  const total = Math.max(0, goods + ship - coupon);

  if (!book) {
    return (
      <>
        <AppHeader title="결제" left="back" />
        <Box sx={{ flex: 1, display: "grid", placeItems: "center", color: palette.inkSubtle }}>
          불러오는 중…
        </Box>
      </>
    );
  }

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { id } = await createOrder({ bookId: book.id });
      toast?.show(book.free ? "신청이 완료되었어요" : "결제가 완료되었어요");
      router.push(`/checkout/${book.id}/complete?orderId=${id}`);
    } catch (e) {
      toast?.show("결제 처리에 실패했어요", "error");
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title="결제" left="back" />
      <ScrollBody>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            p: 2,
            background: palette.surface,
            borderBottom: `8px solid ${palette.bg}`,
          }}
        >
          <BookImage seed={book.id} width={68} height={88} radius={10} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              {book.title}
            </Typography>
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
              판매자 {book.seller ?? "책방마니아"} · 상태 {book.state}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.5 }}>
              {book.price}
            </Typography>
          </Box>
        </Box>

        <Section
          title="배송지"
          right={
            <Button
              size="small"
              variant="text"
              startIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ minWidth: 0, color: palette.primary }}
              onClick={() => toast?.show("배송지 변경은 준비 중이에요")}
            >
              변경
            </Button>
          }
        >
          <Box
            sx={{
              border: `1px solid ${palette.line}`,
              borderRadius: 3,
              p: 1.5,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800 }}>홍길동</Typography>
              <Box
                sx={{
                  fontSize: 10.5,
                  background: palette.primarySoft,
                  color: palette.primary,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                기본 배송지
              </Box>
            </Stack>
            <Typography
              sx={{
                fontSize: 13,
                color: palette.inkMute,
                mt: 0.75,
                lineHeight: 1.55,
              }}
            >
              서울시 마포구 합정동 123-45 홍성빌딩 201호
              <br />
              010-1234-5678
            </Typography>
          </Box>
        </Section>

        <Section title="결제 수단">
          <Stack gap={1}>
            {PAYMENTS.map((p) => {
              const on = pay === p.key;
              const isKakao = p.key === "kakao";
              return (
                <Box
                  key={p.key}
                  onClick={() => setPay(p.key)}
                  sx={{
                    border: `1.5px solid ${
                      on ? palette.primary : palette.line
                    }`,
                    borderRadius: 3,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    cursor: "pointer",
                    background: on ? palette.primarySoft : palette.surface,
                  }}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${on ? palette.primary : palette.line}`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {on && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: palette.primary,
                        }}
                      />
                    )}
                  </Box>
                  {isKakao && (
                    <Box
                      sx={{
                        width: 36,
                        height: 24,
                        borderRadius: 1,
                        background: p.bg,
                        color: p.fg,
                        fontSize: 11,
                        fontWeight: 800,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      Pay
                    </Box>
                  )}
                  <Typography sx={{ flex: 1, fontWeight: 700 }}>
                    {p.label}
                  </Typography>
                  {p.recommended && (
                    <Box
                      sx={{
                        background: palette.accent,
                        color: "#fff",
                        fontSize: 10.5,
                        fontWeight: 800,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 999,
                      }}
                    >
                      추천
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Section>

        <Section title="쿠폰 / 포인트">
          <Stack direction="row" gap={1}>
            <OutlinedInput
              placeholder="신규가입 1,000원 쿠폰"
              sx={{ flex: 1 }}
              defaultValue="신규가입 1,000원"
              readOnly
            />
            <Button variant="outlined" sx={{ minWidth: 70 }}>
              변경
            </Button>
          </Stack>
        </Section>

        <Section title="결제 금액">
          <Box
            sx={{
              border: `1px solid ${palette.line}`,
              borderRadius: 3,
              p: 1.5,
            }}
          >
            <Row label="상품 금액" value={goods.toLocaleString() + "원"} />
            <Row label="배송비" value={ship.toLocaleString() + "원"} />
            <Row
              label="쿠폰 할인"
              value={`-${coupon.toLocaleString()}원`}
              accent
            />
            <Divider sx={{ my: 1 }} />
            <Row
              label="총 결제 금액"
              value={total.toLocaleString() + "원"}
              big
            />
          </Box>
        </Section>

        <Box sx={{ px: 2, pb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              background: palette.lineSoft,
              borderRadius: 2,
              p: 1,
              cursor: "pointer",
            }}
            onClick={() => setAgreed((a) => !a)}
          >
            <Checkbox
              checked={agreed}
              icon={<CheckRoundedIcon sx={{ color: palette.inkSubtle }} />}
              checkedIcon={<CheckRoundedIcon sx={{ color: palette.primary }} />}
              sx={{ p: 0.5, mr: 0.5 }}
            />
            <Typography sx={{ fontSize: 12.5, color: palette.inkMute }}>
              결제 진행 및 개인정보 제3자 제공에 동의합니다.
            </Typography>
          </Stack>
        </Box>
      </ScrollBody>
      <FixedFooter>
        <Button
          fullWidth
          disabled={!agreed || submitting}
          onClick={submit}
          sx={{
            ...(pay === "kakao" && {
              background: "#FEE500",
              color: "#3C1E1E",
              "&:hover": { background: "#FFE000" },
            }),
          }}
        >
          {book.free
            ? "무료나눔 신청하기"
            : `${total.toLocaleString()}원 결제하기`}
        </Button>
      </FixedFooter>
    </>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        background: palette.surface,
        p: 2,
        borderBottom: `8px solid ${palette.bg}`,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
          {title}
        </Typography>
        {right}
      </Stack>
      {children}
    </Box>
  );
}

function Row({
  label,
  value,
  big,
  accent,
}: {
  label: string;
  value: string;
  big?: boolean;
  accent?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography
        sx={{
          fontSize: big ? 14 : 13,
          color: big ? palette.ink : palette.inkMute,
          fontWeight: big ? 800 : 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: big ? 17 : 13,
          fontWeight: 800,
          color: accent ? palette.accent : palette.ink,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
