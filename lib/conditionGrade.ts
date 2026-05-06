// 도서 상태 상세 체크리스트 — 등급 추정 로직 + UI 메타데이터
// - DB 스키마(0013_books_condition_detail.sql) 의 jsonb 형태와 1:1 매칭되는 카테고리/항목 정의
// - inferGrade(detail) 가 책 상태 등급(최상/상/중/하)을 자동 추천
// - 자동 추천은 사용자가 등록 폼에서 최종 결정 — 추천 결과를 무시하고 다른 등급을 고를 수도 있음
//
// 등급 캡 규칙(우선순위 순, 더 낮은 등급이 항상 적용):
//   1) 본문 페이지누락       → 최대 "하"
//   2) 본문 낙서/형광펜/얼룩  → 최대 "중"
//   3) 외관 손상 합계 ≥ 3개  → 최대 "중"
//   4) 외관 손상 1~2개        → 최대 "상"
//   부속 누락(띠지/엽서/CD) 은 등급에 영향 X — 정보 표시용

import type { BookState } from "./supabase/types";
import type { ConditionDetail } from "./supabase/types";

// 한글 등급 — UI 에서 사용하는 표기 (DB enum 과는 다름)
export type GradeKor = "최상" | "상" | "중" | "하";

// 등급 정렬 (낮음 → 높음). cap 비교에 사용
const GRADE_RANK: Record<GradeKor, number> = {
  하: 0,
  중: 1,
  상: 2,
  최상: 3,
};

// 카테고리 / 항목 정의 — Sheet UI 가 그대로 그리고, infer 로직에서도 동일하게 참조
export type CategoryKey = "cover" | "spine" | "corner" | "body" | "extras";

export interface ConditionItem {
  key: string; // ConditionDetail[category] 의 키 (e.g. "fold")
  label: string; // 사용자에게 보여줄 한글 라벨
}

export interface ConditionCategory {
  key: CategoryKey;
  title: string;
  description?: string;
  items: ConditionItem[];
}

export const CONDITION_CATEGORIES: ConditionCategory[] = [
  {
    key: "cover",
    title: "표지",
    items: [
      { key: "fold", label: "접힘 자국" },
      { key: "scratch", label: "긁힘" },
      { key: "discolor", label: "변색" },
    ],
  },
  {
    key: "spine",
    title: "책등",
    items: [
      { key: "bend", label: "꺾임" },
      { key: "fade", label: "탈색" },
    ],
  },
  {
    key: "corner",
    title: "모서리",
    items: [{ key: "wear", label: "닳음" }],
  },
  {
    key: "body",
    title: "본문",
    description: "내용 인식에 영향을 주는 손상",
    items: [
      { key: "pen", label: "낙서/필기" },
      { key: "highlight", label: "형광펜" },
      { key: "stain", label: "얼룩" },
      { key: "missing", label: "페이지 누락" },
    ],
  },
  {
    key: "extras",
    title: "부속품",
    description: "등급에는 영향 없음 — 정보 표시용",
    items: [
      { key: "band_missing", label: "띠지 없음" },
      { key: "postcard_missing", label: "엽서 없음" },
      { key: "cd_missing", label: "CD/DVD 없음" },
    ],
  },
];

// (cat, item) → 체크 여부. 객체 트리에서 안전 접근
function isChecked(detail: ConditionDetail | undefined, cat: CategoryKey, item: string): boolean {
  if (!detail) return false;
  // ConditionDetail 의 각 카테고리는 Record<string, boolean | undefined> 형태
  const group = (detail as Record<string, Record<string, boolean | undefined> | undefined>)[cat];
  return !!group?.[item];
}

// 추정 등급. detail 이 없거나 모두 미체크면 "최상" 으로 시작 — 사용자가 안 건드린 신호
// (등록 폼의 기본 state="상" 과는 별개로 추천만 한다)
export function inferGrade(detail?: ConditionDetail): GradeKor {
  if (!detail) return "최상";
  let cap: GradeKor = "최상";
  const apply = (g: GradeKor) => {
    if (GRADE_RANK[g] < GRADE_RANK[cap]) cap = g;
  };

  // 본문 손상 — 가장 큰 영향
  if (isChecked(detail, "body", "missing")) apply("하");
  if (isChecked(detail, "body", "pen")) apply("중");
  if (isChecked(detail, "body", "highlight")) apply("중");
  if (isChecked(detail, "body", "stain")) apply("중");

  // 외관 손상 합계
  let outer = 0;
  if (isChecked(detail, "cover", "fold")) outer++;
  if (isChecked(detail, "cover", "scratch")) outer++;
  if (isChecked(detail, "cover", "discolor")) outer++;
  if (isChecked(detail, "spine", "bend")) outer++;
  if (isChecked(detail, "spine", "fade")) outer++;
  if (isChecked(detail, "corner", "wear")) outer++;
  if (outer >= 3) apply("중");
  else if (outer >= 1) apply("상");

  return cap;
}

// 빈 detail → 모든 카테고리/항목이 false 인 객체
// (사용자가 시트 첫 진입 시 기본 상태로 시작)
export function emptyConditionDetail(): ConditionDetail {
  const out: ConditionDetail = {};
  for (const cat of CONDITION_CATEGORIES) {
    (out as Record<string, Record<string, boolean>>)[cat.key] = Object.fromEntries(
      cat.items.map((it) => [it.key, false])
    );
  }
  return out;
}

// 체크된 항목만 평탄화 — 도서 상세 표시용 ("표지: 긁힘 · 본문: 낙서…")
export function flattenChecked(
  detail?: ConditionDetail
): { category: string; items: string[] }[] {
  if (!detail) return [];
  return CONDITION_CATEGORIES.map((cat) => ({
    category: cat.title,
    items: cat.items
      .filter((it) => isChecked(detail, cat.key, it.key))
      .map((it) => it.label),
  })).filter((g) => g.items.length > 0);
}

// detail 에 체크된 항목이 하나라도 있는지 — 도서 상세에서 토글 노출 여부 판단
export function hasAnyChecked(detail?: ConditionDetail): boolean {
  if (!detail) return false;
  for (const cat of CONDITION_CATEGORIES) {
    for (const it of cat.items) {
      if (isChecked(detail, cat.key, it.key)) return true;
    }
  }
  return false;
}
