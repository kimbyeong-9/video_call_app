-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- webrtc_signals 테이블만 생성 (video_calls는 이미 존재)
-- Supabase SQL Editor에 복사하여 실행하세요
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. webrtc_signals 테이블 생성
CREATE TABLE IF NOT EXISTS public.webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_call_id ON public.webrtc_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_created_at ON public.webrtc_signals(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- 4. 기존 RLS 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Users can view signals for their calls" ON public.webrtc_signals;
DROP POLICY IF EXISTS "Users can insert signals for their calls" ON public.webrtc_signals;

-- 5. RLS 정책 생성
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

-- 6. Realtime 활성화 (webrtc_signals만)
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 확인 쿼리
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 테이블 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'webrtc_signals';

-- RLS 정책 확인
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'webrtc_signals';

-- Realtime 구독 확인
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('video_calls', 'webrtc_signals');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 완료!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
