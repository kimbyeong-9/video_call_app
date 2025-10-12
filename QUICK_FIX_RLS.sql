-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚨 긴급 수정: RLS 완전 비활성화 (개발 환경용)
-- 이 SQL을 Supabase SQL Editor에 복사하여 실행하세요
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. users 테이블 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. messages 테이블 RLS 비활성화
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 확인용 쿼리
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- RLS 상태 확인 (결과에서 rowsecurity가 false여야 함)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'messages');
