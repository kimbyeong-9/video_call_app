# Fixes SQL Files

기존 문제를 해결하기 위한 SQL 파일들입니다.

## 📋 파일 목록

### `fix_rls_security.sql`
- Row Level Security (RLS) 보안 정책 관련 문제를 수정합니다
- 권한 오류나 접근 문제를 해결합니다

### `fix_webrtc_signals.sql`
- WebRTC 신호 관련 문제를 수정합니다
- 비디오 통화 기능의 안정성을 향상시킵니다

## 🔧 사용 방법

문제가 발생했을 때 해당하는 fix 파일을 실행하세요:

1. RLS 권한 오류 → `fix_rls_security.sql`
2. WebRTC 신호 문제 → `fix_webrtc_signals.sql`

## ⚠️ 주의사항
- 문제가 발생했을 때만 실행하세요
- 실행 전에 문제의 원인을 정확히 파악하세요
- 프로덕션 환경에서는 신중하게 실행하세요
