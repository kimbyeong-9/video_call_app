# Video Call App

WebRTC와 Supabase를 활용한 실시간 영상통화 앱입니다.

## 🚀 기술 스택

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Storage + Auth)
- **WebRTC**: P2P 영상통화
- **Styling**: Styled Components
- **Icons**: React Icons

## 📚 Documentation

모든 상세 문서는 [`docs/`](./docs/) 폴더에 있습니다:
- [📖 전체 문서 목록](./docs/README.md)
- [🔐 인증 시스템](./docs/AUTH_SYSTEM_REPORT.md)
- [🤝 친구 기능](./docs/FRIENDS_TABLE_SETUP.md)
- [🎥 영상통화](./docs/VIDEO_CALL_SETUP.md)
- [🗄️ 데이터베이스](./docs/SUPABASE_RLS_FIX.md)

## 📋 주요 기능

### 1. 사용자 인증
- 이메일/비밀번호 회원가입 및 로그인
- Google OAuth 로그인
- 닉네임 중복 확인
- 프로필 관리 (프로필 이미지, 자기소개, 관심사)

### 2. 실시간 채팅
- 1:1 채팅방
- 실시간 메시지 전송/수신
- 읽지 않은 메시지 개수 표시
- 채팅방 목록

### 3. 영상통화
- WebRTC 기반 P2P 영상통화
- 실시간 통화 수신 알림
- 음소거/비디오 끄기 기능
- 통화 상태 표시

### 4. Live 페이지
- 실시간 사용자 목록
- 영상통화 발신
- 빠른 메시지 전송

### 5. 친구 관리
- 친구 검색
- 친구 추가/삭제
- 친구 프로필 보기

## 🛠 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd video_call_app
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AUTO_CONFIRM_EMAIL=true  # 개발 환경에서만 사용
```

### 3. Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase_schema.sql` 파일 실행
3. Storage에서 `avatars` 버킷 생성 (Public)

```sql
-- supabase_schema.sql 파일의 내용을 Supabase SQL Editor에 복사하여 실행
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── common/          # 공통 컴포넌트
│   │   ├── IncomingCallModal.jsx
│   │   └── ProtectedRoute.jsx
│   └── layout/          # 레이아웃 컴포넌트
│       ├── MainLayout.jsx
│       └── ChattingLayout.jsx
├── contexts/            # Context API
│   └── UnreadMessagesContext.jsx
├── pages/               # 페이지 컴포넌트
│   ├── Home/
│   ├── Login/
│   ├── Signup/
│   ├── Chatlist/
│   ├── Chatting/
│   ├── Live/
│   ├── VideoCall/
│   ├── Friends/
│   └── Profiles/
├── routes/              # 라우팅
│   └── Router.jsx
├── utils/               # 유틸리티 함수
│   ├── supabase.js
│   └── webrtc.js
└── App.jsx
```

## 🎯 사용 방법

### 영상통화 테스트

자세한 테스트 방법은 [TEST_GUIDE.md](./TEST_GUIDE.md)를 참조하세요.

**간단한 테스트 방법:**
1. 시크릿 창과 일반 창에서 각각 다른 계정으로 로그인
2. Live 페이지로 이동
3. 한 창에서 "영상통화" 버튼 클릭
4. 다른 창에서 수신 알림 확인 및 "수락" 클릭
5. 영상통화 시작

## 🔒 보안 주의사항

### 개발 환경
- `VITE_AUTO_CONFIRM_EMAIL=true`는 개발 환경에서만 사용
- 이메일 확인 없이 회원가입이 가능하도록 설정

### 배포 환경
**중요**: 실제 배포 시에는 다음 사항을 반드시 확인하세요:
1. `VITE_AUTO_CONFIRM_EMAIL`을 제거하거나 `false`로 설정
2. Supabase RLS (Row Level Security) 정책 확인
3. API 키 보안 확인
4. HTTPS 사용 (WebRTC는 HTTPS 또는 localhost에서만 작동)

## 🗄 데이터베이스 스키마

### users
- id (UUID, PK)
- email (TEXT, UNIQUE)
- nickname (TEXT, UNIQUE)
- bio (TEXT)
- interests (TEXT[])
- profile_image (TEXT)

### messages
- id (UUID, PK)
- room_id (TEXT)
- user_id (UUID, FK)
- content (TEXT)

### video_calls
- id (UUID, PK)
- caller_id (UUID, FK)
- receiver_id (UUID, FK)
- status (TEXT) - pending, ringing, active, ended, declined

### webrtc_signals
- id (UUID, PK)
- call_id (UUID, FK)
- sender_id (UUID, FK)
- signal_type (TEXT) - offer, answer, ice-candidate
- signal_data (JSONB)

## 🐛 문제 해결

### 웹캠/마이크가 작동하지 않는 경우
- 브라우저 설정에서 카메라/마이크 권한 확인
- HTTPS 또는 localhost에서만 작동 (HTTP는 불가)

### 수신 통화가 표시되지 않는 경우
- 콘솔 로그 확인 ("🔵 Live - 수신 통화 구독 시작")
- Supabase Realtime이 활성화되어 있는지 확인
- `video_calls` 테이블에 데이터가 정상적으로 삽입되는지 확인

### 영상통화 연결이 안 되는 경우
- 콘솔에서 WebRTC 연결 상태 확인
- 방화벽/NAT 설정 확인
- STUN/TURN 서버 설정 확인

## 🤝 기여

이슈나 Pull Request를 환영합니다!

## 📄 라이선스

MIT License
