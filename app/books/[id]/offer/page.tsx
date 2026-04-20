"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/books/${params.id}`);
  }, [router, params.id]);
  return null;
}
