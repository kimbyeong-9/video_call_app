import React, { useEffect, useState, createContext } from 'react';
import Router from './routes/Router';
import styled from 'styled-components';
import { handleAuthStateChange, supabase } from './utils/supabase';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';

// Context 생성: 현재 사용자 ID를 전역으로 공유
export const CurrentUserContext = createContext(null);

function App() {
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    // Auth 상태 변경 감지
    const setupAuthListener = async () => {
      const { data } = await supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔵 App.jsx - Auth 상태 변경:', event);
        
        // 로그아웃 시 localStorage 정리
        if (event === 'SIGNED_OUT') {
          console.log('🔵 App.jsx - 로그아웃 감지, localStorage 정리');
          localStorage.removeItem('currentUser');
          setCurrentUserId(null);
        }

        // 로그인 성공 시 localStorage 업데이트
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          console.log('🔵 App.jsx - 로그인 성공 감지, 사용자 정보 업데이트');

          // 먼저 기본 정보로 빠르게 저장
          const basicSession = {
            id: session.user.id,
            email: session.user.email,
            nickname: session.user.email?.split('@')[0] || '사용자'
          };
          localStorage.setItem('currentUser', JSON.stringify(basicSession));
          setCurrentUserId(session.user.id);
          console.log('✅ App.jsx - 기본 정보 저장 완료 (즉시)');

          // 백그라운드에서 상세 정보 가져오기 (비차단)
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: userData, error: userError }) => {
              if (userData && !userError) {
                const userSession = {
                  id: userData.id,
                  email: userData.email,
                  nickname: userData.nickname
                };
                localStorage.setItem('currentUser', JSON.stringify(userSession));
                setCurrentUserId(userData.id);
                console.log('✅ App.jsx - 상세 정보 업데이트 완료 (백그라운드)');
              } else {
                console.warn('⚠️ App.jsx - 상세 정보 조회 실패, 기본 정보 유지');
              }
            })
            .catch(error => {
              console.warn('⚠️ App.jsx - 상세 정보 조회 오류, 기본 정보 유지:', error.message);
            });
        }
      });

      unsubscribe = () => {
        if (data?.subscription?.unsubscribe) {
          data.subscription.unsubscribe();
        }
      };
    };

    setupAuthListener();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <CurrentUserContext.Provider value={currentUserId}>
      <UnreadMessagesProvider>
        <AppContainer>
          <Router />
        </AppContainer>
      </UnreadMessagesProvider>
    </CurrentUserContext.Provider>
  );
}

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  max-width: var(--mobile-width);
  margin: 0 auto;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  @media screen and (min-width: 768px) {
    max-width: var(--tablet-width);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  }
`;

export default App;