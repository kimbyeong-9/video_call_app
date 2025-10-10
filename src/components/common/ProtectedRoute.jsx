import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import styled from 'styled-components';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const checkAuthentication = async () => {
      try {
        console.log('🔵 ProtectedRoute - 인증 상태 확인 시작');

        // 1단계: localStorage 먼저 확인 (즉시 체크)
        const storedUser = localStorage.getItem('currentUser');
        
        if (storedUser) {
          console.log('✅ ProtectedRoute - localStorage에 사용자 정보 있음, 즉시 진입 허용');
          setIsAuthenticated(true);
          setIsLoading(false);

          // 백그라운드에서 세션 유효성 확인 (비차단)
          supabase.auth.getSession()
            .then(({ data: { session }, error }) => {
              if (isMounted) {
                if (error || !session?.user) {
                  console.warn('⚠️ ProtectedRoute - 백그라운드 세션 확인 실패, 로그아웃 필요');
                  // 세션이 실제로 없으면 로그아웃 처리
                  localStorage.removeItem('currentUser');
                  setIsAuthenticated(false);
                } else {
                  console.log('✅ ProtectedRoute - 백그라운드 세션 확인 완료');
                }
              }
            })
            .catch(err => {
              console.warn('⚠️ ProtectedRoute - 백그라운드 세션 확인 오류 (무시):', err.message);
            });

          return; // 여기서 종료
        }

        // 2단계: localStorage 없으면 Supabase 세션 확인 (타임아웃 포함)
        console.log('🔵 ProtectedRoute - localStorage 없음, Supabase 세션 확인');
        
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('세션 확인 타임아웃')), 2000);
        });

        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);

        if (timeoutId) clearTimeout(timeoutId);

        if (!isMounted) return;

        if (error) {
          console.warn('⚠️ ProtectedRoute - 세션 확인 오류:', error.message);
          setIsAuthenticated(false);
          return;
        }

        if (session?.user) {
          console.log('✅ ProtectedRoute - Supabase 세션 확인됨:', session.user.email);
          setIsAuthenticated(true);

          // 사용자 정보 가져와서 localStorage에 저장
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: userData }) => {
              if (userData && isMounted) {
                localStorage.setItem('currentUser', JSON.stringify({
                  id: userData.id,
                  email: userData.email,
                  nickname: userData.nickname
                }));
                console.log('✅ ProtectedRoute - localStorage 업데이트 완료');
              }
            })
            .catch(userError => {
              console.warn('⚠️ ProtectedRoute - 사용자 정보 조회 실패 (무시):', userError.message);
            });
        } else {
          console.log('❌ ProtectedRoute - 인증되지 않은 사용자');
          setIsAuthenticated(false);
        }

      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        
        console.warn('⚠️ ProtectedRoute - 타임아웃 발생, 로그인 필요');
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

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
