-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- webrtc_signals 테이블에 RLS 정책 추가
-- (테이블과 Realtime은 이미 설정되어 있음)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. RLS가 비활성화되어 있다면 활성화
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (혹시 있을 경우)
DROP POLICY IF EXISTS "Users can view signals for their calls" ON public.webrtc_signals;
DROP POLICY IF EXISTS "Users can insert signals for their calls" ON public.webrtc_signals;

-- 3. SELECT 정책 생성 (조회)
CREATE POLICY "Users can view signals for their calls"
  ON public.webrtc_signals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.video_calls
      WHERE video_calls.id = webrtc_signals.call_id
      AND (video_calls.caller_id = auth.uid() OR video_calls.receiver_id = auth.uid())
    )
  );

-- 4. INSERT 정책 생성 (시그널 전송)
CREATE POLICY "Users can insert signals for their calls"
  ON public.webrtc_signals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.video_calls
      WHERE video_calls.id = call_id
      AND (video_calls.caller_id = auth.uid() OR video_calls.receiver_id = auth.uid())
    )
    AND auth.uid() = sender_id
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 확인: 정책이 제대로 생성되었는지 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
  tablename as "테이블",
  policyname as "정책명",
  cmd as "명령",
  permissive as "허용형"
FROM pg_policies
WHERE tablename = 'webrtc_signals'
ORDER BY policyname;

-- 예상 결과:
-- 테이블          | 정책명                                      | 명령     | 허용형
-- ---------------+-------------------------------------------+----------+--------
-- webrtc_signals | Users can insert signals for their calls  | INSERT   | true
-- webrtc_signals | Users can view signals for their calls    | SELECT   | true
