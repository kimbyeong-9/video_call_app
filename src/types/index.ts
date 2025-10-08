// 공통 인터페이스 및 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Route {
  path: string;
  element: React.ComponentType;
}

// 추가 타입은 필요에 따라 확장
