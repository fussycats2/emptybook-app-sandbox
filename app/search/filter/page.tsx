"use client";

// /search/filter — 별도 화면이 아니라, 검색 화면의 필터 시트를 자동으로 열기 위한 리다이렉트 라우트
// (예전 기획에서 분리되어 있던 흔적. 이제는 /search?openFilter=1 형태로 합쳐서 처리)

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FilterPage() {
  const router = useRouter();
  useEffect(() => {
    // replace: 뒤로가기 시 이 라우트로 다시 돌아오지 않도록 히스토리 교체
    router.replace("/search?openFilter=1");
  }, [router]);
  return null;
}
