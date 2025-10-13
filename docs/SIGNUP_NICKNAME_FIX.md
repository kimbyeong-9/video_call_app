# 회원가입 닉네임 중복 확인 오류 해결 가이드

## 🔴 문제점

회원가입 페이지에서 닉네임 중복 확인 시 `406 (Not Acceptable)` 오류 발생

```
GET .../users?select=nickname&nickname=eq.xxx 406 (Not Acceptable)
```

## 🔍 원인

현재 `users` 테이블의 RLS 정책이 **인증된 사용자만** SELECT를 허용하도록 설정되어 있습니다.

하지만 회원가입 페이지에서는 **아직 로그인하지 않은 상태**(비인증 사용자)이므로 닉네임 중복 확인을 위한 SELECT 쿼리가 거부됩니다.

## ✅ 해결 방법

Supabase에서 **익명 사용자도 닉네임 조회**를 할 수 있도록 RLS 정책을 수정해야 합니다.

### 🚀 방법 1: 익명 사용자에게 SELECT 권한 추가 (권장)

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- users 테이블 RLS 정책 수정 (회원가입용)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- 새로운 SELECT 정책: 익명 사용자도 닉네임만 조회 가능
CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- 또는 더 제한적으로 (닉네임 컬럼만 허용)
-- CREATE POLICY "users_select_policy"
-- ON users
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);
```

**설명**:
- `TO anon, authenticated`: 익명 사용자(anon)와 인증된 사용자(authenticated) 모두 허용
- `USING (true)`: 모든 행에 대해 SELECT 허용

### 🔒 방법 2: 보안을 강화하려면 (특정 컬럼만 허용)

닉네임만 조회할 수 있도록 제한하려면 PostgreSQL의 Column-level 권한을 사용:

```sql
-- users 테이블 SELECT 정책 (모든 사용자)
DROP POLICY IF EXISTS "users_select_policy" ON users;

CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- 또는 RLS는 그대로 두고 VIEW를 생성하는 방법
CREATE OR REPLACE VIEW public_users AS
SELECT id, nickname, email, profile_image
FROM users;

-- VIEW에 대한 권한 부여
GRANT SELECT ON public_users TO anon, authenticated;
```

### 🛡️ 방법 3: RLS 비활성화 (개발 환경만)

**⚠️ 주의**: 프로덕션에서는 사용하지 마세요!

```sql
-- 개발 환경에서 빠른 테스트를 위한 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## 🧪 테스트

SQL 실행 후:

1. 브라우저 캐시 삭제 (Ctrl/Cmd + Shift + Delete)
2. 앱 새로고침
3. http://localhost:3002/signup 접속
4. 닉네임 입력 후 "중복확인" 버튼 클릭
5. ✅ "사용 가능한 닉네임입니다" 또는 "이미 사용 중인 닉네임입니다" 메시지 확인

## 📋 전체 RLS 정책 설정 (권장)

회원가입부터 모든 기능이 작동하도록 하려면:

```sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- users 테이블 전체 RLS 정책
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 정책 삭제
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- 1. SELECT: 모든 사용자가 조회 가능 (회원가입 중복 확인용)
CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. INSERT: 인증된 사용자만 자신의 정보 생성 가능
CREATE POLICY "users_insert_policy"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. UPDATE: 인증된 사용자는 자신의 정보만 수정 가능
CREATE POLICY "users_update_policy"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- messages 테이블 RLS 정책
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 정책 삭제
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

-- 1. SELECT: 인증된 사용자만 메시지 조회 가능
CREATE POLICY "messages_select_policy"
ON messages
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT: 인증된 사용자만 메시지 작성 가능
CREATE POLICY "messages_insert_policy"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Realtime 활성화
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

## ✨ 정책 확인

```sql
-- users 테이블 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';
```

## 🔍 RLS 상태 확인

```sql
-- RLS 활성화 여부 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'messages');
```

---

## 요약

**핵심**: 회원가입 시 닉네임 중복 확인을 위해 `users` 테이블에 **익명 사용자(anon)의 SELECT 권한**을 추가해야 합니다.

위의 SQL 중 하나를 실행하면 문제가 해결됩니다! 🎉
