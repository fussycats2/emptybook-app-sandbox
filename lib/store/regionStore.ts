// 사용자가 보고 있는 동네(지역) — Zustand + localStorage persist
// ---------------------------------------------------------------
// 정책
//   - 게스트 / 로그인 모두 같은 브라우저에서 동작 (서버 동기화 X — profiles.region 연동은 추후)
//   - 홈 헤더 LocationChip + 홈 섹션 헤더("{region}의 따끈한 책") 가 같은 값을 본다
//   - 25개 서울 자치구를 시드로 노출 — 향후 GPS / profiles.region 도입 시 store 만 갈아끼우면 됨
//
// SSR 안전성
//   persist 가 hydrate 되기 전 첫 프레임은 DEFAULT_REGION 으로 떨어진다 — 모든 화면이
//   초기에 "마포구" 로 시작하던 상수와 동일한 동작이라 hydration mismatch 없음.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const DEFAULT_REGION = "마포구";

// 서울 25개 자치구 — RegionPickerSheet 의 선택지로 사용
// 향후 사용자 활성 지역(profiles.region 또는 user_regions) 으로 교체 가능
export const SEOUL_DISTRICTS = [
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

interface RegionState {
  region: string;
  setRegion: (region: string) => void;
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      region: DEFAULT_REGION,
      setRegion: (region) => set({ region }),
    }),
    {
      name: "emptybook:region",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
