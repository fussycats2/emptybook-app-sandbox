"use client";

// 채팅방 React Query 훅
// - 메시지 목록/Realtime 은 useRealtimeChat 훅이 별도로 관리 (구독 형태)
// - 여기는 채팅방 메타 정보(목록/단건) + getOrCreateChatRoom mutation

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChat, getOrCreateChatRoom, listChats } from "@/lib/repo";
import { queryKeys } from "./keys";

export function useChats() {
  return useQuery({
    queryKey: queryKeys.chat.list(),
    queryFn: () => listChats(),
  });
}

export function useChat(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.detail(id ?? ""),
    queryFn: () => fetchChat(id!),
    enabled: !!id,
  });
}

// "채팅" 버튼 — 도서 ID 로 채팅방 get-or-create
// 새 방을 만들었을 수도 있어 chat 목록 캐시 invalidate
export function useGetOrCreateChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => getOrCreateChatRoom(bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chat.list() });
    },
  });
}
