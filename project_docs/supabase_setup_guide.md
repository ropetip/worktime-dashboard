# 🗄️ Supabase DB 설정 가이드

이 문서는 로컬 스토리지 대신 Supabase 데이터베이스를 사용하여 팀원들과 실시간으로 일정을 공유하기 위한 설정 방법을 설명합니다.

## 1. Supabase 테이블 생성 (SQL)

Supabase 프로젝트의 **SQL Editor**에 접속하여 아래 코드를 복사해서 실행(`Run`)해 주세요.

```sql
-- 1. 일정(schedules) 테이블 생성
create table public.schedules (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  name text not null,
  time text not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 실시간 동기화(Realtime) 활성화
alter publication supabase_realtime add table public.schedules;

-- 3. 보안 정책(RLS) 설정 (우선은 누구나 읽고 쓸 수 있게 설정)
alter table public.schedules enable row level security;

create policy "Enable access for all users"
on public.schedules for all
using (true)
with check (true);
```

## 2. `.env` 환경 변수 설정

프로젝트 루트 폴더(`d:\ai_project\worktime-dashboard`)에 `.env` 파일을 만들고 본인의 정보를 입력해 주세요.

```text
VITE_SUPABASE_URL=https://본인의-프로젝트-주소.supabase.co
VITE_SUPABASE_ANON_KEY=본인의-공개-아논-키
```

## 3. 데이터 동기화 방식

- **읽기**: 사이트 접속 시 DB에서 이번 달 및 다음 달의 모든 일정을 가져옵니다.
- **쓰기/수정/삭제**: 모달창에서 작업을 수행하면 즉시 DB에 반영됩니다.
- **실시간**: 다른 사용자가 수정한 내용도 페이지 새로고침 없이 즉시 화면에 나타납니다. (Realtime 기능)
