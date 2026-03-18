# GitHub Pages 배포 시 Supabase 환경 변수 설정 구현 계획

GitHub Pages로의 자동 배포(CI/CD) 과정에서 Supabase 연동 정보가 누락되지 않도록 설정하는 계획입니다.

## 목표
- GitHub에 PUSH 시 자동으로 코드가 빌드되고 배포되도록 함.
- 빌드 과정에서 GitHub Secrets에 저장된 Supabase 정보를 주입하여 배포된 사이트가 정상 동작하게 함.

## 제안된 변경 사항

### 1. `deploy.yml` 수정
- GitHub Actions의 빌드 단계(`Build`)에서 환경 변수를 주입하도록 코드를 추가합니다.

### 2. 가이드 문서 작성
- GitHub 저장소 설정(Settings) -> Secrets and variables -> Actions 메뉴에서 환경 변수를 등록하는 방법을 안내합니다.

## 수행 단계
1. [MODIFY] [.github/workflows/deploy.yml](file:///d:/ai_project/worktime-dashboard/.github/workflows/deploy.yml) 수정
2. [NEW] [project_docs/deployment_guide.md](file:///d:/ai_project/worktime-dashboard/project_docs/deployment_guide.md) 작성 (DBeaver 가이드와 마찬가지로 상세 가이드 제공)

## 검증 계획
- 작성된 YAML 파일의 구문(Syntax)이 올바른지 확인.
- 안내 문서에 필수적인 2가지 환경 변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)가 포함되었는지 확인.
