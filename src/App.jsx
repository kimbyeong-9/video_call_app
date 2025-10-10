import React, { useEffect } from 'react';
import Router from './routes/Router';
import styled from 'styled-components';
import { handleAuthStateChange, supabase } from './utils/supabase';

function App() {
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
        }
        
        // 로그인 성공 시 localStorage 업데이트
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          console.log('🔵 App.jsx - 로그인 성공 감지, 사용자 정보 업데이트');
          
          try {
            // 사용자 추가 정보 가져오기
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userData && !userError) {
              // localStorage에 사용자 정보 저장
              const userSession = {
                id: userData.id,
                email: userData.email,
                nickname: userData.nickname
              };
              
              localStorage.setItem('currentUser', JSON.stringify(userSession));
              console.log('🔵 App.jsx - localStorage 업데이트 완료:', userSession);
            } else {
              console.error('🔵 App.jsx - 사용자 정보 조회 실패:', userError);
            }
          } catch (error) {
            console.error('🔵 App.jsx - 사용자 정보 업데이트 오류:', error);
          }
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
    <AppContainer>
      <Router />
    </AppContainer>
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