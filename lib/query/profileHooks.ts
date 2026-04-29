"use client";

// 내 프로필 / 받은 후기 React Query 훅
// - useMyProfile : 마이페이지/설정 양쪽에서 같은 캐시 공유
// - useUpdateMyProfile / useUpdateAppPrefs : 변경 후 me 캐시 invalidate
// - useReceivedReviews : /mypage/reviews 화면

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  listReceivedReviews,
  updateAppPrefs,
  updateMyProfile,
} from "@/lib/repo";
import type { AppPrefs } from "@/lib/supabase/types";
import { queryKeys } from "./keys";

export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: () => getMyProfile(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      display_name?: string | null;
      username?: string | null;
      phone?: string | null;
    }) => updateMyProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}

export function useUpdateAppPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: AppPrefs) => updateAppPrefs(prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
  });
}

export function useReceivedReviews(userId?: string) {
  return useQuery({
    queryKey: queryKeys.profile.receivedReviews(userId),
    queryFn: () => listReceivedReviews(userId),
  });
}
