# 한몽 통역 (Монгол хэлмэрч)

한국어 ↔ 몽골어 실시간 대화 통역 PWA

- 대화 모드: 화면 위·아래 칸으로 나눠 마주 앉아 대화
- 듣기 모드: 한쪽 말을 계속 듣고 문장마다 번역
- 기록: 날짜별 번역 기록
- 번역: Anthropic Claude / 음성 인식: 기기 내장 또는 Azure Speech(아이폰) / 몽골어 음성: Azure Speech

## 구성
- `index.html` 앱 전체 · `sw.js` 오프라인 캐시 · `manifest.json` 설치 정보
- `worker.js` Cloudflare Worker 중계 서버 — API 키는 여기에만 보관. 기본은 누구나 사용(공개), `ACCESS_CODE`를 넣으면 코드가 있는 사람만 사용

## 사용자
휴대폰에서 앱 주소 열기 → 홈 화면에 추가 → 바로 사용

## 관리자
- Worker 환경 변수: `ANTHROPIC_API_KEY`, `AZURE_KEY`, `AZURE_REGION`, `ALLOWED_ORIGIN`, (선택) `ACCESS_CODE`
- 요금 보호: IP당 1분 사용량 제한 + **Anthropic 콘솔 월 사용 한도 필수**
- `index.html`의 `DEFAULT_SERVER`에 Worker 주소 입력

API 키는 절대 이 저장소에 올리지 마세요.

## 마스코트 인사 소리
`hello-mn.mp3`(몽골어 "Сайн байна уу" 녹음)를 올리면 몽글이를 눌렀을 때 그 소리가 납니다.
