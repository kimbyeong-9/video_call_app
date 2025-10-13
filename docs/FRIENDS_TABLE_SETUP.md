# 🚨 FRIENDS 테이블 생성 필수!

## ❌ 현재 오류

```
GET .../friends?select=friend_id&user_id=eq.xxx 404 (Not Found)
Could not find the table 'public.friends' in the schema cache
```

**원인**: `friends` 테이블이 Supabase에 생성되지 않았습니다.

---

## ✅ 해결 방법 (5분 소요)

### 1단계: Supabase Dashboard 접속

1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인
3. 프로젝트 선택: `copqtgkymbhdayglatqg`

### 2단계: SQL Editor 열기

1. 왼쪽 사이드바 → **SQL Editor** 클릭
2. 새 쿼리 작성 버튼 클릭 (New query)

### 3단계: SQL 복사 & 실행

아래 SQL을 **전체 복사**하여 붙여넣기:

```sql
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

-- 확인: 테이블이 제대로 생성되었는지 확인
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'friends';
```

### 4단계: Run 버튼 클릭

- **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
- 성공 메시지 확인:
  ```
  Success. Rows returned: 1
  ```

---

## 🧪 테스트

SQL 실행 후:

### 1. 브라우저 새로고침
```
Ctrl/Cmd + R (또는 F5)
```

### 2. Home 페이지에서 친구 추가
```
1. Home 페이지 접속
2. 실시간 추천 카드에서 [👤+ 친구추가] 클릭
3. ✅ "OOO님을 친구로 추가했습니다!" 알림 확인
4. ✅ 버튼이 [✓ 친구] (초록색)로 변경 확인
```

### 3. Friends 페이지 확인
```
1. 하단 네비게이션 → Friends 탭
2. ✅ 추가한 친구가 목록에 표시됨
```

---

## 📊 테이블 확인

Supabase SQL Editor에서 실행:

```sql
-- friends 테이블 확인
SELECT * FROM friends;

-- RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'friends';
```

---

## ⚠️ 중요!

**이 SQL을 실행하지 않으면**:
- ❌ 친구 추가 버튼이 작동하지 않음
- ❌ Friends 페이지에 "Could not find table" 오류
- ❌ 404 에러 계속 발생

**SQL 실행 후**:
- ✅ 친구 추가 기능 정상 작동
- ✅ Friends 페이지 정상 표시
- ✅ 모든 기능 사용 가능

---

## 📝 체크리스트

- [ ] Supabase Dashboard 접속
- [ ] SQL Editor 열기
- [ ] SQL 복사 & 붙여넣기
- [ ] Run 버튼 클릭
- [ ] 성공 메시지 확인
- [ ] 브라우저 새로고침
- [ ] 친구 추가 테스트
- [ ] Friends 페이지 확인

---

## 🎉 완료!

SQL을 실행하면 즉시 오류가 해결됩니다! 🚀

