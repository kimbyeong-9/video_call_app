-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- webrtc_signals 테이블 설정 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 테이블 존재 및 RLS 상태 확인
SELECT
  tablename,
  rowsecurity as "RLS 활성화",
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as "정책 개수"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('video_calls', 'webrtc_signals');

-- 2. RLS 정책 상세 확인
SELECT
  tablename as "테이블",
  policyname as "정책명",
  cmd as "명령"
FROM pg_policies
WHERE tablename IN ('video_calls', 'webrtc_signals')
ORDER BY tablename, policyname;

-- 3. Realtime 구독 확인
SELECT
  tablename as "Realtime 활성화된 테이블"
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('video_calls', 'webrtc_signals');

-- 4. 테이블 구조 확인
SELECT
  column_name as "컬럼명",
  data_type as "타입",
  is_nullable as "NULL 허용"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'webrtc_signals'
ORDER BY ordinal_position;

-- 5. 인덱스 확인
SELECT
  indexname as "인덱스명",
  indexdef as "정의"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'webrtc_signals';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 테스트: 간단한 데이터 조회 (에러 없이 실행되어야 함)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
  COUNT(*) as "총 시그널 개수"
FROM webrtc_signals;

SELECT
  COUNT(*) as "총 통화 개수"
FROM video_calls;
