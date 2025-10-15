# SQL Files Directory

이 디렉토리는 프로젝트의 모든 SQL 파일들을 카테고리별로 정리한 곳입니다.

## 📁 폴더 구조

### 🚀 setup/
초기 데이터베이스 설정 및 스키마 생성에 필요한 SQL 파일들
- `create_webrtc_tables.sql` - WebRTC 관련 테이블 생성
- `add_rls_policies.sql` - Row Level Security 정책 추가
- `add_last_active.sql` - 사용자 마지막 활동 시간 컬럼 추가
- `supabase_schema.sql` - 전체 데이터베이스 스키마

### 🔧 fixes/
기존 문제를 해결하기 위한 SQL 파일들
- `fix_rls_security.sql` - RLS 보안 정책 수정
- `fix_webrtc_signals.sql` - WebRTC 신호 관련 문제 수정

### 📊 migrations/
데이터베이스 마이그레이션 파일들
- `20251013052538_create_friends_table.sql` - 친구 테이블 생성 마이그레이션

### 🛠️ utilities/
유틸리티 및 검증을 위한 SQL 파일들
- `EXECUTE_THIS.sql` - 전체 설정을 한번에 실행하는 통합 스크립트
- `verify_webrtc_setup.sql` - WebRTC 설정 검증

## 📋 사용 방법

### 초기 설정
1. `setup/` 폴더의 파일들을 순서대로 실행
2. 또는 `utilities/EXECUTE_THIS.sql`을 사용하여 한번에 설정

### 문제 해결
- `fixes/` 폴더의 해당 파일을 실행

### 마이그레이션
- `migrations/` 폴더의 파일들을 시간순으로 실행

## ⚠️ 주의사항
- 각 SQL 파일을 실행하기 전에 내용을 확인하세요
- 프로덕션 환경에서는 백업을 먼저 수행하세요
- Supabase Dashboard의 SQL Editor에서 실행하는 것을 권장합니다
