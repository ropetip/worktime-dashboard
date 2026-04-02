# STS 상태 값 관리 (Soft Delete) 적용 작업 현황

- [x] `src/App.jsx` 수정 (기초 작업)
    - [x] `fetchSchedules` 조회 조건에 `.neq('sts', 'D')` 추가
    - [x] `handleSaveSchedule` 저장(Insert/Update) 시 `sts` 값 부여 ('C', 'U')
    - [x] `handleDeleteSchedule` 삭제 로직을 `.update({ sts: 'D' })`로 변경
    - [x] `handleResetMonth` 초기화 로직을 `.update({ sts: 'D' })`로 변경
- [x] `src/memberLogic.js` 수정
    - [x] `fetchMembers` 조회 조건에 `.neq('sts', 'D')` 추가
    - [x] `addMember` 저장 시 `sts: 'C'` 부여
    - [x] `deleteMember` 삭제 로직을 `.update({ sts: 'D' })`로 변경
- [x] `src/lib/batchLogic.js` 수정
    - [x] `executeBatchInsert` 내 프리셋 삭제 로직을 `.update({ sts: 'D' })`로 변경
    - [x] 배치 데이터 삽입 시 `sts: 'C'` 부여
- [x] **조회 성능 최적화 및 레이스 컨디션 해결 (추가 작업)**
    - [x] `fetchSchedules`에 `AbortController` 적용
    - [x] 실시간 리스너(Realtime)에 `Debounce` 로직 추가
    - [x] 조회 요청과 현재 월(`currentDate`)의 일치 여부 검증 (AbortController로 자동 해결)
- [x] 최종 확인 및 검증
