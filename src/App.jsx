import React, { useEffect, useState, createContext } from 'react';
import Router from './routes/Router';
import styled from 'styled-components';
import { handleAuthStateChange, supabase } from './utils/supabase';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import MessageNotification from './components/common/MessageNotification';

// Context 생성: 현재 사용자 ID를 전역으로 공유
export const CurrentUserContext = createContext(null);

// 전역 알림 컴포넌트
const GlobalNotificationWrapper = () => {
  const { 
    notifications, 
    setUser, 
    startMessageNotificationSubscription, 
    stopMessageNotificationSubscription,
    handleNotificationClick,
    removeNotification 
  } = useNotifications();

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('🔔 전역 알림 시스템 초기화:', user.nickname);
        setUser(user);
        
        // 전역 메시지 알림 구독 시작
        const notificationChannel = startMessageNotificationSubscription();
        
        return () => {
          stopMessageNotificationSubscription(notificationChannel);
        };
      } catch (error) {
        console.error('❌ 사용자 정보 파싱 오류:', error);
      }
    }
  }, [setUser, startMessageNotificationSubscription, stopMessageNotificationSubscription]);

  return (
    <MessageNotification
      notifications={notifications}
      onClose={removeNotification}
      onClick={handleNotificationClick}
    />
  );
};

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
          localStorage.removeItem('hasShownLoginModal'); // 로그인 모달 표시 플래그 제거
          sessionStorage.removeItem('socialLoginSuccess');
          sessionStorage.removeItem('loginMethod');
          setCurrentUserId(null);
        }

        // 로그인 성공 시 localStorage 업데이트
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          console.log('🔵 App.jsx - 로그인 성공 감지, 사용자 정보 업데이트');

          // 로그인 방법 확인
          const loginProvider = session.user.app_metadata?.provider || 'email';
          const isSocialLogin = loginProvider !== 'email';

          // SIGNED_IN 이벤트는 새로운 로그인 시에만 발생
          if (event === 'SIGNED_IN') {
            // 로그인 성공 플래그 저장 (로그인 방법 구분)
            sessionStorage.setItem('socialLoginSuccess', 'true');
            sessionStorage.setItem('loginMethod', loginProvider);
            console.log(`✅ App.jsx - ${loginProvider} 로그인 완료 플래그 설정`);
          }

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
        <NotificationProvider>
          <AppContainer>
            <Router />
          </AppContainer>
          <GlobalNotificationWrapper />
        </NotificationProvider>
      </UnreadMessagesProvider>
    </CurrentUserContext.Provider>
  );
}

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
`;

export default App;