// 인증/계정 폼들이 공유하는 시각 토큰
// - 입력칸과 메인 버튼이 같은 세로 리듬을 갖도록 height 를 한 곳에서 관리
// - OutlinedInput 의 height 가 endAdornment(예: 비밀번호 visibility 아이콘) 유무에 따라
//   자동 조정되는 것을 막기 위해 input 영역의 padding 도 명시적으로 강제한다.
//
// 사용처: /login · /signup · /find-account · /reset-password 등 인증·계정 폼

import type { SxProps, Theme } from "@mui/material/styles";

// 입력칸 / 메인 버튼 공통 높이 (px)
export const FIELD_HEIGHT = 52;

// OutlinedInput 에 spread 해서 사용 — 인풋 박스의 height 와 input 영역 padding 을 통일
export const INPUT_SX: SxProps<Theme> = {
  height: FIELD_HEIGHT,
  fontSize: 15,
  // input 영역의 vertical padding 을 0 으로 두고 컨테이너 height 가 결정되도록 — endAdornment 유무 무관 동일 보장
  "& .MuiOutlinedInput-input": {
    paddingTop: 0,
    paddingBottom: 0,
    height: "100%",
  },
};

// 메인 액션 버튼(로그인/가입/재설정 등)에 spread 해서 사용
export const PRIMARY_BUTTON_SX: SxProps<Theme> = {
  height: FIELD_HEIGHT,
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: "-0.01em",
};
