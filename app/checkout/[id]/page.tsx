"use client";

// 결제 화면 (/checkout/[id])
// - 상품 요약 + 배송지 + 결제수단 + 쿠폰/포인트 + 결제 금액 + 약관 동의
// - "결제하기" 클릭 시 createOrder() 호출 → 완료 페이지로 이동
// - 무료나눔이면 결제수단/쿠폰 영역을 숨기고 신청 흐름으로 단순화
// FIXME: 실제 PG 연동 없음 — 버튼 누르면 그냥 트랜잭션을 PAID 로 기록하고 다음 화면으로 진행

import {
  Box,
  Button,
  Checkbox,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LocalActivityRoundedIcon from "@mui/icons-material/LocalActivityRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import BookImage from "@/components/ui/BookImage";
import BottomSheet from "@/components/ui/BottomSheet";
import { useBook } from "@/lib/query/bookHooks";
import { useCreateOrder } from "@/lib/query/orderHooks";
import { useMyCoupons } from "@/lib/query/couponHooks";
import { palette, radius } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import {
  calcCouponDiscount,
  formatCouponDiscount,
  type UserCoupon,
} from "@/lib/supabase/types";

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
  const { data: book } = useBook(params.id);
  const createOrderMutation = useCreateOrder();
  const { data: myCoupons } = useMyCoupons();
  const [pay, setPay] = useState("kakao");
  const [agreed, setAgreed] = useState(false);
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
  const [couponId, setCouponId] = useState<string | undefined>(undefined);
  const submitting = createOrderMutation.isPending;

  // 결제 금액 계산: 상품가 + 배송비 - 쿠폰 (음수가 되지 않도록 0으로 클램프)
  // 무료나눔은 배송비/쿠폰 모두 0
  const goods = useMemo(() => book?.priceNumber ?? 0, [book]);
  const ship = book?.free ? 0 : 3000;

  // 사용 가능 + 최소 주문 금액 충족 + 만료 안 됐는지 — 셋 다 만족하는 쿠폰만 노출
  const usableCoupons = useMemo<UserCoupon[]>(() => {
    if (!myCoupons || book?.free) return [];
    return myCoupons.filter(
      (c) =>
        c.status === "AVAILABLE" &&
        goods >= c.minOrderAmount &&
        Date.parse(c.expiresAt) >= Date.now()
    );
  }, [myCoupons, book?.free, goods]);

  const selectedCoupon = useMemo(
    () => usableCoupons.find((c) => c.id === couponId),
    [usableCoupons, couponId]
  );

  // 쿠폰 적용 시 깎이는 금액 — types 의 calcCouponDiscount 가 책임
  // (FIXED 면 그대로, PERCENT 면 maxDiscount 상한)
  const couponDiscount = book?.free
    ? 0
    : selectedCoupon
    ? calcCouponDiscount(selectedCoupon, goods)
    : 0;
  const total = Math.max(0, goods + ship - couponDiscount);

  // 거래 불가 상태인 책은 결제로 진행 못 하게 — sold/canceled 일 때 버튼 비활성
  // (도서 상세에서 이미 막혀 있지만, 직접 URL 진입 / 캐시 갱신 늦은 경우의 안전망)
  const unavailableLabel =
    book?.status === "sold"
      ? "이미 거래된 책이에요"
      : book?.status === "canceled"
      ? "판매가 종료된 책이에요"
      : null;

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
    if (submitting || !book) return;
    try {
      const { id } = await createOrderMutation.mutateAsync({
        bookId: book.id,
        userCouponId: selectedCoupon?.id,
      });
      toast?.show(book.free ? "신청이 완료되었어요" : "결제가 완료되었어요");
      // replace 로 stack 에서 결제 폼을 제거 — 완료 페이지에서 뒤로 가면 결제 폼으로
      // 다시 떨어지던 어색함 제거. 사용자는 완료 페이지의 CTA(주문내역/홈/채팅)로만 진행.
      router.replace(`/checkout/${book.id}/complete?orderId=${id}`);
    } catch (e) {
      toast?.show("결제 처리에 실패했어요", "error");
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
            alignItems: "center",
          }}
        >
          <BookImage seed={book.id} src={book.coverUrl} width={72} height={92} radius={12} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14.5,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {book.title}
            </Typography>
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle, mt: 0.25 }}>
              판매자 {book.seller ?? "책방마니아"} · 상태 {book.state}
            </Typography>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                mt: 0.6,
              }}
            >
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

        {!book.free && (
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
                      on ? palette.primary : palette.lineSoft
                    }`,
                    borderRadius: 3,
                    p: 1.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    cursor: "pointer",
                    background: on ? palette.primaryTint : palette.surface,
                    transition: "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
                    boxShadow: on ? `0 0 0 4px ${palette.primaryGlow}` : "none",
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
        )}

        {!book.free && (
        <Section title="쿠폰 / 포인트">
          <Box
            onClick={() => setCouponSheetOpen(true)}
            sx={{
              border: `1.5px solid ${
                selectedCoupon ? palette.primary : palette.lineSoft
              }`,
              background: selectedCoupon ? palette.primaryTint : palette.surface,
              borderRadius: `${radius.md}px`,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              cursor: "pointer",
              transition: "all 140ms ease",
              "&:hover": { borderColor: palette.primary },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: selectedCoupon ? palette.primary : palette.lineSoft,
                color: selectedCoupon ? "#fff" : palette.inkSubtle,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <LocalActivityRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {selectedCoupon ? (
                <>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: palette.primary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedCoupon.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: palette.inkMute, mt: 0.25 }}>
                    {couponDiscount.toLocaleString()}원 할인 적용 중
                  </Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                    {usableCoupons.length > 0
                      ? `사용 가능한 쿠폰 ${usableCoupons.length}장`
                      : "사용 가능한 쿠폰이 없어요"}
                  </Typography>
                  {usableCoupons.length > 0 && (
                    <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle, mt: 0.25 }}>
                      쿠폰을 선택해 결제 금액을 줄일 수 있어요
                    </Typography>
                  )}
                </>
              )}
            </Box>
            <KeyboardArrowRightRoundedIcon sx={{ color: palette.inkSubtle }} />
          </Box>
        </Section>
        )}

        <Section title={book.free ? "신청 정보" : "결제 금액"}>
          <Box
            sx={{
              border: `1px solid ${palette.line}`,
              borderRadius: 3,
              p: 1.5,
            }}
          >
            {book.free ? (
              <Typography sx={{ fontSize: 13, color: palette.inkMute, lineHeight: 1.6 }}>
                무료나눔은 결제 없이 판매자 승인 후 진행돼요. 선택하신 배송지로
                안내될 예정이에요.
              </Typography>
            ) : (
              <>
                <Row label="상품 금액" value={goods.toLocaleString() + "원"} />
                <Row label="배송비" value={ship.toLocaleString() + "원"} />
                <Row
                  label="쿠폰 할인"
                  value={
                    couponDiscount > 0
                      ? `-${couponDiscount.toLocaleString()}원`
                      : "0원"
                  }
                  accent={couponDiscount > 0}
                />
                <Divider sx={{ my: 1 }} />
                <Row
                  label="총 결제 금액"
                  value={total.toLocaleString() + "원"}
                  big
                />
              </>
            )}
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
          size="large"
          disabled={!agreed || submitting || !!unavailableLabel}
          onClick={submit}
          sx={{
            fontSize: 15.5,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            ...(pay === "kakao" &&
              !unavailableLabel && {
                background: "#FEE500",
                color: "#3C1E1E",
                boxShadow: "0 8px 22px rgba(254, 229, 0, 0.42)",
                "&:hover": {
                  background: "#FFE000",
                  boxShadow: "0 8px 22px rgba(254, 229, 0, 0.55)",
                },
              }),
          }}
        >
          {unavailableLabel
            ? unavailableLabel
            : book.free
            ? "무료나눔 신청하기"
            : `${total.toLocaleString()}원 결제하기`}
        </Button>
      </FixedFooter>

      <BottomSheet
        open={couponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        title="쿠폰 선택"
      >
        <Stack gap={1} sx={{ p: 2, pb: 0 }}>
          {/* "쿠폰 사용 안 함" 옵션 — 적용 해제 */}
          <CouponPickRow
            selected={!couponId}
            label="쿠폰 사용 안 함"
            onClick={() => {
              setCouponId(undefined);
              setCouponSheetOpen(false);
            }}
          />
          {usableCoupons.length === 0 && (
            <Typography
              sx={{
                fontSize: 12.5,
                color: palette.inkSubtle,
                textAlign: "center",
                py: 3,
              }}
            >
              이 결제에 사용할 수 있는 쿠폰이 없어요
            </Typography>
          )}
          {usableCoupons.map((c) => {
            const discount = calcCouponDiscount(c, goods);
            return (
              <CouponPickRow
                key={c.id}
                selected={couponId === c.id}
                label={c.name}
                sub={`${formatCouponDiscount(c)} · ${discount.toLocaleString()}원 할인`}
                onClick={() => {
                  setCouponId(c.id);
                  setCouponSheetOpen(false);
                }}
              />
            );
          })}
        </Stack>
        <Box sx={{ p: 2, pt: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setCouponSheetOpen(false)}
          >
            닫기
          </Button>
        </Box>
      </BottomSheet>
    </>
  );
}

// 쿠폰 선택 시트의 한 행 — 선택 / 미선택 톤만 다른 가벼운 카드
function CouponPickRow({
  selected,
  label,
  sub,
  onClick,
}: {
  selected: boolean;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: "12px 14px",
        borderRadius: `${radius.sm}px`,
        border: `1.5px solid ${selected ? palette.primary : palette.lineSoft}`,
        background: selected ? palette.primaryTint : palette.surface,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        transition: "all 140ms ease",
        "&:active": { transform: "scale(0.99)" },
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${selected ? palette.primary : palette.line}`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
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
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 700,
            color: selected ? palette.primary : palette.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11.5, color: palette.inkMute, mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// 결제 화면 안에서만 쓰는 섹션 래퍼 (제목 + 우측 액션 + 본문)
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

// 결제 금액 영역의 라벨/금액 한 줄 — big=총합, accent=할인 강조
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
