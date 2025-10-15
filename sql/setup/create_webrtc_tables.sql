-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 영상통화용 테이블 생성 스크립트
-- Supabase SQL Editor에 복사하여 실행하세요
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. video_calls 테이블 생성
CREATE TABLE IF NOT EXISTS public.video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 2. webrtc_signals 테이블 생성 (중요!)
CREATE TABLE IF NOT EXISTS public.webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 인덱스 생성 (성능 최적화)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- video_calls 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_receiver_id ON public.video_calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON public.video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created_at ON public.video_calls(created_at DESC);

-- webrtc_signals 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_call_id ON public.webrtc_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_created_at ON public.webrtc_signals(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS (Row Level Security) 활성화
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS 정책 생성
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- video_calls 정책 삭제 (기존 정책이 있을 경우)
DROP POLICY IF EXISTS "Users can view their own calls" ON public.video_calls;
DROP POLICY IF EXISTS "Users can create calls" ON public.video_calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON public.video_calls;

-- video_calls 정책 생성
CREATE POLICY "Users can view their own calls"
  ON public.video_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls"
  ON public.video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own calls"
  ON public.video_calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- webrtc_signals 정책 삭제 (기존 정책이 있을 경우)
DROP POLICY IF EXISTS "Users can view signals for their calls" ON public.webrtc_signals;
DROP POLICY IF EXISTS "Users can insert signals for their calls" ON public.webrtc_signals;

-- webrtc_signals 정책 생성
CREATE POLICY "Users can view signals for their calls"
  ON public.webrtc_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.video_calls
      WHERE video_calls.id = webrtc_signals.call_id
      AND (video_calls.caller_id = auth.uid() OR video_calls.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert signals for their calls"
  ON public.webrtc_signals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.video_calls
      WHERE video_calls.id = call_id
      AND (video_calls.caller_id = auth.uid() OR video_calls.receiver_id = auth.uid())
    )
    AND auth.uid() = sender_id
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Realtime 구독 활성화 (매우 중요!)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- video_calls 테이블 Realtime 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;

-- webrtc_signals 테이블 Realtime 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 확인 쿼리
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 테이블 생성 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('video_calls', 'webrtc_signals');

-- RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('video_calls', 'webrtc_signals')
ORDER BY tablename, policyname;

-- Realtime 구독 확인
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('video_calls', 'webrtc_signals');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 완료!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
