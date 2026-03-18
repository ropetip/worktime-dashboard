---
name: Supabase 및 DBeaver 설정 지원 스킬
description: 사용자가 Supabase 프로젝트를 생성하고 DBeaver와 연결할 수 있도록 안내하는 지침서입니다.
---

# Supabase & DBeaver 설정 스킬 (Skill)

이 스킬은 사용자가 클라우드 데이터베이스인 Supabase를 설정하고 로컬 도구인 DBeaver와 연결하는 과정을 전문적으로 지원하기 위해 만들어졌습니다.

## 핵심 가이드라인
1. **클라우드 서비스 이해**: Supabase는 설치형 DB가 아니라 클라우드 서비스(BaaS)임을 명확히 안내합니다. 로컬 PC에 별도의 DB 서버를 설치할 필요가 없음을 강조합니다.
2. **보안 우선**: `anon key`와 `service_role key`의 차이를 설명하고, DBeaver 연결 시에는 개인별 `Database Password`를 안전하게 관리하도록 안내합니다.
3. **DBeaver 설정 최적화**: Supabase는 외부 접속 시 `SSL Mode` 설정을 필수로 요구할 수 있으므로, `require` 설정을 항상 권장합니다.

## 주요 지침
- **계정 생성**: [Supabase 공식 사이트](https://supabase.com)에서 GitHub 계정을 통한 간편 가입을 권장합니다.
- **프로젝트 생성**: 리전을 한국(Seoul)으로 설정하고, 데이터베이스 암호를 기억하도록 유도합니다.
- **연결 정보 추출**: `Project Settings > Database` 메뉴에서 `Host`, `Port`, `Database name`, `User` 정보를 확인하는 경로를 안내합니다.
- **SQL 실행**: Supabase 대시보드의 `SQL Editor`와 DBeaver의 `SQL 편집기` 활용법을 각각 설명합니다.

## 문제 해결 (Troubleshooting)
- **연결 실패 시**: 방화벽 문제 또는 SSL 설정을 먼저 확인하도록 합니다.
- **권한 오류**: 사용하는 계정이 `postgres` 또는 적절한 권한을 가진 사용자(User)인지 확인합니다.
