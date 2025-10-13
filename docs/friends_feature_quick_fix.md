# 🚀 친구 기능 즉시 해결 가이드

## ❌ 현재 문제

```
Could not find the table 'public.friends' in the schema cache
```

**원인**: Supabase에 friends 테이블이 없음

---

## ✅ 해결 (3분)

### 방법 1: Supabase Dashboard (추천)

**1. 브라우저에서 실행:**
```
https://supabase.com/dashboard/project/copqtgkymbhdayglatqg/sql/new
```
→ 위 링크를 클릭하면 바로 SQL Editor가 열립니다!

**2. 아래 SQL 복사 후 붙여넣기:**

```sql
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends_select_policy" ON friends;
CREATE POLICY "friends_select_policy"
ON friends FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "friends_insert_policy" ON friends;
CREATE POLICY "friends_insert_policy"
ON friends FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "friends_delete_policy" ON friends;
CREATE POLICY "friends_delete_policy"
ON friends FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

**3. Run 버튼 클릭**

**4. 브라우저 새로고침 (F5)**

---

### 방법 2: 수동 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트: `copqtgkymbhdayglatqg` 선택
3. 왼쪽 메뉴 → **SQL Editor** 클릭
4. 위의 SQL 복사 & 붙여넣기
5. **Run** 클릭

---

## 🧪 테스트

**1. 브라우저 새로고침 (Ctrl+R 또는 F5)**

**2. Home 페이지 테스트:**
```
http://localhost:3000/
→ 실시간 추천 카드 클릭
→ [👤+ 친구추가] 버튼 클릭
→ ✅ "OOO님을 친구로 추가했습니다!" 확인
```

**3. Friends 페이지 확인:**
```
http://localhost:3000/friends
→ ✅ 추가한 친구가 목록에 표시됨
→ ✅ 오류 없음
```

---

## 📊 동작 확인

Supabase SQL Editor에서 확인:

```sql
-- friends 테이블 확인
SELECT * FROM friends;

-- 테이블 구조 확인
\d friends
```

---

## 🎯 완료 체크리스트

- [ ] Supabase SQL 실행
- [ ] "Success" 메시지 확인
- [ ] 브라우저 새로고침
- [ ] Home 페이지에서 친구 추가 테스트
- [ ] Friends 페이지에서 친구 목록 확인
- [ ] 404 오류 사라짐 확인

---

## 💡 빠른 링크

| 항목 | 링크 |
|------|------|
| **SQL Editor (직접)** | https://supabase.com/dashboard/project/copqtgkymbhdayglatqg/sql/new |
| **Dashboard** | https://supabase.com/dashboard/project/copqtgkymbhdayglatqg |
| **Table Editor** | https://supabase.com/dashboard/project/copqtgkymbhdayglatqg/editor |

---

## ✅ 완료!

SQL을 실행하면 **즉시** 모든 기능이 작동합니다! 🚀

- ✅ 친구 추가 기능
- ✅ 친구 제거 기능
- ✅ Friends 페이지 목록
- ✅ 404 오류 해결

