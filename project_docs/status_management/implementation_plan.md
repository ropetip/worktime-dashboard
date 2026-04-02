# [STS 상태 값 관리 (Soft Delete 적용)]

현재 데이터 삭제 시 물리적 데이터 삭제(`DELETE`) 방식으로 구현되어 있으나, 이를 `sts` (상태) 컬럼을 활용한 논리적 삭제 및 이력 관리 방식으로 변경합니다. 

## User Review Required

> [!IMPORTANT]
> **DB 스키마 변경 필요**
> 적용 전 본 시스템의 관계형 DB(Supabase) 테이블(`schedules`, `members`)에 `sts` 컬럼(타입: `VARCHAR` 또는 `text`, 기본값: `'C'`)이 추가되어야 합니다.

## Proposed Changes

### [코드 변경 목록]

#### [MODIFY] [App.jsx](file:///d:/ai_project/worktime-dashboard/src/App.jsx)
- **일정 조회 (`fetchSchedules`):** `supabase.from('schedules').select('*')` 호출 시 `.neq('sts', 'D')` 조건 추가
- **일정 저장 (`handleSaveSchedule`):** 
  - 신규 생성(Insert): 데이터 내 `sts: 'C'` 부여
  - 수정(Update): 업데이트 객체 내 `sts: 'U'` 부여
- **일정 삭제 (`handleDeleteSchedule` & `handleResetMonth`):** 
  - `delete()` 메소드 대신 `update({ sts: 'D' })` 호출로 변경

#### [MODIFY] [memberLogic.js](file:///d:/ai_project/worktime-dashboard/src/memberLogic.js)
- **구성원 조회 (`fetchMembers`):** `.neq('sts', 'D')` 조건 추가
- **구성원 추가 (`addMember`):** Insert 시 `sts: 'C'` 부여
- **구성원 삭제 (`deleteMember`):** `delete()`를 `update({ sts: 'D' })`로 변경

#### [MODIFY] [lib/batchLogic.js](file:///d:/ai_project/worktime-dashboard/src/lib/batchLogic.js)
- 일괄 처리 및 프리셋 로직에서 데이터 삭제 등의 부분이 있다면 역시 삭제 대신 `sts: 'D'`로 업데이트하는 로직으로 변경.

## Open Questions

> [!WARNING]
> **"데이터 이력으로 관리"의 정확한 설계 방향 확인 요청**
> 
> 질문 1: 하나의 테이블(예: `schedules`) 내의 기존 데이터를 덮어쓰며 상태만 `STS='C' -> 'U' -> 'D'`로 변동하는 **단순 Soft Delete 방식**이면 괜찮으신가요? 
> 아니면 업데이트 시마다 이전 내용을 유지하고 새로운 row를 삽입(Append)하여 변경 과정(히스토리)을 모두 남기는 **Insert ONLY 이력 방식**(또는 이력용 별도 테이블 운영)이 필요하신 건가요? (본 계획은 단순 Soft Delete를 기준으로 작성되었습니다.)

## Verification Plan

### Automated Tests
- 없음

### Manual Verification
1. 프론트엔드에서 신규 데이터를 생성한 뒤 DB에서 `sts` 컬럼이 'C'로 입력되었는지 확인.
2. 데이터를 수정한 뒤 DB에서 해당 항목의 `sts` 값이 'U'로 변경되었는지 확인.
3. 삭제를 수행한 뒤 화면 상(조회)에서는 나타나지 않으며, DB에서는 데이터가 지워지지 않고 `sts` 값이 'D'로 남아있는지 확인.
