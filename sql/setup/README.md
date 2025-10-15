# Setup SQL Files

초기 데이터베이스 설정 및 스키마 생성에 필요한 SQL 파일들입니다.

## 📋 파일 목록

### `create_webrtc_tables.sql`
- WebRTC 관련 테이블들을 생성합니다
- `webrtc_signals`, `video_calls` 등의 테이블을 포함합니다

### `add_rls_policies.sql`
- Row Level Security (RLS) 정책을 추가합니다
- 데이터베이스 보안을 강화합니다

### `add_last_active.sql`
- `users` 테이블에 `last_active_at` 컬럼을 추가합니다
- 사용자의 마지막 활동 시간을 추적합니다

### `supabase_schema.sql`
- 전체 데이터베이스 스키마를 정의합니다
- 모든 테이블과 관계를 포함합니다

## 🚀 실행 순서

1. `supabase_schema.sql` - 기본 스키마 생성
2. `create_webrtc_tables.sql` - WebRTC 테이블 생성
3. `add_last_active.sql` - 사용자 테이블 확장
4. `add_rls_policies.sql` - 보안 정책 적용

## ⚠️ 주의사항
- 순서대로 실행하는 것을 권장합니다
- 기존 데이터가 있다면 백업을 먼저 수행하세요
