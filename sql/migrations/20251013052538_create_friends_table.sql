-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- friends 테이블 생성 (친구 목록 기능)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- friends 테이블 생성
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지: 같은 사용자 조합은 한 번만 존재
  UNIQUE(user_id, friend_id),
  
  -- 자기 자신을 친구로 추가 방지
  CHECK (user_id != friend_id)
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 친구 목록만 조회 가능
DROP POLICY IF EXISTS "friends_select_policy" ON friends;
CREATE POLICY "friends_select_policy"
ON friends
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS 정책: 사용자는 자신의 친구만 추가 가능
DROP POLICY IF EXISTS "friends_insert_policy" ON friends;
CREATE POLICY "friends_insert_policy"
ON friends
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 친구만 삭제 가능
DROP POLICY IF EXISTS "friends_delete_policy" ON friends;
CREATE POLICY "friends_delete_policy"
ON friends
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
