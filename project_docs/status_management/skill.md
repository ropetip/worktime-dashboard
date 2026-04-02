---
name: Supabase 데이터 소프트 삭제 및 상태 관리 가이드(Soft Delete & STS management)
description: 데이터 삭제 시 `DELETE` 쿼리를 사용하지 않고, 상태(STS) 컬럼을 업데이트('D')하여 이력을 남기는 관리 방안
---

# Supabase 데이터 상태(STS) 기반 관리 가이드

본 가이드는 데이터를 영구 삭제하지 않고 `STS` (Status) 컬럼을 통해 `C`(생성), `U`(수정), `D`(삭제)로 이력을 관리하는 시스템을 위한 컨벤션입니다.

## 1. 개요
데이터의 물리적 삭제(`HARD DELETE`)는 복구 불가능한 데이터 유실을 초래할 수 있으므로, 상태 값을 변경하는 논리적 삭제(`SOFT DELETE`) 방식을 따릅니다. 이를 통해 '데이터 이력'을 보존합니다.

## 2. 상태(STS) 코드 정의
- **'C' (Create):** 신규 생성된 데이터
- **'U' (Update):** 수정/업데이트된 데이터
- **'D' (Delete):** 삭제 처리된 데이터

## 3. 구현 원칙 (구현 시 필수 체크리스트)

### 데이터 생성(Insert) 시
데이터를 새로 삽입할 때 `sts` 값을 명시적으로 `'C'`로 설정해야 합니다. (DB의 기본값이 'C'이더라도 명시하는 것을 권장합니다.)

```javascript
// 예시 코드 (React / Supabase-js 기준)
const { data, error } = await supabase
  .from('table_name')
  .insert([{ ..., sts: 'C' }]);
```

### 데이터 수정(Update) 시
데이터를 조작/변경할 때는 `sts` 값을 `'U'`로 변경해주어 해당 row 가 수정된 이력이 있음을 남깁니다.

```javascript
const { data, error } = await supabase
  .from('table_name')
  .update({ ..., sts: 'U' })
  .eq('id', id);
```

### 데이터 삭제(Delete) 시
`supabase.from().delete()` **사용을 엄격히 금지**합니다. (예외적인 완전 삭제 스크립트 제외)
대신 `UPDATE` 명령어를 사용해 상태를 `'D'`로 전환합니다.

```javascript
// 금지 패턴 ❌ : .delete() 적용 금지
// 권장 패턴 ⭕ : .update({ sts: 'D' })

const { data, error } = await supabase
  .from('table_name')
  .update({ sts: 'D' })
  .eq('id', id);
```

### 데이터 조회(Select) 시
목록 화면 등 일반적인 쿼리에서는 삭제 처리된 데이터(`sts: 'D'`)가 노출되지 않아야 합니다. 조회 쿼리 작성 시 `.neq('sts', 'D')` 조건을 반드시 붙입니다.

```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .neq('sts', 'D'); // <-- 필수
```

## 4. 데이터 이력(append) 방식 참고
요구사항에 따라, **"상태를 덮어쓰는 것(Overwrite)"** 이외에 **"수정/삭제 시 새로운 row를 Insert(Append-Only)"** 하는 방식이 필요할 수도 있습니다.
- Overwrite 복구: `sts = 'D'`를 다시 `'U'`나 `'C'`로 변경하면 복구 가능하나, 언제 삭제/수정했는지에 대한 일시(timestamp) 추적을 위해서는 별도의 로그(history table)가 필요할 수 있습니다.
- 기획(User Requirements)에 맞춰 "단일 테이블 덮어쓰기 논리 삭제"로 갈지 "Insert 전용 이력 테이블 분리"로 갈지 결정한 후 본 문서를 숙지해주십시오.
