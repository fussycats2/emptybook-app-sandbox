"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FilterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/search?openFilter=1");
  }, [router]);
  return null;
}
