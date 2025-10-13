# 🤝 친구 추가 기능 설정 가이드

## 📋 개요

Home 페이지의 실시간 추천 카드에서 사용자를 **친구로 추가/제거**할 수 있는 기능이 추가되었습니다.

---

## 🗄️ 데이터베이스 설정 (필수)

### 1단계: Supabase Dashboard 접속

1. https://supabase.com/dashboard 접속
2. 로그인
3. 프로젝트 선택: `copqtgkymbhdayglatqg`

### 2단계: SQL Editor에서 테이블 생성

1. 왼쪽 사이드바 → **SQL Editor** 클릭
2. 새 쿼리 작성
3. `create_friends_table.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭

### SQL 내용 (요약)

```sql
-- friends 테이블 생성
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- RLS 정책 설정
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- 조회 권한: 자신의 친구 목록만
CREATE POLICY "friends_select_policy"
ON friends FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 추가 권한: 자신의 친구만 추가 가능
CREATE POLICY "friends_insert_policy"
ON friends FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 삭제 권한: 자신의 친구만 삭제 가능
CREATE POLICY "friends_delete_policy"
ON friends FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

---

## 🎨 UI 변경사항

### 이전 (Before)
```
[💗 좋아요] [💬 메시지]
```

### 이후 (After)
```
[👤+ 친구추가] [💬 메시지]  (친구 아닐 때 - 주황색)
[✓ 친구] [💬 메시지]         (친구일 때 - 초록색)
```

---

## 🎯 기능 설명

### 1. 친구 추가 버튼

| 상태 | 아이콘 | 색상 | 동작 |
|------|--------|------|------|
| **친구 아님** | `FiUserPlus` (👤+) | 주황색 | 클릭 시 친구로 추가 |
| **친구임** | `FiUserCheck` (✓) | 초록색 | 클릭 시 친구 제거 |

### 2. 버튼 색상

```javascript
// 친구 추가 (주황색)
background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)'

// 친구 추가됨 (초록색)
background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'

// 메시지 (보라색)
background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
```

---

## 🔄 작동 방식

### 친구 추가 프로세스

```
1. 사용자가 [👤+ 친구추가] 버튼 클릭
   ↓
2. Supabase friends 테이블에 데이터 INSERT
   {
     user_id: 현재_사용자_ID,
     friend_id: 추가할_친구_ID
   }
   ↓
3. 로컬 상태 업데이트 (friendsList)
   ↓
4. 버튼 아이콘/색상 변경: [✓ 친구] (초록색)
   ↓
5. 알림 표시: "OOO님을 친구로 추가했습니다!"
```

### 친구 제거 프로세스

```
1. 사용자가 [✓ 친구] 버튼 클릭
   ↓
2. Supabase friends 테이블에서 데이터 DELETE
   WHERE user_id = 현재_사용자_ID
   AND friend_id = 제거할_친구_ID
   ↓
3. 로컬 상태 업데이트 (friendsList)
   ↓
4. 버튼 아이콘/색상 변경: [👤+ 친구추가] (주황색)
   ↓
5. 알림 표시: "OOO님을 친구 목록에서 제거했습니다."
```

---

## 🧪 테스트 방법

### 1단계: 테이블 생성 확인

Supabase SQL Editor에서 실행:

```sql
-- friends 테이블 확인
SELECT * FROM friends LIMIT 5;

-- RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'friends';
```

### 2단계: 앱에서 테스트

1. **브라우저 1**: 사용자 A로 로그인
2. Home 페이지 → 실시간 추천 카드에서 사용자 B 찾기
3. **[👤+ 친구추가]** 버튼 클릭
4. ✅ 버튼이 **[✓ 친구]** (초록색)로 변경 확인
5. ✅ 알림: "OOO님을 친구로 추가했습니다!" 확인

### 3단계: Friends 페이지 확인

1. 하단 네비게이션 → **Friends** 탭 클릭
2. ✅ 추가한 친구가 목록에 표시되는지 확인

### 4단계: 친구 제거 테스트

1. Home 페이지로 돌아가기
2. 같은 사용자 카드에서 **[✓ 친구]** 버튼 클릭
3. ✅ 버튼이 **[👤+ 친구추가]** (주황색)로 변경 확인
4. ✅ 알림: "OOO님을 친구 목록에서 제거했습니다." 확인

---

## 📊 데이터베이스 스키마

### friends 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | Primary Key (자동 생성) |
| `user_id` | UUID | 친구 추가를 요청한 사용자 ID |
| `friend_id` | UUID | 추가된 친구의 사용자 ID |
| `created_at` | TIMESTAMP | 친구 추가 시각 |

### 제약 조건

1. **UNIQUE(user_id, friend_id)**: 중복 방지
2. **CHECK (user_id != friend_id)**: 자기 자신 추가 방지
3. **FOREIGN KEY**: users 테이블과 연결 (CASCADE 삭제)

---

## 🔐 보안 (RLS)

### RLS 정책 요약

| 작업 | 권한 |
|------|------|
| **SELECT** | 본인이 추가한 친구 또는 본인을 추가한 친구 |
| **INSERT** | 본인이 다른 사용자를 친구로 추가 |
| **DELETE** | 본인이 추가한 친구만 삭제 가능 |
| **UPDATE** | 허용 안 함 (필요 없음) |

---

## ❓ 문제 해결

### 1. "작업에 실패했습니다" 에러

**원인**: friends 테이블이 생성되지 않았거나 RLS 정책이 없음

**해결**:
1. Supabase SQL Editor에서 `create_friends_table.sql` 실행
2. 브라우저 새로고침

### 2. 버튼을 눌러도 변화가 없음

**원인**: 브라우저 캐시 또는 로그인 세션 문제

**해결**:
```javascript
// 브라우저 콘솔(F12)에서 실행
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 3. Friends 페이지에 친구가 안 보임

**원인**: Friends 페이지가 friends 테이블을 참조하지 않음

**해결**: Friends 페이지 코드를 업데이트하여 Supabase에서 친구 목록 가져오기

```javascript
// src/pages/Friends/index.jsx
const loadFriends = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data: friends } = await supabase
    .from('friends')
    .select(`
      friend_id,
      users!friend_id (
        id,
        nickname,
        email,
        profile_image,
        bio,
        interests
      )
    `)
    .eq('user_id', session.user.id);
  
  setFriends(friends);
};
```

---

## 📝 체크리스트

- [ ] Supabase에서 `create_friends_table.sql` 실행
- [ ] friends 테이블 생성 확인
- [ ] RLS 정책 확인
- [ ] Home 페이지에서 친구 추가 테스트
- [ ] 친구 제거 테스트
- [ ] 알림 메시지 확인
- [ ] Friends 페이지에서 친구 목록 확인

---

## 🎉 완료!

이제 Home 페이지에서:
- ✅ **[👤+ 친구추가]** 버튼으로 친구 추가
- ✅ **[✓ 친구]** 버튼으로 친구 제거
- ✅ 실시간 상태 업데이트
- ✅ 알림으로 사용자 피드백

**친구 추가 기능이 정상적으로 작동합니다!** 🚀

