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
  uploadAvatar,
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
      preferred_genres?: string[] | null;
      avatar_url?: string | null;
      region?: string | null;
    }) => updateMyProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me() });
      // 홈 카테고리 추천 섹션이 preferred_genres 첫 번째 값을 카테고리로 쓰므로,
      // 장르 변경 시 책 검색 캐시도 같이 invalidate (다음 진입에 새 카테고리로 fetch).
      qc.invalidateQueries({ queryKey: queryKeys.book.lists() });
    },
  });
}

// 프로필 사진 업로드 — Storage upload + profiles.avatar_url update 한 번에.
// 성공 시 profile.me 캐시 invalidate 하여 화면에 즉시 반영.
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
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

export function useReceivedReviews(userId?: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.profile.receivedReviews(userId, limit),
    queryFn: () => listReceivedReviews(userId, limit),
  });
}
