"use client";

// 쿠폰함 (/mypage/coupons)
// - 쿠폰 발급/사용 시스템이 아직 미구현 → 빈 상태 화면으로 안내
// - 추후 user_coupons 테이블 + listMyCoupons repo 함수가 들어오면 EmptyState 자리를 그리드로 교체하면 된다

import LocalActivityRoundedIcon from "@mui/icons-material/LocalActivityRounded";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";

export default function CouponsPage() {
  const router = useRouter();

  return (
    <>
      <AppHeader title="쿠폰함" left="back" />
      <ScrollBody>
        <EmptyState
          icon={<LocalActivityRoundedIcon />}
          title="보유한 쿠폰이 없어요"
          description={
            "발급받은 쿠폰이 여기에 모여요.\n공지사항에서 진행 중인 이벤트를 확인해보세요."
          }
          actionLabel="공지사항 보기"
          onAction={() => router.push("/notices")}
        />
      </ScrollBody>
    </>
  );
}
