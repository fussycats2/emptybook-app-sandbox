// 도서 제목/설명 텍스트 → 우리 앱의 8개 카테고리 추정
// 네이버 도서 검색 API 응답에 category 필드가 없어 키워드 휴리스틱으로 분류
// - 점수 합산 방식: 카테고리별 키워드 매칭 횟수 → 가장 높은 카테고리 선택
// - 어느 것도 매칭되지 않으면 안전한 기본값 "소설"
//
// CATEGORIES(mockData.ts) 와 항상 1:1 일치해야 함:
//   소설 / 에세이 / 자기계발 / 경제/경영 / 역사 / 과학 / 아동 / 만화

type Category =
  | "소설"
  | "에세이"
  | "자기계발"
  | "경제/경영"
  | "역사"
  | "과학"
  | "아동"
  | "만화";

// 키워드는 부분일치(includes). 같은 의미의 한/영 표기를 함께 둠
// 우선순위 처리: "만화"/"아동" 등 좁은 카테고리가 먼저 점수를 얻도록 다른 카테고리보다 키워드를 빡빡하게 둠
const RULES: { category: Category; keywords: string[] }[] = [
  {
    category: "만화",
    keywords: ["만화", "코믹", "웹툰", "comic", "graphic novel"],
  },
  {
    category: "아동",
    keywords: [
      "동화",
      "그림책",
      "어린이",
      "유아",
      "키즈",
      "초등",
      "아이",
      "전래",
    ],
  },
  {
    category: "경제/경영",
    keywords: [
      "경제",
      "경영",
      "투자",
      "주식",
      "부동산",
      "재테크",
      "마케팅",
      "비즈니스",
      "스타트업",
      "창업",
      "회계",
      "금융",
      "부자",
      "money",
    ],
  },
  {
    category: "자기계발",
    keywords: [
      "자기계발",
      "성공",
      "습관",
      "동기부여",
      "리더십",
      "행동",
      "공부법",
      "시간관리",
      "처세",
      "역행자",
      "마인드",
      "self-help",
    ],
  },
  {
    category: "역사",
    keywords: [
      "역사",
      "한국사",
      "세계사",
      "조선",
      "고려",
      "삼국",
      "근현대",
      "전쟁",
      "왕조",
      "유적",
      "history",
    ],
  },
  {
    category: "과학",
    keywords: [
      "과학",
      "물리",
      "화학",
      "생물",
      "천문",
      "우주",
      "진화",
      "수학",
      "통계",
      "공학",
      "코스모스",
      "양자",
      "유전자",
      "science",
    ],
  },
  {
    category: "에세이",
    keywords: [
      "에세이",
      "산문",
      "일기",
      "기행",
      "수필",
      "essay",
    ],
  },
  {
    category: "소설",
    keywords: [
      "소설",
      "장편",
      "단편",
      "novel",
      "fiction",
      "시집",
    ],
  },
];

// 텍스트(주로 title + description) → 가장 매칭 점수가 높은 카테고리
// 매칭이 전혀 없으면 "소설" 반환 (가장 흔한 카테고리)
export function inferCategory(text: string): Category {
  if (!text) return "소설";
  const haystack = text.toLowerCase();
  let best: Category = "소설";
  let bestScore = 0;
  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (haystack.includes(kw.toLowerCase())) score += 1;
    }
    // 동점이면 RULES 배열 앞쪽(=좁은 카테고리)이 우선 — 명시적으로 strict greater 비교
    if (score > bestScore) {
      best = rule.category;
      bestScore = score;
    }
  }
  return best;
}
