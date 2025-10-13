# 🔧 닉네임 중복 확인 설정 가이드

## 📋 문제 설명

회원가입 페이지에서 "중복확인" 버튼을 클릭하면 다음과 같은 오류가 발생합니다:

```
GET .../users?select=nickname&nickname=eq.xxx 406 (Not Acceptable)
```

또는

```
PGRST301: permission denied for table users
```

### 🔍 원인

Supabase의 **RLS (Row Level Security)** 정책이 **익명 사용자(anon)**의 `users` 테이블 조회를 차단하고 있습니다.

회원가입 페이지는 아직 로그인하지 않은 상태이므로 닉네임 중복을 확인할 수 없는 상태입니다.

---

## ✅ 해결 방법

### 1단계: Supabase Dashboard 접속

1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인
3. 프로젝트 선택: `copqtgkymbhdayglatqg`

### 2단계: SQL Editor 열기

1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. 새 쿼리 작성 버튼 클릭

### 3단계: SQL 실행

프로젝트 폴더에 생성된 `fix_nickname_check.sql` 파일의 내용을 복사하여 붙여넣기:

```sql
-- 기존 users 테이블 SELECT 정책 삭제
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- 새로운 SELECT 정책: 익명 사용자도 조회 가능 (회원가입 중복 확인용)
CREATE POLICY "users_select_policy"
ON users
FOR SELECT
TO anon, authenticated
USING (true);
```

4. **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

### 4단계: 결과 확인

SQL 실행 후 다음 메시지가 표시되면 성공:

```
Success. No rows returned
```

또는

```
NOTICE: drop cascades to policy users_select_policy on table users
CREATE POLICY
```

---

## 🧪 테스트

1. 브라우저에서 http://localhost:3000/signup 접속
2. 닉네임 입력 (예: `testuser123`)
3. **중복확인** 버튼 클릭
4. 다음 중 하나의 메시지가 표시되어야 합니다:
   - ✅ "사용 가능한 닉네임입니다." (녹색)
   - ❌ "이미 사용 중인 닉네임입니다." (빨간색)

---

## 🔒 보안 참고사항

### 현재 설정 (개발 환경)

```sql
TO anon, authenticated
USING (true)
```

- **anon**: 익명 사용자 (로그인하지 않은 사용자)
- **authenticated**: 로그인한 사용자
- **USING (true)**: 모든 행 조회 허용

### 프로덕션 환경에서는?

더 제한적인 정책을 사용하는 것이 좋습니다:

```sql
-- 특정 컬럼만 조회 허용 (nickname, profile_image 등)
CREATE POLICY "users_public_select_policy"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- 민감한 정보(email, phone 등)는 본인만 조회 가능
CREATE POLICY "users_private_select_policy"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

---

## 📊 현재 RLS 정책 확인

Supabase SQL Editor에서 실행:

```sql
-- users 테이블의 모든 정책 확인
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

---

## ❓ 문제 해결

### 여전히 406 오류가 발생하는 경우

1. **브라우저 캐시 삭제**
   - Chrome: Ctrl/Cmd + Shift + Delete
   - "쿠키 및 기타 사이트 데이터" 선택
   - "캐시된 이미지 및 파일" 선택
   - 삭제 후 페이지 새로고침

2. **Supabase 세션 확인**
   ```javascript
   // 브라우저 콘솔(F12)에서 실행
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. **SQL이 제대로 실행되었는지 확인**
   ```sql
   -- RLS가 활성화되어 있는지 확인
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'users';
   -- rowsecurity가 true여야 함
   ```

### 권한 오류가 계속되는 경우

개발 환경에서만 임시로 RLS를 비활성화할 수 있습니다 (⚠️ 프로덕션에서는 사용 금지):

```sql
-- 개발 환경 전용
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

다시 활성화:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## 📝 요약

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | Supabase Dashboard 접속 | ⬜ |
| 2 | SQL Editor 열기 | ⬜ |
| 3 | `fix_nickname_check.sql` 실행 | ⬜ |
| 4 | 회원가입 페이지에서 테스트 | ⬜ |
| 5 | ✅ 중복 확인 성공! | ⬜ |

---

## 🎉 완료!

이제 회원가입 페이지에서 닉네임 중복 확인이 정상적으로 작동합니다!

문제가 계속되면 브라우저 콘솔(F12)을 열고 에러 메시지를 확인하세요.

