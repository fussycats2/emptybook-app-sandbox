// Jest 설정 — Next.js 14 의 next/jest 프리셋 위에 얹어 사용.
// - SWC 기반 트랜스파일, tsconfig path alias(@/*) 자동 인식
// - testEnvironment: jsdom — 순수 함수 테스트엔 과한 환경이지만, 차후 컴포넌트
//   테스트 추가 시 그대로 쓸 수 있어 미리 셋업.
// - .mjs 인 이유: jest 가 .ts config 를 읽으려면 ts-node 가 필요. devDep 늘리기 싫어 ESM.
// - Phase 1: 순수 함수만 테스트. 컴포넌트/페이지/API 라우트는 별도 phase 에서 도입.

import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Next.js 앱 루트 — env / next.config 자동 로드
  dir: "./",
});

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: "jsdom",
  // jest-dom matchers 등록 (toBeInTheDocument 등). 컴포넌트 테스트 도입 즉시 동작.
  // setupFilesAfterEnv: jest framework 가 env 에 설치된 후 실행 → expect.extend 가능.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  // @/* alias — jest.setup.ts 안의 jest.mock("@/...") 가 인식되도록 명시.
  // next/jest 가 자동 매핑을 만들지만 setup 파일 resolution 시점엔 적용 안 되는 케이스가 있음.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
  // test-utils.tsx 는 테스트 헬퍼이지 테스트 파일이 아님 — testMatch 가 *.test.tsx 만 잡지만
  // 혹시 모를 sweep 을 위해 명시 제외.
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/__tests__/test-utils\\.tsx$"],
};

export default createJestConfig(customConfig);
