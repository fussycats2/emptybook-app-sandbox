// 사용자 GPS → 서울 자치구 추정
// ---------------------------------------------------------------
// - navigator.geolocation 으로 현재 좌표 가져오기 (HTTPS / localhost 만 동작)
// - SEOUL_CENTROIDS 에서 가장 가까운 자치구 반환 (Haversine)
// - 가장 가까운 centroid 가 OUT_OF_RANGE_KM 보다 멀면 "out of Seoul" 로 처리
//
// 베타 시연용 — 정밀한 행정동 단위가 필요해지면 카카오/네이버 Reverse Geocoding 으로 교체

"use client";

import { SEOUL_CENTROIDS } from "./seoulCentroids";

// 가장 가까운 centroid 와의 거리가 이 값을 넘으면 서울 외 지역으로 간주
const OUT_OF_RANGE_KM = 12;

// Haversine 거리 (km) — 두 위경도 좌표 사이 대권 거리
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 좌표에서 가장 가까운 자치구 + 거리(km) 반환. 25개 centroid 선형 탐색으로 충분히 빠름
export function nearestDistrict(
  lat: number,
  lng: number,
): { name: string; distanceKm: number } {
  let best = SEOUL_CENTROIDS[0];
  let bestDist = haversineKm(lat, lng, best.lat, best.lng);
  for (let i = 1; i < SEOUL_CENTROIDS.length; i++) {
    const d = haversineKm(lat, lng, SEOUL_CENTROIDS[i].lat, SEOUL_CENTROIDS[i].lng);
    if (d < bestDist) {
      best = SEOUL_CENTROIDS[i];
      bestDist = d;
    }
  }
  return { name: best.name, distanceKm: bestDist };
}

export type GeoLocateResult =
  | { kind: "ok"; region: string; distanceKm: number }
  | { kind: "out_of_range"; nearest: string; distanceKm: number }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "timeout" }
  | { kind: "unsupported" };

// 브라우저 Geolocation API 호출 + 자치구 매핑까지 한 번에
// - 사용자 탭(gesture) 이후에 호출되어야 iOS Safari 에서 안정적으로 동작
// - 결과 종류별로 호출자가 토스트/UI 분기 가능
export async function locateUserRegion(): Promise<GeoLocateResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { kind: "unsupported" };
  }
  return new Promise<GeoLocateResult>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const { name, distanceKm } = nearestDistrict(latitude, longitude);
        if (distanceKm > OUT_OF_RANGE_KM) {
          resolve({ kind: "out_of_range", nearest: name, distanceKm });
          return;
        }
        resolve({ kind: "ok", region: name, distanceKm });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ kind: "denied" });
        } else if (err.code === err.TIMEOUT) {
          resolve({ kind: "timeout" });
        } else {
          resolve({ kind: "unavailable" });
        }
      },
      {
        enableHighAccuracy: false, // 자치구 단위라 고정밀 불필요 — 배터리/속도 우선
        timeout: 8000,
        maximumAge: 60_000, // 1분 이내 캐시된 위치는 재사용
      },
    );
  });
}
