import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import styled from 'styled-components';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔵 ProtectedRoute - 인증 상태 확인 시작');
      
      // 현재 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ ProtectedRoute - 세션 확인 오류:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        console.log('✅ ProtectedRoute - 인증된 사용자:', session.user.email);
        setIsAuthenticated(true);
        
        // localStorage에 사용자 정보가 없으면 업데이트
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userData) {
              localStorage.setItem('currentUser', JSON.stringify({
                id: userData.id,
                email: userData.email,
                nickname: userData.nickname
              }));
              console.log('🔵 ProtectedRoute - localStorage 업데이트 완료');
            }
          } catch (userError) {
            console.error('❌ ProtectedRoute - 사용자 정보 조회 오류:', userError);
          }
        }
      } else {
        console.log('❌ ProtectedRoute - 인증되지 않은 사용자');
        setIsAuthenticated(false);
      }
      
    } catch (error) {
      console.error('❌ ProtectedRoute - 인증 확인 예외:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>인증 확인 중...</LoadingText>
      </LoadingContainer>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    console.log('🔵 ProtectedRoute - 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return children;
};

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid var(--primary-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
`;

export default ProtectedRoute;
