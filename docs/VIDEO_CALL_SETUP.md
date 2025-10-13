# 영상통화 기능 구현 완료 ✅

React + Supabase + WebRTC를 사용한 영상통화 기능이 구현되었습니다.

## 📋 구현 내용

### 1. **Supabase 테이블 스키마**
- `video_calls`: 통화 세션 관리
- `webrtc_signals`: WebRTC 시그널링 메시지

### 2. **WebRTC 유틸리티**
- 파일: `src/utils/webrtc.js`
- 기능: PeerConnection 관리, 시그널링, 통화 생성/종료

### 3. **영상통화 컴포넌트**
- 파일: `src/pages/VideoCall/index.jsx`
- 기능: 실시간 영상/음성 통화, 컨트롤 (음소거, 비디오 끄기, 통화 종료)

### 4. **수신 통화 알림**
- 파일: `src/components/common/IncomingCallModal.jsx`
- 기능: 실시간 수신 통화 감지 및 수락/거절

### 5. **Live 페이지 업데이트**
- 파일: `src/pages/Live/index.jsx`
- 기능: 사용자 카드에 "영상통화" 버튼 추가

---

## 🚀 설치 및 설정 방법

### Step 1: Supabase 데이터베이스 설정

**Supabase Dashboard → SQL Editor에서 다음 SQL 실행:**

```sql
-- 1. video_calls 테이블: 통화 세션 관리
CREATE TABLE video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'ringing', 'active', 'ended', 'declined')) DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. webrtc_signals 테이블: WebRTC 시그널링
CREATE TABLE webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES video_calls(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')) NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_video_calls_caller ON video_calls(caller_id);
CREATE INDEX idx_video_calls_receiver ON video_calls(receiver_id);
CREATE INDEX idx_video_calls_status ON video_calls(status);
CREATE INDEX idx_webrtc_signals_call ON webrtc_signals(call_id);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 관련 통화만 조회/수정 가능
CREATE POLICY "Users can view their own calls"
  ON video_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own calls"
  ON video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own calls"
  ON video_calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- RLS 정책: 시그널링 데이터
CREATE POLICY "Users can view signals for their calls"
  ON webrtc_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_calls
      WHERE id = call_id
      AND (caller_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert signals for their calls"
  ON webrtc_signals FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
```

### Step 2: Realtime 활성화

**Supabase Dashboard → Database → Replication에서 다음 테이블의 Realtime 활성화:**
- ✅ `video_calls`
- ✅ `webrtc_signals`

---

## 📱 사용 방법

### 1. **발신 (통화 걸기)**
1. Live 페이지에서 사용자 카드의 "영상통화" 버튼 클릭
2. 자동으로 통화 생성 및 영상통화 화면으로 이동
3. 상대방이 수락하면 연결됨

### 2. **수신 (통화 받기)**
1. 누군가 통화를 걸면 자동으로 수신 알림 모달 표시
2. "수락" 버튼 클릭 → 영상통화 시작
3. "거절" 버튼 클릭 → 통화 거절

### 3. **통화 중 컨트롤**
- 🎤 **음소거/해제**: 마이크 버튼
- 📹 **비디오 끄기/켜기**: 비디오 버튼
- 📞 **통화 종료**: 빨간색 전화 버튼

---

## 🎨 주요 기능

### ✅ WebRTC P2P 통신
- 브라우저 간 직접 연결 (peer-to-peer)
- STUN 서버를 통한 NAT traversal
- 고품질 영상/음성 통신

### ✅ Supabase Realtime 시그널링
- Offer/Answer/ICE Candidate 교환
- 실시간 통화 상태 동기화
- 수신 통화 즉시 알림

### ✅ 사용자 경험
- 아름다운 UI/UX
- 실시간 연결 상태 표시
- 원격/로컬 비디오 분리 표시

---

## 🔧 테스트 방법

### 방법 1: 같은 브라우저 (간단 테스트)
1. 일반 창에서 로그인
2. 시크릿/프라이빗 창에서 다른 계정 로그인
3. Live 페이지에서 영상통화 버튼 클릭

### 방법 2: 다른 기기 (실제 테스트)
1. 데스크톱에서 로그인
2. 모바일에서 다른 계정 로그인
3. 서로 통화 테스트

---

## 📝 참고사항

### 현재 제한사항
- **임시 사용자 데이터**: Live 페이지의 사용자는 `LiveUsersData.js`의 임시 데이터
- **실제 환경**: 실제 Supabase의 users 테이블과 연동 필요
- **테스트**: 현재는 자기 자신에게 전화하도록 설정됨 (47번 줄)

### 실제 환경 적용 시
`src/pages/Live/index.jsx` 47번 줄 수정:
```javascript
// 현재 (테스트용)
const { data: callData, error } = await videoCall.createCall(
  currentUser.id,
  currentUser.id  // 자기 자신
);

// 실제 환경
const { data: callData, error } = await videoCall.createCall(
  currentUser.id,
  receiverUser.supabaseUserId  // 실제 사용자 ID
);
```

### 카메라/마이크 권한
- 브라우저에서 카메라/마이크 권한 허용 필요
- HTTPS 환경에서만 동작 (로컬은 localhost 예외)

---

## 🛠 트러블슈팅

### 카메라가 안 켜져요
→ 브라우저 설정에서 카메라/마이크 권한 확인

### 연결이 안 돼요
→ Supabase Realtime이 활성화되어 있는지 확인

### 상대방 영상이 안 보여요
→ STUN/TURN 서버 설정 확인 (방화벽 이슈일 수 있음)

---

## 📚 추가 개선 가능 사항

1. **TURN 서버 추가**: 방화벽 환경 대응
2. **화면 공유 기능**: `getDisplayMedia()` 사용
3. **녹화 기능**: MediaRecorder API
4. **채팅 기능**: 통화 중 텍스트 채팅
5. **그룹 통화**: Mesh/SFU 구조
6. **벨소리**: 실제 벨소리 파일 추가
7. **통화 기록**: 통화 히스토리 UI

---

## 📞 구현된 파일 목록

```
src/
├── utils/
│   └── webrtc.js                          # WebRTC 유틸리티
├── pages/
│   ├── VideoCall/
│   │   └── index.jsx                      # 영상통화 페이지
│   └── Live/
│       └── index.jsx                      # Live 페이지 (수정)
├── components/
│   └── common/
│       └── IncomingCallModal.jsx          # 수신 통화 알림
├── routes/
│   └── Router.jsx                         # 라우팅 설정 (수정)
└── App.jsx                                # 앱 루트 (수정)
```

---

## ✅ 체크리스트

- [x] Supabase 테이블 생성
- [x] WebRTC 유틸리티 구현
- [x] 영상통화 컴포넌트 구현
- [x] 수신 통화 알림 구현
- [x] Live 페이지 통화 버튼 추가
- [x] 라우팅 설정
- [ ] **Supabase SQL 실행** ← **지금 해야 할 작업!**
- [ ] **Realtime 활성화** ← **지금 해야 할 작업!**
- [ ] 테스트

---

**이제 Supabase Dashboard에서 위의 SQL을 실행하고 Realtime을 활성화하면 영상통화가 동작합니다! 🎉**
