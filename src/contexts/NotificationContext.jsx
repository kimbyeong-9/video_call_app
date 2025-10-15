import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // 현재 사용자 설정
  const setUser = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  // 새 알림 추가
  const addNotification = useCallback((notification) => {
    console.log('🔔 새 알림 추가:', notification.senderName, '-', notification.message);
    setNotifications(prev => [...prev, notification]);
  }, []);

  // 알림 제거
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // 모든 알림 제거
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 실시간 메시지 알림 구독 시작 (전역)
  const startMessageNotificationSubscription = useCallback(() => {
    if (!currentUser?.id) {
      console.warn('⚠️ 사용자 정보가 없어서 알림 구독을 시작할 수 없습니다.');
      return null;
    }

    console.log('🔔 전역 메시지 알림 구독 시작 - 사용자 ID:', currentUser.id);

    const channel = supabase
      .channel('global-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('🔔 새 메시지 감지 (전역):', payload.new);
          
          const newMessage = payload.new;
          
          // 내가 보낸 메시지가 아닌 경우에만 알림 표시
          if (newMessage.user_id !== currentUser.id) {
            console.log('🔔 상대방 메시지 감지 - 전역 알림 생성 중...');
            
            try {
              // 발신자 정보 가져오기
              const { data: senderData, error: senderError } = await supabase
                .from('users')
                .select('id, nickname, profile_image')
                .eq('id', newMessage.user_id)
                .single();

              if (senderError) {
                console.error('❌ 발신자 정보 조회 실패:', senderError);
                return;
              }

              // 채팅방 참여자 확인 (내가 참여한 채팅방인지 확인)
              const { data: participantsData, error: participantsError } = await supabase
                .from('chat_participants')
                .select('user_id')
                .eq('room_id', newMessage.room_id);

              if (participantsError) {
                console.error('❌ 채팅방 참여자 조회 실패:', participantsError);
                return;
              }

              // 내가 해당 채팅방에 참여하고 있는지 확인
              const isParticipant = participantsData.some(
                participant => participant.user_id === currentUser.id
              );

              if (!isParticipant) {
                console.log('🔔 내가 참여하지 않은 채팅방 메시지 - 알림 무시');
                return;
              }

              // 현재 페이지 확인 (디버깅용)
              const currentPath = window.location.pathname;
              console.log('🔔 현재 페이지:', currentPath, '- 전역 알림 표시');

              // 알림 생성
              const notification = {
                id: `msg_${newMessage.id}_${Date.now()}`,
                type: 'message',
                senderId: newMessage.user_id,
                senderName: senderData.nickname,
                senderProfileImage: senderData.profile_image,
                message: newMessage.content,
                roomId: newMessage.room_id,
                messageId: newMessage.id,
                createdAt: newMessage.created_at
              };

              console.log('🔔 전역 알림 생성 완료:', notification);
              addNotification(notification);

            } catch (error) {
              console.error('❌ 전역 알림 생성 중 오류:', error);
            }
          } else {
            console.log('🔔 내가 보낸 메시지 - 알림 무시');
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 전역 알림 구독 상태:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ 전역 메시지 알림 구독 완료');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ 전역 알림 구독 채널 오류');
        }
      });

    return channel;
  }, [currentUser?.id, addNotification]);

  // 알림 구독 해제
  const stopMessageNotificationSubscription = useCallback((channel) => {
    if (channel) {
      console.log('🔔 메시지 알림 구독 해제');
      supabase.removeChannel(channel);
    }
  }, []);

  // 알림 클릭 처리
  const handleNotificationClick = useCallback((notification) => {
    console.log('🔔 알림 클릭:', notification);
    
    if (notification.type === 'message') {
      // 해당 채팅방으로 이동
      window.location.href = `/chatting/${notification.roomId}`;
    }
    
    // 알림 제거
    removeNotification(notification.id);
  }, [removeNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    setUser,
    startMessageNotificationSubscription,
    stopMessageNotificationSubscription,
    handleNotificationClick
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
