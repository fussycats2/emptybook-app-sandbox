"use client";

// 쿠폰함 (/mypage/coupons)
// - 0017 마이그레이션 이후 user_coupons 에 시드/자동발급 데이터가 들어감
// - 사용 가능 / 사용 완료 / 만료 3탭 + 카드 리스트
// - 카드 디자인: 좌측 할인 금액(또는 %) + 우측 이름 / 설명 / 만료일 / 사용 조건
// - "쿠폰 사용" 은 결제 화면에서 — 여기서는 보유 현황만 보여줌

import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import LocalActivityRoundedIcon from "@mui/icons-material/LocalActivityRounded";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonBox } from "@/components/ui/Skeleton";
import { palette, radius } from "@/lib/theme";
import { useMyCoupons } from "@/lib/query/couponHooks";
import type {
  UserCoupon,
  UserCouponStatus,
} from "@/lib/supabase/types";

type TabKey = "AVAILABLE" | "USED" | "EXPIRED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "AVAILABLE", label: "사용 가능" },
  { key: "USED", label: "사용 완료" },
  { key: "EXPIRED", label: "기간 만료" },
];

// 만료일까지 남은 일수 — 음수가 되면 "만료" 처리 (status 와 별개로 표시용)
function daysUntil(iso: string): number {
  const ms = Date.parse(iso) - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function CouponsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("AVAILABLE");
  const { data, isLoading } = useMyCoupons();

  const grouped = useMemo(() => {
    const buckets: Record<UserCouponStatus, UserCoupon[]> = {
      AVAILABLE: [],
      USED: [],
      EXPIRED: [],
    };
    (data ?? []).forEach((c) => buckets[c.status].push(c));
    return buckets;
  }, [data]);

  const list = grouped[tab];

  return (
    <>
      <AppHeader title="쿠폰함" left="back" homeButton />
      <ScrollBody>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as TabKey)}
          variant="fullWidth"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            background: palette.surface,
            borderBottom: `1px solid ${palette.line}`,
          }}
        >
          {TABS.map((t) => {
            const count = grouped[t.key].length;
            return (
              <Tab
                key={t.key}
                value={t.key}
                label={
                  <Stack direction="row" gap={0.5} alignItems="baseline">
                    <span>{t.label}</span>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 11.5,
                        color: tab === t.key ? palette.primary : palette.inkSubtle,
                      }}
                    >
                      {count}
                    </Typography>
                  </Stack>
                }
                sx={{ fontWeight: 700, fontSize: 13.5 }}
              />
            );
          })}
        </Tabs>

        {isLoading ? (
          <Stack gap={1} sx={{ p: 2 }}>
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={i} height={96} radius={radius.md} />
            ))}
          </Stack>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<LocalActivityRoundedIcon />}
            title={
              tab === "AVAILABLE"
                ? "사용할 수 있는 쿠폰이 없어요"
                : tab === "USED"
                ? "아직 사용한 쿠폰이 없어요"
                : "만료된 쿠폰이 없어요"
            }
            description={
              tab === "AVAILABLE"
                ? "공지사항에서 진행 중인 이벤트를 확인해보세요."
                : undefined
            }
            actionLabel={tab === "AVAILABLE" ? "공지사항 보기" : undefined}
            onAction={
              tab === "AVAILABLE" ? () => router.push("/notices") : undefined
            }
          />
        ) : (
          <Stack gap={1.25} sx={{ p: 2 }}>
            {list.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </Stack>
        )}
      </ScrollBody>
    </>
  );
}

// 한 장의 쿠폰을 표현하는 카드.
// 좌측: 할인 금액(또는 %), 우측: 이름/설명/만료/조건
function CouponCard({ coupon }: { coupon: UserCoupon }) {
  const dim = coupon.status !== "AVAILABLE";
  const days = daysUntil(coupon.expiresAt);
  const isFixed = coupon.discountType === "FIXED";

  // 만료가 7일 이하 남았으면 강조 (사용 가능한 쿠폰만)
  const urgent = coupon.status === "AVAILABLE" && days >= 0 && days <= 7;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: `${radius.md}px`,
        overflow: "hidden",
        opacity: dim ? 0.55 : 1,
        // 좌측 할인영역과 우측 정보영역 사이 점선 — 쿠폰 느낌
        "&::before": {
          content: '""',
          position: "absolute",
          left: 124,
          top: 0,
          bottom: 0,
          borderLeft: `1.5px dashed ${palette.lineSoft}`,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          width: 124,
          flexShrink: 0,
          background: dim
            ? palette.lineSoft
            : `linear-gradient(155deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
          color: dim ? palette.inkMute : "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
          px: 1,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
          {isFixed ? "할인" : `${coupon.discountValue}%`}
        </Typography>
        <Typography
          sx={{
            fontSize: isFixed ? 22 : 18,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            mt: 0.25,
            lineHeight: 1.1,
          }}
        >
          {isFixed ? coupon.discountValue.toLocaleString() : "OFF"}
          {isFixed && (
            <Typography
              component="span"
              sx={{ fontSize: 13, fontWeight: 700, ml: 0.25 }}
            >
              원
            </Typography>
          )}
        </Typography>
        {!isFixed && coupon.maxDiscount != null && (
          <Typography sx={{ fontSize: 10.5, mt: 0.5, opacity: 0.85 }}>
            최대 {coupon.maxDiscount.toLocaleString()}원
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, p: 1.5, pl: 2 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {coupon.name}
        </Typography>
        {coupon.description && (
          <Typography
            sx={{
              fontSize: 11.5,
              color: palette.inkMute,
              mt: 0.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {coupon.description}
          </Typography>
        )}
        <Stack
          direction="row"
          gap={0.75}
          alignItems="center"
          flexWrap="wrap"
          sx={{ mt: 0.75 }}
        >
          {coupon.minOrderAmount > 0 && (
            <MetaPill>
              {coupon.minOrderAmount.toLocaleString()}원 이상
            </MetaPill>
          )}
          {coupon.status === "AVAILABLE" && (
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: urgent ? palette.accent : palette.inkSubtle,
              }}
            >
              {days < 0
                ? "만료됨"
                : days === 0
                ? "오늘 만료"
                : `${days}일 남음`}
            </Typography>
          )}
          {coupon.status === "USED" && coupon.usedAt && (
            <Typography sx={{ fontSize: 11, color: palette.inkSubtle }}>
              {new Date(coupon.usedAt).toLocaleDateString("ko-KR")} 사용
            </Typography>
          )}
          {coupon.status === "EXPIRED" && (
            <Typography sx={{ fontSize: 11, color: palette.inkSubtle }}>
              {new Date(coupon.expiresAt).toLocaleDateString("ko-KR")} 만료
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        fontSize: 10.5,
        fontWeight: 700,
        color: palette.inkMute,
        background: palette.lineSoft,
        borderRadius: 999,
        px: 0.875,
        py: 0.25,
      }}
    >
      {children}
    </Box>
  );
}
