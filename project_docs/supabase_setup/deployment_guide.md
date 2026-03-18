# 🚀 GitHub Pages 배포 및 Supabase 연동 가이드

이 가이드는 작성하신 코드를 GitHub에 PUSH했을 때 자동으로 웹사이트가 배포되고, 배포된 사이트에서 Supabase 데이터베이스가 정상적으로 작동하도록 설정하는 방법을 설명합니다.

---

## 1. 현재 배포 상태 (GitHub Pages)

현재 프로젝트에는 **GitHub Actions**를 통한 자동 배포 설정(`.github/workflows/deploy.yml`)이 되어 있습니다.
- **동작**: `main` 브랜치에 `push`를 하면 자동으로 빌드(Build)가 시작되고, 완료되면 GitHub Pages로 배포됩니다.
- **주의사항**: 하지만 단순히 코드만 올리면 **배포된 사이트에서 DB가 작동하지 않습니다.**

---

## 2. 왜 안 되나요? (환경 변수 문제)

로컬에서는 `.env` 파일에 Supabase URL과 Key를 적어두셨지만, 이 파일은 보안상 GitHub에 올리지 않습니다.
따라서 GitHub의 서버(Actions 리너)는 빌드할 때 여러분의 Supabase 정보를 알지 못합니다. 

이 문제를 해결하려면 **GitHub Secrets**에 이 정보들을 등록해 주어야 합니다.

---

## 3. 해결 방법: GitHub Secrets 설정하기

1. 본인의 **GitHub 저장소(Repository)** 웹 페이지에 접속합니다.
2. 상단 메뉴에서 **[Settings]** 탭을 클릭합니다.
3. 왼쪽 사이드바에서 **[Secrets and variables]** -> **[Actions]**를 선택합니다.
4. **[New repository secret]** 버튼을 두 번 눌러서 아래 두 항목을 각각 추가합니다.

   - **Name**: `VITE_SUPABASE_URL`
     - **Value**: (Supabase 대시보드에서 확인한 URL)
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     - **Value**: (Supabase 대시보드에서 확인한 Anon Key)

---

## 4. `deploy.yml` 파일 업데이트 (코드 수정)

빌드 과정에서 위에서 등록한 Secrets를 읽어올 수 있도록 설정 파일을 수정해야 합니다. 
(이미 제가 수정 계획을 세워두었으며, 승인하시면 바로 적용해 드릴 예정입니다.)

```yaml
# 수정될 부분 예시
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

---

## 요약
1. **GitHub PUSH**: 배포 시도는 자동으로 이루어집니다.
2. **배포 성공 여부**: GitHub Secrets에 Supabase 정보를 등록하고 설정 파일을 수정해야 **완벽하게** 작동합니다.

이 조치들을 지금 바로 진행해 드릴까요?
