// 서울 25개 자치구 중심 좌표 (위도, 경도) — 행정구역 reverse mapping 용
// 카카오/네이버 Reverse Geocoding API 의 가벼운 대체. 베타 시연 범위(서울)에서 충분하며
// API 키·환경변수·할당량을 요구하지 않는다.
//
// 각 좌표는 자치구청 좌표를 기준으로 잡았다 (위키피디아 자치구청 기준 GPS).
// 사용자 GPS 와 가장 가까운 centroid 를 nearestDistrict() 로 찾는다.

export interface DistrictCentroid {
  name: string;
  lat: number;
  lng: number;
}

export const SEOUL_CENTROIDS: DistrictCentroid[] = [
  { name: "강남구", lat: 37.5172, lng: 127.0473 },
  { name: "강동구", lat: 37.5301, lng: 127.1238 },
  { name: "강북구", lat: 37.6396, lng: 127.0257 },
  { name: "강서구", lat: 37.5509, lng: 126.8495 },
  { name: "관악구", lat: 37.4781, lng: 126.9515 },
  { name: "광진구", lat: 37.5384, lng: 127.0823 },
  { name: "구로구", lat: 37.4955, lng: 126.8875 },
  { name: "금천구", lat: 37.4569, lng: 126.8956 },
  { name: "노원구", lat: 37.6541, lng: 127.0568 },
  { name: "도봉구", lat: 37.6688, lng: 127.0471 },
  { name: "동대문구", lat: 37.5744, lng: 127.0398 },
  { name: "동작구", lat: 37.5124, lng: 126.9393 },
  { name: "마포구", lat: 37.5663, lng: 126.9019 },
  { name: "서대문구", lat: 37.5791, lng: 126.9368 },
  { name: "서초구", lat: 37.4837, lng: 127.0324 },
  { name: "성동구", lat: 37.5635, lng: 127.0367 },
  { name: "성북구", lat: 37.5894, lng: 127.0167 },
  { name: "송파구", lat: 37.5145, lng: 127.1059 },
  { name: "양천구", lat: 37.5170, lng: 126.8666 },
  { name: "영등포구", lat: 37.5263, lng: 126.8961 },
  { name: "용산구", lat: 37.5326, lng: 126.9905 },
  { name: "은평구", lat: 37.6027, lng: 126.9291 },
  { name: "종로구", lat: 37.5731, lng: 126.9794 },
  { name: "중구", lat: 37.5641, lng: 126.9979 },
  { name: "중랑구", lat: 37.6063, lng: 127.0926 },
];
