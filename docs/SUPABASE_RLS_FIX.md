# Supabase RLS (Row Level Security) 정책 수정 가이드

## 🚀 빠른 해결 (권장)

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `copqtgkymbhdayglatqg`
3. 좌측 메뉴 **SQL Editor** 클릭
4. 아래 SQL 전체 복사 → 붙여넣기 → **Run** 클릭

```sql
-- users와 messages 테이블 RLS 비활성화 (개발 환경용)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

5. 앱에서 **로그아웃 → 다시 로그인**
6. 채팅 테스트!

---

## 문제점

현재 `messages`와 `users` 테이블에 RLS 정책이 활성화되어 있어 다음 기능들이 작동하지 않습니다:

**오류 메시지들**:
- `new row violates row-level security policy for table "messages"`
- `GET .../users?select=nickname&nickname=eq.xxx 406 (Not Acceptable)`

이로 인해:
1. ❌ 메시지 전송 불가
2. ❌ 사용자 정보 조회 불가
3. ❌ 실시간 메시지 수신 불가
4. ❌ 채팅 목록 표시 불가

## 해결 방법

Supabase Dashboard에서 다음 SQL을 실행하여 RLS 정책을 추가해야 합니다.

### 1단계: Supabase Dashboard 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `copqtgkymbhdayglatqg`
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2단계: RLS 정책 추가 (전체 복사 후 실행)

아래 SQL을 **전체 복사**하여 Supabase SQL Editor에서 실행하세요:

```sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. users 테이블 RLS 정책 설정 (먼저 실행!)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 정책 삭제
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- SELECT 정책: 인증된 사용자는 모든 사용자 정보를 읽을 수 있음
CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO authenticated
USING (true);

-- INSERT 정책: 인증된 사용자는 자신의 정보만 생성 가능
CREATE POLICY "users_insert_policy"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE 정책: 인증된 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "users_update_policy"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. messages 테이블 RLS 정책 설정
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 정책 삭제
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- SELECT 정책: 인증된 사용자는 모든 메시지를 읽을 수 있음
CREATE POLICY "messages_select_policy"
ON messages
FOR SELECT
TO authenticated
USING (true);

-- INSERT 정책: 인증된 사용자는 자신의 메시지만 작성할 수 있음
CREATE POLICY "messages_insert_policy"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책: 인증된 사용자는 자신의 메시지만 수정할 수 있음
CREATE POLICY "messages_update_policy"
ON messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE 정책: 인증된 사용자는 자신의 메시지만 삭제할 수 있음
CREATE POLICY "messages_delete_policy"
ON messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Realtime 활성화
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

### 3단계: RLS 활성화 확인

```sql
-- RLS가 활성화되어 있는지 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'messages';

-- 결과: rowsecurity = true 이어야 함
```

### 4단계: 정책 확인

```sql
-- 생성된 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

## 대안: RLS 완전 비활성화 (개발 환경에서만 권장)

**⚠️ 주의**: 프로덕션 환경에서는 절대 사용하지 마세요! 보안에 취약합니다.

```sql
-- 개발 환경에서 빠른 테스트를 위한 RLS 비활성화
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

### RLS 재활성화 (필요시)

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 추가로 확인해야 할 사항

### 1. Realtime 활성화 확인

Supabase Dashboard에서:
1. 좌측 메뉴에서 **Database** > **Replication** 클릭
2. `messages` 테이블과 `users` 테이블에 **체크 표시**가 되어 있는지 확인
3. 체크되어 있지 않다면 체크 후 **Save** 클릭

### 2. 정책이 제대로 적용되었는지 확인

```sql
-- users 테이블 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'users';

-- messages 테이블 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

각 테이블에 대해 SELECT, INSERT, UPDATE 정책이 표시되어야 합니다.

## 테스트

SQL 실행 후, 앱에서 다음을 테스트하세요:

1. ✅ 메시지 전송이 정상적으로 작동하는지
2. ✅ 상대방이 실시간으로 메시지를 받는지
3. ✅ 채팅 목록이 정상적으로 표시되는지

## 문제가 계속되는 경우

1. 브라우저 캐시 삭제
2. 앱 재시작
3. 로그아웃 후 다시 로그인
4. 개발자 콘솔에서 에러 메시지 확인
