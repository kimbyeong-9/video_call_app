# Utilities SQL Files

유틸리티 및 검증을 위한 SQL 파일들입니다.

## 📋 파일 목록

### `EXECUTE_THIS.sql`
- 전체 설정을 한번에 실행하는 통합 스크립트입니다
- 초기 설정 시 모든 필요한 SQL을 순서대로 실행합니다
- 빠른 설정이 필요한 경우에 사용합니다

### `verify_webrtc_setup.sql`
- WebRTC 설정이 올바르게 되어 있는지 검증합니다
- 테이블 구조, 권한, 데이터 등을 확인합니다
- 문제 진단에 사용합니다

## 🛠️ 사용 방법

### 초기 설정
```sql
-- Supabase Dashboard → SQL Editor에서 실행
-- EXECUTE_THIS.sql 파일의 전체 내용을 복사해서 실행
```

### 설정 검증
```sql
-- WebRTC 설정 확인
-- verify_webrtc_setup.sql 파일을 실행하여 결과 확인
```

## ⚠️ 주의사항
- `EXECUTE_THIS.sql`은 초기 설정용입니다
- 이미 설정된 데이터베이스에서는 중복 실행을 피하세요
- 검증 스크립트는 문제 진단용으로 사용하세요
