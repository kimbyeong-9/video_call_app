# 네트워크 연결 문제 해결 가이드

## ERR_QUIC_PROTOCOL_ERROR 해결 방법

이 오류는 브라우저가 QUIC 프로토콜을 사용하여 Supabase 서버에 연결을 시도할 때 발생합니다.

### 방법 1: Chrome에서 QUIC 프로토콜 비활성화

1. Chrome 주소창에 다음을 입력:
   ```
   chrome://flags/#enable-quic
   ```

2. "Experimental QUIC protocol" 옵션을 **Disabled**로 설정

3. Chrome 재시작

### 방법 2: 브라우저 캐시 및 쿠키 삭제

1. Chrome 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제
2. "쿠키 및 기타 사이트 데이터"와 "캐시된 이미지 및 파일" 선택
3. "인터넷 사용 기록 삭제" 클릭
4. 브라우저 재시작

### 방법 3: 네트워크 설정 초기화

Windows:
```bash
ipconfig /flushdns
netsh winsock reset
```

Mac:
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### 방법 4: VPN 또는 프록시 비활성화

VPN이나 프록시를 사용 중이라면 일시적으로 비활성화하고 다시 시도해보세요.

### 방법 5: 다른 브라우저 사용

- Firefox
- Safari
- Edge

위 브라우저들은 QUIC 프로토콜 처리가 다를 수 있습니다.

## 코드 수정 사항

이미 코드에 재시도 로직이 추가되었습니다:
- 네트워크 에러 발생 시 자동으로 1초 후 재시도
- 15초 타임아웃 설정
- PKCE 인증 플로우 사용

## 여전히 문제가 있다면

1. 인터넷 연결 확인
2. 방화벽 설정 확인
3. Supabase 프로젝트 상태 확인 (https://status.supabase.com/)
4. 로컬 개발 서버 재시작
   ```bash
   npm run dev
   ```
