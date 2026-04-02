# [STS 상태 값 관리 (Soft Delete) 적용 완료 보고서]

데이터의 물리적 삭제를 방지하고 `sts` 컬럼을 통한 상태 관리 및 이력 보존 로직 적용을 완료하였습니다.

## 주요 변경 사항

### 1. 전역 상태 관리 로직 업데이트
- **데이터 조회 시:** `schedules` 및 `members` 테이블 조회 시 `.neq('sts', 'D')` 조건을 추가하여, 삭제 처리된 데이터가 화면에 노출되지 않도록 하였습니다.
- **데이터 저장 시:** 
  - 신규 등록 시 `sts: 'C'` (Create) 값을 부여합니다.
  - 기존 데이터 수정 시 `sts: 'U'` (Update) 값을 부여합니다.
- **데이터 삭제 시:** `delete()` 함수 호출 대신 `update({ sts: 'D' })` (Delete)를 호출하여 논리 삭제로 전환하였습니다.

### 2. 파일별 상세 변경 내용

#### [App.jsx](file:///d:/ai_project/worktime-dashboard/src/App.jsx)
- `fetchSchedules`: 삭제 제외 조건 추가
- `handleSaveSchedule`: 저장 시 'C', 'U' 상태 부여
- `handleDeleteSchedule` & `handleResetMonth`: 삭제를 `sts: 'D'` 업데이트로 변경

#### [memberLogic.js](file:///d:/ai_project/worktime-dashboard/src/memberLogic.js)
- `fetchMembers`: 삭제 제외 조건 추가
- `addMember`: 생성 시 `sts: 'C'` 부여
- `deleteMember`: 삭제를 `sts: 'D'` 업데이트로 변경

#### [batchLogic.js](file:///d:/ai_project/worktime-dashboard/src/lib/batchLogic.js)
- `executeBatchInsert`: 기존 프리셋 데이터 "삭제" 로직을 `sts: 'D'` 업데이트로 변경하고, 새로운 배치 데이터 삽입 시 `sts: 'C'`를 부여합니다.

## 테스트 및 검증 결과
- **조회 검증:** DB에 `sts: 'D'`인 레코드가 있어도 화면(달력, 목록)에는 나타나지 않음을 확인해야 합니다.
- **삭제 검증:** 화면에서 삭제 버튼 클릭 시 DB 레코드가 사라지지 않고 `sts` 컬럼만 `'D'`로 변경되는지 확인이 필요합니다.

> [!CAUTION]
> **DB 컬럼 추가 확인**
> 본 로직이 정상 작동하기 위해서는 Supabase의 `schedules` 및 `members` 테이블에 `sts` (text 타입) 컬럼이 반드시 존재해야 합니다. 아직 추가하지 않으셨다면 컬럼을 추가해 주시기 바랍니다.
