# [Vite 구동 오류 및 PM2 설정 수정 계획]

현재 PM2를 통해 Vite를 실행하는 과정에서 `node_modules` 부재 및 경로 오류로 인해 서버가 시작되지 않는 문제를 해결합니다.

## User Review Required

> [!IMPORTANT]
> **의존성 재설치 필요**
> `package.json` 수정 후 터미널에서 `npm install`을 반드시 실행하여 `node_modules` 폴더를 생성해야 합니다.

## Proposed Changes

### [코드 변경 목록]

#### [MODIFY] [package.json](file:///d:/ai_project/worktime-dashboard/package.json)
- `devDependencies` 내의 `vite` 버전을 `^8.0.0` (비정상)에서 `^6.0.0` (안정 버전)으로 수정합니다.

### [실행 가이드]

1. **의존성 설치:**
   ```bash
   npm install
   ```

2. **PM2 실행 (Vite 6 최신 방식):**
   스크린샷에 나타난 `node_modules\vite\bin\vite.js` 직접 실행 방식 대신, `npm run dev` 명령어를 PM2로 관리하는 것을 권장합니다.
   ```bash
   pm2 start "npm run dev" --name worktime-dashboard
   ```
   만약 직접 실행 경로를 써야 한다면 아래 경로를 사용하세요:
   `node_modules/vite/bin/vite.mjs` (확장자 주의)

## Open Questions

- "Step 1", "Step 2" 로그가 출력되는 별도의 `.ps1` 이나 `.js` 실행 스크립트가 있나요? 프로젝트 루트에서는 보이지 않아, 해당 스크립트 파일이 있다면 직접 경로 수정을 도와드릴 수 있습니다.

## Verification Plan

### Manual Verification
1. `package.json` 수정 후 `npm install` 성공 여부 확인.
2. `pm2 start` 시 에러 없이 `online` 상태로 전환되는지 확인.
