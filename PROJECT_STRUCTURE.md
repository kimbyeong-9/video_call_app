# Video Call App 프로젝트 구조

```
video_call_app/
│
├── src/                     # 소스 코드 메인 폴더
│   ├── components/          # 컴포넌트 폴더
│   │   ├── common/         # 공통 컴포넌트
│   │   │   ├── Header.tsx  # 헤더 컴포넌트
│   │   │   └── Footer.tsx  # 푸터 컴포넌트
│   │   └── ui/             # UI 컴포넌트
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Select.tsx
│   │
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── Home/          # 홈 페이지 관련
│   │   │   ├── index.tsx  # 메인 페이지 컴포넌트
│   │   │   └── HomeComponent.tsx  # 홈 페이지 전용 컴포넌트
│   │   └── VideoCall/     # 화상통화 페이지 관련
│   │       ├── index.tsx
│   │       └── VideoComponent.tsx
│   │
│   ├── routes/             # 라우팅 관련
│   │   └── Router.tsx     # 메인 라우터 설정
│   │
│   ├── styles/            # 스타일 관련 파일
│   │   ├── global.css    # 전역 스타일
│   │   └── theme.ts      # 테마 설정
│   │
│   ├── types/            # TypeScript 타입 정의
│   │   └── index.ts     # 공통 타입 정의
│   │
│   ├── utils/            # 유틸리티 함수
│   │   ├── api.ts       # API 관련 유틸리티
│   │   └── helpers.ts   # 헬퍼 함수
│   │
│   ├── constants/        # 상수 정의
│   │   └── index.ts     # 공통 상수
│   │
│   ├── hooks/           # 커스텀 훅
│   │   └── useVideoCall.ts  # 화상통화 관련 훅
│   │
│   ├── App.tsx          # 앱 메인 컴포넌트
│   └── main.tsx         # 앱 진입점
│
├── public/               # 정적 파일
│   └── assets/          # 이미지, 폰트 등
│
├── node_modules/        # 외부 라이브러리 (git ignore)
├── package.json         # 프로젝트 설정 및 의존성
├── tsconfig.json        # TypeScript 설정
├── vite.config.ts       # Vite 설정
└── README.md            # 프로젝트 설명
```

## 폴더 구조 설명

### 📁 src/
- 프로젝트의 모든 소스 코드가 위치하는 루트 폴더

### 📁 components/
- **common/**: 여러 페이지에서 재사용되는 공통 컴포넌트
- **ui/**: 기본 UI 컴포넌트 (버튼, 인풋 등)

### 📁 pages/
- 각 페이지별 컴포넌트 폴더
- 각 페이지 폴더 내부에는 `index.tsx`와 해당 페이지 전용 컴포넌트 포함

### 📁 routes/
- 라우팅 관련 설정 파일
- React Router v6 기반 라우팅 구성

### 📁 styles/
- 전역 스타일 및 테마 설정
- styled-components 관련 설정

### 📁 types/
- TypeScript 타입 정의
- 프로젝트 전반에서 사용되는 인터페이스 및 타입

### 📁 utils/
- 유틸리티 함수 모음
- API 호출, 헬퍼 함수 등

### 📁 constants/
- 상수 정의
- 환경 변수, 설정값 등

### 📁 hooks/
- 커스텀 훅 모음
- 비즈니스 로직 분리

## 컴포넌트 구조 규칙

1. **페이지 컴포넌트**
   - `pages/` 폴더 내 위치
   - 폴더명은 페이지 이름과 동일
   - `index.tsx`를 메인 진입점으로 사용

2. **공통 컴포넌트**
   - `components/common/` 내 위치
   - 여러 페이지에서 재사용되는 컴포넌트

3. **UI 컴포넌트**
   - `components/ui/` 내 위치
   - 기본적인 UI 요소들의 모음

## 스타일 가이드

- styled-components를 사용한 스타일링
- 컴포넌트별 스타일은 해당 컴포넌트 파일 내에 정의
- 전역 스타일은 `styles/global.css`에 정의

## 타입 관리

- 공통 타입은 `types/index.ts`에 정의
- 컴포넌트별 타입은 해당 컴포넌트 파일 내에 정의

## 라우팅

- React Router v6 사용
- 라우트 정의는 `routes/Router.tsx`에서 중앙 관리
