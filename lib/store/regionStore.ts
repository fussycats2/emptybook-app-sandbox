// 사용자가 보고 있는 동네(지역) — Zustand + localStorage persist
// ---------------------------------------------------------------
// 정책
//   - 게스트 / 로그인 모두 같은 브라우저에서 동작 (서버 동기화 X — profiles.region 연동은 추후)
//   - 홈 헤더 LocationChip + 홈 섹션 헤더("{region}의 따끈한 책") 가 같은 값을 본다
//   - 25개 서울 자치구를 시드로 노출 — 향후 GPS / profiles.region 도입 시 store 만 갈아끼우면 됨
//   - isUserSet: 사용자가 명시적으로 골랐는지 vs 기본값/GPS 로 자동 채워졌는지 구분.
//     자동 자리 차지를 사용자 결정으로 오해하지 않도록 (이후 자동 갱신 가드용).
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
  // true: 사용자가 직접 선택. false: 기본값 또는 GPS 자동 채움
  isUserSet: boolean;
  // 사용자가 직접 선택할 때 호출 (RegionPickerSheet 의 자치구 항목 클릭 등)
  setRegion: (region: string) => void;
  // GPS 자동 매핑 결과를 채울 때 호출 — isUserSet 은 false 유지
  setRegionAuto: (region: string) => void;
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      region: DEFAULT_REGION,
      isUserSet: false,
      setRegion: (region) => set({ region, isUserSet: true }),
      setRegionAuto: (region) => set({ region, isUserSet: false }),
    }),
    {
      name: "emptybook:region",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // v1 (region 만 있던 시절) → v2 마이그레이션. 기존 region 은 그대로 살리되,
      // default 와 다른 값을 골라둔 사용자는 명시 선택으로 간주(isUserSet=true)
      migrate: (persisted: any, fromVersion) => {
        if (fromVersion < 2) {
          return {
            region: persisted?.region ?? DEFAULT_REGION,
            isUserSet: !!persisted?.region && persisted.region !== DEFAULT_REGION,
          };
        }
        return persisted;
      },
    },
  ),
);
