-- =====================================================
-- 영상통화 앱 Supabase 데이터베이스 스키마
-- =====================================================

-- 1. users 테이블 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  bio TEXT,
  interests TEXT[] DEFAULT '{}',
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. messages 테이블 (채팅 메시지)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. video_calls 테이블 (영상통화 정보)
CREATE TABLE IF NOT EXISTS public.video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, ringing, active, ended, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 4. webrtc_signals 테이블 (WebRTC 시그널링)
CREATE TABLE IF NOT EXISTS public.webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- offer, answer, ice-candidate
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성 (성능 최적화)
-- =====================================================

-- messages 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- video_calls 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_receiver_id ON public.video_calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON public.video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created_at ON public.video_calls(created_at DESC);

-- webrtc_signals 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_call_id ON public.webrtc_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_created_at ON public.webrtc_signals(created_at DESC);

-- =====================================================
-- RLS (Row Level Security) 정책 활성화
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS 정책 생성
-- =====================================================

-- users 정책
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- messages 정책
CREATE POLICY "Users can view messages in their rooms"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- video_calls 정책
CREATE POLICY "Users can view their own calls"
  ON public.video_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls"
  ON public.video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own calls"
  ON public.video_calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- webrtc_signals 정책
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

-- =====================================================
-- Storage 버킷 생성 (프로필 이미지용)
-- =====================================================
-- 이 부분은 Supabase 대시보드에서 수동으로 생성해야 합니다:
-- 1. Storage 메뉴로 이동
-- 2. "New bucket" 클릭
-- 3. Name: "avatars", Public: true로 설정

-- =====================================================
-- 실시간 구독 활성화
-- =====================================================

-- messages 테이블 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- video_calls 테이블 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;

-- webrtc_signals 테이블 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;

-- users 테이블 실시간 구독 활성화 (Live 페이지용)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- =====================================================
-- 트리거 함수 (updated_at 자동 업데이트)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블에 updated_at 트리거 추가
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 이메일 자동 확인 함수 (개발 환경용)
-- =====================================================

CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email = user_email AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 완료!
-- =====================================================
-- 이 스키마를 Supabase SQL Editor에 복사하여 실행하세요.
-- 또는 Supabase CLI를 사용하여 적용할 수 있습니다:
-- supabase db push
