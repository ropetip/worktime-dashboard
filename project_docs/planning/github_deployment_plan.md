# GitHub 저장소 업로드 및 배포 계획

이 문서는 완성된 근무 현황 대시보드를 GitHub에 업로드하고, 실제 접속 가능한 URL로 배포하는 단계를 설명합니다.

## 1. 개요
- **목표**: 로컬 프로젝트를 GitHub 저장소에 업로드하고 GitHub Pages로 배포
- **대상 경로**: `d:\ai_project\worktime-dashboard`

## 2. 세부 절차

### 단계 1: 프로젝트 설정 보완
- [x] `vite.config.js`에 `base: './'` 설정 확인 (이미 완료)
- [x] `.gitignore` 파일에 `node_modules`, `dist` 등 제외 설정 확인 (이미 완료)

### 단계 2: Git 초기화 및 커밋
로컬 터미널(`d:\ai_project\worktime-dashboard`)에서 다음 명령어를 실행합니다.
1. `git init`
2. `git add .`
3. `git commit -m "Initial commit: React migration complete"`
4. `git branch -M main` (기본 브랜치명을 main으로 설정)

### 단계 3: GitHub 저장소 연결 및 업로드
1. [GitHub](https://github.com/new)에서 저장소를 새로 만듭니다 (예: `worktime-dashboard`).
2. 아래 명령어로 로컬과 GitHub을 연결합니다.
   - `git remote add origin https://github.com/사용자아이디/worktime-dashboard.git`
3. `git push -u origin main` 명령어로 실제 파일을 올립니다.

### 단계 4: 배포 (GitHub Pages)
배포에는 GitHub Actions를 사용하는 것이 가장 깔끔합니다. 
1. `Settings` -> `Pages` -> `Build and deployment` -> `Source` -> `GitHub Actions` 선택
2. 제공되는 Vite 전용 템플릿을 선택하거나 `.github/workflows/deploy.yml` 파일을 생성하면 코드를 올릴 때마다 자동으로 사이트가 업데이트됩니다.

## 3. 유의 사항
- GitHub 계정이 필요하며, 저장소는 'Public'으로 생성해야 배포가 쉽습니다.
- 배포가 완료되면 `https://사용자아이디.github.io/worktime-dashboard/` 주소로 접속 가능합니다.
