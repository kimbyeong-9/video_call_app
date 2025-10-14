-- RLS 보안 문제 해결을 위한 SQL 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 모든 public 테이블에 RLS 활성화
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책들이 이미 존재하는지 확인
-- (이미 정책들이 있다면 RLS만 활성화하면 됩니다)

-- 3. 정책 확인 쿼리 (실행 후 결과 확인)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('chat_rooms', 'chat_participants', 'messages', 'message_read_status')
ORDER BY tablename, policyname;

-- 4. RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('chat_rooms', 'chat_participants', 'messages', 'message_read_status')
ORDER BY tablename;
