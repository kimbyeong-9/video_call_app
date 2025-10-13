-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 회원가입 닉네임 중복 확인 RLS 정책 수정
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 users 테이블 SELECT 정책 삭제
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- 새로운 SELECT 정책: 익명 사용자도 조회 가능 (회원가입 중복 확인용)
CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- 확인: 정책이 제대로 생성되었는지 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users';

