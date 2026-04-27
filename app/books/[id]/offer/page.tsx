"use client";

// /books/[id]/offer — 가격 제안 기능이 폐기되며 도서 상세로 영구 리다이렉트
// 외부에서 들어오는 옛 링크가 깨지지 않도록 라우트만 남겨둠

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/books/${params.id}`);
  }, [router, params.id]);
  return null;
}
