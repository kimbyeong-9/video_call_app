# 영상통화 기능 테스트 체크리스트 ✅

## 📋 사전 준비

### ✅ Supabase 설정 완료 확인
- [ ] `video_calls` 테이블 생성됨
- [ ] `webrtc_signals` 테이블 생성됨
- [ ] RLS 정책 적용됨
- [ ] Realtime 활성화됨 (Database → Replication)

### ✅ 테스트 환경 준비
- [ ] 두 개의 브라우저 창 (또는 다른 디바이스)
- [ ] 카메라/마이크 권한 허용
- [ ] 개발자 도구 콘솔 열기 (F12)

---

## 🧪 테스트 절차

### Step 1: A 사용자 (발신자) 준비
```
1. Chrome 일반 모드 접속
2. 로그인 (예: testA@example.com)
3. Live 페이지 이동
4. F12 눌러서 콘솔 열기
5. 다음 로그 확인:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔵 Live - 현재 사용자: testA
   🔵 Live - User ID: (UUID)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2: B 사용자 (수신자) 준비
```
1. Chrome 시크릿 모드 접속
2. 로그인 (예: testB@example.com)
3. 아무 페이지나 이동 (Home이든 Live든)
4. F12 눌러서 콘솔 열기
5. 다음 로그 확인:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔵 [IncomingCallModal] 수신 통화 구독 시작
   🔵 [IncomingCallModal] User ID: (B의 UUID)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔵 [WebRTC] 수신 통화 구독 설정
   🔵 [WebRTC] User ID: (B의 UUID)
   ✅ [WebRTC] ✨ 수신 통화 구독 완료! 대기 중...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**❌ 만약 위 로그가 안 나온다면:**
- B가 제대로 로그인 안 됨
- currentUserId가 null
- 새로고침 필요

### Step 3: 영상통화 시작 (A → B)
```
1. A 사용자 창에서 Live 페이지
2. B 사용자 카드 찾기
3. "영상통화" 버튼 클릭
4. A의 콘솔에 다음 로그 확인:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔵 Live - 통화 시작 요청
   🔵 Live - 발신자 ID: (A의 UUID)
   🔵 Live - 수신자: testB / (B의 UUID)
   ✅ Live - 통화 생성 완료!
   ✅ Live - Call ID: (UUID)
   ✅ Live - Status: pending
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**❌ 만약 에러가 난다면:**
- "통화를 시작할 수 없습니다: ..." 메시지 확인
- Supabase SQL이 제대로 실행되지 않았거나
- RLS 정책 문제일 가능성

### Step 4: 수신 확인 (B 화면)
```
1. B 사용자 창을 확인
2. B의 콘솔에 다음 로그가 나타나야 함:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎉 [WebRTC] 📞 NEW CALL INSERT 감지!!!
   🎉 [WebRTC] Call ID: (UUID)
   🎉 [WebRTC] Caller ID: (A의 UUID)
   🎉 [WebRTC] Receiver ID: (B의 UUID)
   🎉 [WebRTC] Status: pending
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎉 [IncomingCallModal] 수신 통화 감지!!!
   🎉 Call ID: (UUID)
   🎉 Caller: testA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━

3. B의 화면에 모달이 떠야 함:
   ┌─────────────────────────┐
   │                         │
   │      👤 (프로필)        │
   │                         │
   │      testA              │
   │   영상통화 걸려옴...     │
   │                         │
   │  [거절]      [수락]     │
   │                         │
   └─────────────────────────┘
```

**❌ 만약 로그가 안 나온다면:**
- **가장 큰 문제: Realtime이 활성화 안 됨**
- Supabase Dashboard → Database → Replication 확인
- `video_calls` 테이블의 Realtime 체크박스 확인

### Step 5: 통화 수락
```
1. B 사용자: "수락" 버튼 클릭
2. B의 화면: 영상통화 페이지로 이동
3. 카메라/마이크 권한 허용
4. A의 화면: B의 영상이 보여야 함
5. B의 화면: A의 영상이 보여야 함
```

---

## ❌ 문제 해결

### 문제 1: B에게 알림이 안 감
**증상:** A가 전화를 걸어도 B의 콘솔에 아무 로그도 안 나옴

**원인:**
- Realtime이 활성화되지 않음

**해결:**
1. Supabase Dashboard
2. Database → Replication (또는 Publications)
3. `video_calls` 찾아서 체크박스 활성화
4. Save
5. 테스트 다시

---

### 문제 2: "통화를 시작할 수 없습니다" 에러
**증상:** A가 버튼 클릭하면 에러 알림

**원인:**
- `video_calls` 테이블이 없음
- RLS 정책 문제

**해결:**
1. SQL Editor에서:
   ```sql
   SELECT * FROM video_calls;
   ```
2. 테이블이 없다는 에러가 나오면 → SQL 다시 실행
3. "new row violates row-level security policy" 에러면 → RLS 정책 다시 설정

---

### 문제 3: 카메라가 안 켜짐
**증상:** 영상통화 페이지에서 검은 화면

**원인:**
- 카메라/마이크 권한 거부됨

**해결:**
1. 브라우저 주소창 옆 🎥 아이콘 클릭
2. "항상 허용" 선택
3. 페이지 새로고침

---

### 문제 4: currentUserId가 null
**증상:** B의 콘솔에 "⚠️ currentUserId 없음" 나옴

**원인:**
- B가 제대로 로그인 안 됨
- Context가 제대로 전달 안 됨

**해결:**
1. B 사용자 로그아웃
2. 다시 로그인
3. 페이지 새로고침

---

## 🎉 성공 체크리스트

- [ ] A가 버튼 클릭하면 A의 콘솔에 "✅ 통화 생성 완료" 나옴
- [ ] B의 콘솔에 "🎉 NEW CALL INSERT 감지" 나옴
- [ ] B의 화면에 수신 모달이 뜸
- [ ] B가 수락하면 양쪽에 영상이 보임
- [ ] 음소거/비디오 끄기 버튼이 작동함
- [ ] 통화 종료 버튼이 작동함

---

## 📊 최종 확인

### Supabase Tables 확인
```sql
-- 통화 기록 확인
SELECT * FROM video_calls ORDER BY created_at DESC LIMIT 10;

-- 시그널 확인
SELECT * FROM webrtc_signals ORDER BY created_at DESC LIMIT 10;
```

### 예상 결과
```
video_calls:
id        | caller_id | receiver_id | status  | created_at
----------|-----------|-------------|---------|------------
abc-123   | A의ID     | B의ID       | pending | 2024-...

webrtc_signals:
id        | call_id  | sender_id | signal_type | created_at
----------|----------|-----------|-------------|------------
xyz-456   | abc-123  | A의ID     | offer       | 2024-...
```

---

**모든 단계가 완료되면 영상통화가 정상 작동합니다! 🎉**

