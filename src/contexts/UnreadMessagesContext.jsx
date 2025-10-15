import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const UnreadMessagesContext = createContext();

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider = ({ children }) => {
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChatRoom, setActiveChatRoom] = useState(null); // 현재 활성 채팅방

  // 현재 사용자 설정
  const setUser = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  // 활성 채팅방 설정 (채팅방에 입장할 때 호출)
  const setActiveRoom = useCallback((roomId) => {
    setActiveChatRoom(roomId);
  }, []);

  // 활성 채팅방 해제 (채팅방에서 나갈 때 호출)
  const clearActiveRoom = useCallback(() => {
    setActiveChatRoom(null);
  }, []);

  // 읽지 않은 메시지 수 업데이트
  const updateUnreadCount = useCallback((roomId, count) => {
    console.log('🔔 읽지 않은 메시지 수 업데이트:', roomId, count);
    setUnreadByRoom(prev => ({
      ...prev,
      [roomId]: count
    }));
  }, []);

  // 특정 채팅방의 읽지 않은 메시지 수 조회
  const getUnreadCount = useCallback((roomId) => {
    return unreadByRoom[roomId] || 0;
  }, [unreadByRoom]);

  // 채팅방을 읽음으로 표시
  const markRoomAsRead = useCallback(async (roomId) => {
    if (!currentUser?.id) {
      console.warn('⚠️ 사용자 정보가 없어서 읽음 처리를 할 수 없습니다.');
      return;
    }

    console.log('🔔 채팅방 읽음 처리:', roomId);
    
    try {
      // 1. 로컬 상태에서 읽지 않은 메시지 수를 0으로 설정
      setUnreadByRoom(prev => ({
        ...prev,
        [roomId]: 0
      }));

      // 2. 데이터베이스에서 last_read_at을 현재 시간으로 업데이트
      const { error } = await supabase
        .from('chat_participants')
        .update({ 
          last_read_at: new Date().toISOString() 
        })
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ 읽음 상태 업데이트 실패:', error);
        // 실패 시 로컬 상태도 롤백하지 않음 (사용자 경험을 위해)
      } else {
        console.log('✅ 읽음 상태 업데이트 완료:', roomId);
      }
    } catch (error) {
      console.error('❌ 채팅방 읽음 처리 오류:', error);
    }
  }, [currentUser?.id]);

  // 전체 읽지 않은 메시지 수
  const totalUnreadCount = Object.values(unreadByRoom).reduce((sum, count) => sum + count, 0);

  // 새 메시지가 왔을 때 읽지 않은 메시지 수 증가
  const incrementUnreadCount = useCallback((roomId) => {
    console.log('🔔 읽지 않은 메시지 수 증가:', roomId);
    setUnreadByRoom(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || 0) + 1
    }));
  }, []);

  // 읽지 않은 메시지 수 초기화 (앱 시작 시)
  const initializeUnreadCounts = useCallback(async () => {
    if (!currentUser?.id) {
      console.warn('⚠️ initializeUnreadCounts: currentUser가 없습니다.');
      return;
    }

    try {
      console.log('🔔 읽지 않은 메시지 수 초기화 시작 - 사용자 ID:', currentUser.id);
      
      // 내가 참여한 모든 채팅방 조회
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select('room_id, last_read_at')
        .eq('user_id', currentUser.id);

      if (participantsError) {
        console.error('❌ 채팅방 참여자 조회 실패:', participantsError);
        return;
      }

      const unreadCounts = {};

      // 각 채팅방별로 읽지 않은 메시지 수 계산
      for (const participant of participantsData) {
        const { room_id, last_read_at } = participant;
        
        console.log(`🔔 채팅방 ${room_id} 읽지 않은 메시지 계산 시작`);
        console.log(`   - last_read_at: ${last_read_at || '없음 (모든 메시지가 읽지 않음)'}`);
        
        let unreadCount = 0;

        if (last_read_at) {
          // last_read_at 이후의 메시지 수 조회 (시간 비교 쿼리 사용)
          const { data: unreadMessages, error: messagesError } = await supabase
            .from('messages')
            .select('id')
            .eq('room_id', room_id)
            .neq('user_id', currentUser.id) // 내가 보낸 메시지는 제외
            .gt('created_at', last_read_at); // last_read_at 이후의 메시지만

          if (messagesError) {
            console.error('❌ 읽지 않은 메시지 조회 실패:', messagesError);
            continue;
          }

          unreadCount = unreadMessages?.length || 0;
          console.log(`   - last_read_at 이후 메시지: ${unreadCount}개`);
        } else {
          // last_read_at이 없으면 모든 메시지를 읽지 않은 것으로 간주
          console.log(`   - last_read_at이 없음 → 모든 메시지가 읽지 않은 것으로 처리`);
          
          const { data: allMessages, error: messagesError } = await supabase
            .from('messages')
            .select('id')
            .eq('room_id', room_id)
            .neq('user_id', currentUser.id); // 내가 보낸 메시지는 제외

          if (messagesError) {
            console.error('❌ 전체 메시지 조회 실패:', messagesError);
            continue;
          }

          unreadCount = allMessages?.length || 0;
          console.log(`   - 전체 메시지 (내 메시지 제외): ${unreadCount}개`);
        }

        if (unreadCount > 0) {
          unreadCounts[room_id] = unreadCount;
          console.log(`   ✅ 채팅방 ${room_id}: 읽지 않은 메시지 ${unreadCount}개`);
        } else {
          console.log(`   ⭕ 채팅방 ${room_id}: 읽지 않은 메시지 없음`);
        }
      }

      console.log('🔔 초기화된 읽지 않은 메시지 수:', unreadCounts);
      setUnreadByRoom(unreadCounts);

    } catch (error) {
      console.error('❌ 읽지 않은 메시지 수 초기화 오류:', error);
    }
  }, [currentUser?.id]);

  // 실시간으로 새 메시지 감지하여 읽지 않은 메시지 수 증가
  const startUnreadTracking = useCallback(() => {
    if (!currentUser?.id) {
      console.warn('⚠️ 사용자 정보가 없어서 읽지 않은 메시지 추적을 시작할 수 없습니다.');
      return null;
    }

    console.log('🔔 읽지 않은 메시지 추적 시작 - 사용자 ID:', currentUser.id);

    const channel = supabase
      .channel('unread-messages-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('🔔 새 메시지 감지 (읽지 않은 메시지 추적):', payload.new);
          
          const newMessage = payload.new;
          
          // 내가 보낸 메시지가 아닌 경우에만 읽지 않은 메시지 수 증가
          if (newMessage.user_id !== currentUser.id) {
            console.log('🔔 상대방 메시지 감지 - 읽지 않은 메시지 수 증가');
            
            try {
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

              // 현재 활성 채팅방이 아닌 경우에만 읽지 않은 메시지 수 증가
              if (isParticipant && activeChatRoom !== newMessage.room_id) {
                console.log('🔔 내가 참여한 채팅방 - 읽지 않은 메시지 수 증가:', newMessage.room_id);
                incrementUnreadCount(newMessage.room_id);
              } else {
                console.log('🔔 내가 참여하지 않은 채팅방 - 읽지 않은 메시지 수 증가하지 않음');
              }

            } catch (error) {
              console.error('❌ 읽지 않은 메시지 추적 중 오류:', error);
            }
          } else {
            console.log('🔔 내가 보낸 메시지 - 읽지 않은 메시지 수 증가하지 않음');
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 읽지 않은 메시지 추적 구독 상태:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ 읽지 않은 메시지 추적 구독 완료');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ 읽지 않은 메시지 추적 구독 채널 오류');
        }
      });

    return channel;
  }, [currentUser?.id, incrementUnreadCount, activeChatRoom]);

  // 읽지 않은 메시지 추적 해제
  const stopUnreadTracking = useCallback((channel) => {
    if (channel) {
      console.log('🔔 읽지 않은 메시지 추적 해제');
      supabase.removeChannel(channel);
    }
  }, []);

  const value = {
    unreadByRoom,
    totalUnreadCount,
    setUser,
    updateUnreadCount,
    getUnreadCount,
    markRoomAsRead,
    incrementUnreadCount,
    initializeUnreadCounts,
    startUnreadTracking,
    stopUnreadTracking,
    setActiveRoom,
    clearActiveRoom,
    activeChatRoom
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};