-- Supabase SQL Editor에서 아래 쿼리를 실행해 주세요.

-- 1. schedules 테이블에 sts 컬럼 추가
-- 기존 데이터가 영향을 받지 않도록 기본값 'C' (Create)를 설정합니다.
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS sts VARCHAR(1) DEFAULT 'C';

-- 2. members 테이블에 sts 컬럼 추가
-- 동일하게 기본값 'C'를 설정합니다.
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS sts VARCHAR(1) DEFAULT 'C';

-- (선택) 기존 데이터에 확실하게 sts='C'를 업데이트하고 싶으신 경우 아래 쿼리 실행
UPDATE public.schedules SET sts = 'C' WHERE sts IS NULL;
UPDATE public.members SET sts = 'C' WHERE sts IS NULL;
