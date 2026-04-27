"use client";

// 클라이언트 전역에서 "현재 로그인 상태"를 공유하기 위한 React Context
// - 어떤 컴포넌트에서든 useAuth() 훅으로 user / session / loading 을 꺼내 쓸 수 있다
// - Supabase 의 onAuthStateChange 이벤트를 구독해 로그인/로그아웃에 자동으로 반응

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/repo";

// Context 가 노출하는 값의 형태
type AuthState = {
  user: User | null; // 로그인된 사용자(없으면 null)
  session: Session | null; // 토큰 등을 담은 세션 객체
  loading: boolean; // 최초 세션 조회 중인지 여부
  signOut: () => Promise<void>; // 로그아웃 함수
};

// 기본값: 비로그인 상태이면서 loading=true (아직 모름)
const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

// 앱 전체를 감싸는 Provider 컴포넌트
// app/providers.tsx 에서 트리 최상단에 배치된다
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 마운트 시 1회: 현재 세션을 조회하고, 이후 로그인/로그아웃 이벤트를 구독한다
  useEffect(() => {
    // Supabase 키가 없는(=mock) 환경이면 인증 자체가 비활성. 즉시 로딩 종료
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    (async () => {
      // 동적 import: Supabase 패키지를 클라이언트 번들에서 lazy load
      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = supabaseBrowser();
      // 1) 새로고침 직후 등 현재 세션 1회 조회
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
      // 2) 이후 토큰 갱신/로그인/로그아웃 시점마다 자동으로 상태 업데이트
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
        }
      );
      unsub = () => listener.subscription.unsubscribe();
    })();
    // 언마운트 시 구독 해제(메모리 누수 방지)
    return () => unsub?.();
  }, []);

  // 로그아웃: Supabase 세션 만료 → 로컬 상태도 비움
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { supabaseBrowser } = await import("@/lib/supabase/client");
    await supabaseBrowser().auth.signOut();
    setSession(null);
  }, []);

  // useMemo: session 이 바뀌지 않는 한 같은 객체 참조를 유지 → 불필요한 리렌더 방지
  const value = useMemo(
    () => ({ user: session?.user ?? null, session, loading, signOut }),
    [session, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 어떤 컴포넌트에서든 const { user } = useAuth() 형태로 쉽게 사용 가능
export function useAuth() {
  return useContext(AuthContext);
}
