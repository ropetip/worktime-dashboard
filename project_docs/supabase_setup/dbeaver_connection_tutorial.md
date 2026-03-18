# 🚀 Supabase 시작하기 및 DBeaver 연결 가이드

이 가이드는 Supabase를 처음 한 사용자들을 위해 설치 없이 클라우드로 DB를 구축하고, 기존에 가지고 계신 DBeaver와 연결하는 방법을 설명합니다.

---

## 1. Supabase가 무엇인가요? (설치 여부)
**결론부터 말씀드리면, PC에 무엇을 설치하실 필요가 없습니다!**

Supabase는 클라우드 기반의 데이터베이스 서비스(BaaS)입니다.
- **설치 불필요**: AWS나 Google Cloud처럼 인터넷상에 이미 구축된 DB 서버를 빌려 쓰는 방식입니다.
- **계정 필요**: 대신 서비스를 이용하기 위해 [Supabase.com](https://supabase.com)에 계정을 만들고 내 '프로젝트'를 하나 생성해야 합니다.

---

## 2. 가입 및 프로젝트 생성 (처음 한 번만)

1. [Supabase 홈페이지](https://supabase.com) 접속 후 **[Sign Up]** (GitHub 계정 연동 추천).
2. **[New Project]** 버튼 클릭.
3. **Organization** 선택 (없으면 생성).
4. **Project Details** 입력:
   - **Name**: `worktime-dashboard` (원하시는 이름)
   - **Database Password**: ❗️**매우 중요! 이 암호는 DBeaver 연결 시 꼭 필요하니 따로 기록해 두세요.**
   - **Region**: `Northeast Asia (Seoul)` (한국)
5. **[Create new project]** 클릭 후 몇 분 기다리면 DB가 생성됩니다.

---

## 3. DBeaver와 연결하는 방법

Supabase DB는 **PostgreSQL**이므로 DBeaver로 아주 쉽게 연결할 수 있습니다.

### 접속 정보 확인 (Supabase 웹 사이트)
1. 생성된 프로젝트의 왼쪽 메뉴 하단 **[Project Settings]** (톱니바퀴) 클릭.
2. **[Database]** 메뉴 클릭.
3. 화면 중간의 **Connection Parameters** 항목을 확인합니다.
  - **Host**: `aws-0-ap-northeast-2.pooler.supabase.com` (예시 - **[Direct Connection]**이 아닌 **[Transaction]** 모드를 선택해야 주소가 바뀝니다!)
  - **Port**: `6543`
  - **Database name**: `postgres`
  - **User**: `postgres`
  - **Password**: (프로젝트 생성 시 설정한 암호)

> [!IMPORTANT]
> **스크린샷처럼 "db.xxx.supabase.co" 주소를 쓰면 실패합니다!**
> 1. Supabase 대시보드에서 `Method`를 **[Direct connection]** 대신 **[Transaction]**으로 클릭하세요.
> 2. 그러면 `Host` 주소가 `...pooler.supabase.com`으로 바뀝니다.
> 3. 이 **가장 긴 주소**를 DBeaver의 `Host`란에 넣으셔야 합니다.

### DBeaver 설정
1. DBeaver 실행 후 왼쪽 상단 **[새 연결]** (플러그 모양) 아이콘 클릭.
2. **PostgreSQL** 선택 후 [다음].
3. 위에서 확인한 정보를 하나씩 입력합니다.
   - **Host**: (복사한 **Connection Pooler** 주소)
   - **Port**: **6543** (5432 실패 시 필수)
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: (본인이 설정한 암호)
4. **[Test Connection]**을 누릅니다.
   - **만약 여전히 실패한다면?** 왼쪽 메뉴의 **SSL** 탭에서 `Use SSL`을 체크하고 SSL Mode를 **`require`**로 설정하세요. (이미 스크린샷에서 설정하신 것과 같습니다)
5. 연결 성공 시 [완료]를 누릅니다.

DBeaver 연결이 회사 방화벽 등으로 인해 불가능한 경우, **브라우저에서 바로 실행 가능한 SQL Editor**를 사용하시는 것이 가장 확실하고 빠릅니다.

### Supabase 웹 SQL Editor 사용법
1. [Supabase 대시보드](https://supabase.com/dashboard/)에 접속하여 프로젝트를 선택합니다.
2. 왼쪽 메뉴에서 **범위(SQL Editor, `>_` 모양 아이콘)**를 클릭합니다.
3. 상단의 **[+ New query]** 버튼을 누릅니다.
4. 아래에 제공된 SQL 코드를 복사해서 붙여넣습니다.
5. 오른쪽 하단의 **[Run]** (또는 `Ctrl + Enter`) 버튼을 클릭합니다.
   - `Success. No rows returned` 메시지가 나오면 테이블 생성이 완료된 것입니다!

---

## 4. 실행할 SQL 쿼리 (테이블 생성용)
이 쿼리는 DBeaver나 웹 SQL Editor 어디서든 사용 가능합니다.

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

-- 2. 실시간 동기화 활성화
alter publication supabase_realtime add table public.schedules;

-- 3. 보안 정책(RLS) 설정 (누구나 접근 가능하게 설정)
alter table public.schedules enable row level security;
create policy "Enable access for all users" on public.schedules for all using (true) with check (true);
```

이제 DBeaver를 통해 데이터를 직접 넣거나 조회할 수 있습니다!
가이드대로 진행하시다가 막히는 부분(에러 메시지 등)이 있으면 바로 말씀해 주세요.
