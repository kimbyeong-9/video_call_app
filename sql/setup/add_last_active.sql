-- =====================================================
-- users 테이블에 last_active_at 필드 추가
-- =====================================================

-- 1. last_active_at 컬럼 추가 (이미 있으면 무시)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 기존 사용자들의 last_active_at을 현재 시간으로 초기화
UPDATE public.users
SET last_active_at = NOW()
WHERE last_active_at IS NULL;

-- 3. 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_users_last_active_at
ON public.users(last_active_at DESC);

-- 4. 온라인 사용자 조회를 위한 함수 생성 (5분 이내 활동)
CREATE OR REPLACE FUNCTION public.get_active_users(minutes_threshold INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nickname TEXT,
  bio TEXT,
  interests TEXT[],
  profile_image TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.nickname,
    u.bio,
    u.interests,
    u.profile_image,
    u.last_active_at,
    (u.last_active_at > NOW() - INTERVAL '1 minute' * minutes_threshold) as is_active
  FROM public.users u
  WHERE u.last_active_at > NOW() - INTERVAL '1 minute' * minutes_threshold
  ORDER BY u.last_active_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS 정책 확인 (users 테이블에 UPDATE 권한 필요)
-- 이미 있는 정책 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Users can update own last_active'
  ) THEN
    CREATE POLICY "Users can update own last_active"
      ON public.users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 6. 검증 쿼리 (실행 후 확인용)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'last_active_at';

-- 활성 사용자 수 확인
SELECT COUNT(*) as active_users_count
FROM public.users
WHERE last_active_at > NOW() - INTERVAL '5 minutes';
