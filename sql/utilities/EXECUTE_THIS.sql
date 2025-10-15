-- =====================================================
-- 🚀 이 SQL을 Supabase Dashboard에서 실행해주세요
-- =====================================================
-- 경로: Supabase Dashboard → SQL Editor → New Query
-- 전체 내용을 복사해서 붙여넣고 "RUN" 버튼 클릭
-- =====================================================

-- 1️⃣ last_active_at 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2️⃣ 기존 사용자들의 last_active_at 초기화
UPDATE public.users
SET last_active_at = NOW()
WHERE last_active_at IS NULL;

-- 3️⃣ 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_users_last_active_at
ON public.users(last_active_at DESC);

-- 4️⃣ 검증: last_active_at 컬럼이 추가되었는지 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'last_active_at';

-- 5️⃣ 검증: 현재 모든 사용자 수 확인
SELECT COUNT(*) as total_users FROM public.users;

-- ✅ 성공하면 아래와 같은 결과가 나와야 합니다:
-- column_name      | data_type                   | is_nullable | column_default
-- last_active_at   | timestamp with time zone    | YES         | now()
