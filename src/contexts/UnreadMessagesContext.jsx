import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const UnreadMessagesContext = createContext();

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [lastReadTimes, setLastReadTimes] = useState({});

  // localStorage에서 마지막 읽은 시간 불러오기
  const loadLastReadTimes = useCallback((userId) => {
    const storedLastReadTimes = localStorage.getItem(`lastReadTimes_${userId}`);
    if (storedLastReadTimes) {
      return JSON.parse(storedLastReadTimes);
    }
    return {};
  }, []);

  // localStorage에 마지막 읽은 시간 저장하기
  const saveLastReadTimes = useCallback((userId, times) => {
    localStorage.setItem(`lastReadTimes_${userId}`, JSON.stringify(times));
  }, []);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const getUserInfo = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        // localStorage에서 마지막 읽은 시간 불러오기
        const times = loadLastReadTimes(user.id);
        setLastReadTimes(times);
      } else {
        // localStorage에 사용자 정보가 없으면 상태 초기화
        console.log('🔵 UnreadMessagesContext - 사용자 정보 없음, 상태 초기화');
        setCurrentUser(null);
        setUnreadCount(0);
        setUnreadByRoom({});
        setLastReadTimes({});
      }
    };
    getUserInfo();

    // localStorage 변경 감지 (다른 탭이나 로그아웃 시)
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        console.log('🔵 UnreadMessagesContext - localStorage 변경 감지');
        getUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 직접적인 localStorage 변경도 감지하기 위한 interval
    const intervalId = setInterval(() => {
      const storedUser = localStorage.getItem('currentUser');
      const currentStoredUser = storedUser ? JSON.parse(storedUser) : null;

      // 이전 사용자 정보를 ref 없이 직접 비교
      setCurrentUser((prevUser) => {
        if (!currentStoredUser && prevUser) {
          // 로그아웃 감지
          console.log('🔵 UnreadMessagesContext - 로그아웃 감지');
          setUnreadCount(0);
          setUnreadByRoom({});
          setLastReadTimes({});
          return null;
        } else if (currentStoredUser && (!prevUser || currentStoredUser.id !== prevUser.id)) {
          // 사용자 변경 감지
          console.log('🔵 UnreadMessagesContext - 사용자 변경 감지');
          const times = loadLastReadTimes(currentStoredUser.id);
          setLastReadTimes(times);
          return currentStoredUser;
        }
        return prevUser;
      });
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [loadLastReadTimes]);

  // 읽지 않은 메시지 개수 계산
  const calculateUnreadMessages = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log('🔵 읽지 않은 메시지 계산 시작 (Supabase 기반)');

      // 1. 현재 사용자가 보낸 메시지가 있는 채팅방 ID 찾기
      const { data: myMessagesData, error: myMessagesError } = await supabase
        .from('messages')
        .select('room_id')
        .eq('user_id', currentUser.id);

      if (myMessagesError) {
        console.error('❌ 내 메시지 조회 오류:', myMessagesError);
        return;
      }

      if (!myMessagesData || myMessagesData.length === 0) {
        console.log('🔵 참여 중인 채팅방 없음');
        setUnreadCount(0);
        setUnreadByRoom({});
        return;
      }

      // 2. 현재 사용자가 참여한 채팅방 ID 목록 (중복 제거)
      const userRoomIds = [...new Set(myMessagesData.map(msg => msg.room_id))];
      console.log('🔵 참여 중인 채팅방:', userRoomIds);

      // 3. chat_participants에서 마지막 읽은 시간 가져오기
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select('room_id, last_read_at')
        .eq('user_id', currentUser.id)
        .in('room_id', userRoomIds);

      if (participantsError) {
        console.error('❌ chat_participants 조회 오류:', participantsError);
        return;
      }

      // 4. 마지막 읽은 시간을 Map으로 변환
      const lastReadTimes = new Map();
      if (participantsData) {
        participantsData.forEach(participant => {
          lastReadTimes.set(participant.room_id, participant.last_read_at);
        });
      }

      // 5. 해당 채팅방들의 모든 메시지 가져오기
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, room_id, user_id, created_at')
        .in('room_id', userRoomIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 메시지 조회 오류:', error);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setUnreadCount(0);
        setUnreadByRoom({});
        return;
      }

      // 6. 각 채팅방별 읽지 않은 메시지 개수 계산
      const unreadByRoomData = {};
      let totalUnread = 0;

      for (const roomId of userRoomIds) {
        // 해당 채팅방의 메시지
        const roomMessages = messagesData.filter(msg => msg.room_id === roomId);

        // 마지막 읽은 시간 (Supabase에서 가져온 값)
        const lastReadTime = lastReadTimes.get(roomId);

        // 상대방이 보낸 메시지 중 마지막 읽은 시간 이후의 메시지만
        const unreadMessages = roomMessages.filter(msg => {
          if (msg.user_id === currentUser.id) return false; // 내가 보낸 메시지는 제외
          
          if (!lastReadTime) return true; // 읽은 시간이 없으면 모든 메시지가 읽지 않음
          
          const messageTime = new Date(msg.created_at);
          const lastRead = new Date(lastReadTime);
          return messageTime > lastRead;
        });

        console.log(`🔵 채팅방 ${roomId}: 마지막 읽은 시간 ${lastReadTime || '없음'}, 읽지 않은 메시지 ${unreadMessages.length}개`);

        if (unreadMessages.length > 0) {
          unreadByRoomData[roomId] = unreadMessages.length;
          totalUnread += unreadMessages.length;
        }
      }

      console.log('🔵 채팅방별 읽지 않은 메시지:', unreadByRoomData);
      console.log('🔵 전체 읽지 않은 메시지:', totalUnread);

      setUnreadByRoom(unreadByRoomData);
      setUnreadCount(totalUnread);

    } catch (error) {
      console.error('❌ 읽지 않은 메시지 계산 오류:', error);
    }
  }, [currentUser]);

  // 특정 채팅방의 메시지를 읽음 처리
  const markRoomAsRead = useCallback(async (roomId) => {
    if (!currentUser) return;

    console.log('🔵 채팅방 읽음 처리 (Supabase):', roomId);

    try {
      const currentTime = new Date().toISOString();

      // 1. 먼저 chat_rooms 테이블에 해당 room_id가 있는지 확인하고, 없으면 생성
      const { error: roomCheckError } = await supabase
        .from('chat_rooms')
        .upsert({
          id: roomId,
          created_at: currentTime,
          updated_at: currentTime
        }, {
          onConflict: 'id'
        });

      if (roomCheckError) {
        console.error('❌ chat_rooms 생성/업데이트 오류:', roomCheckError);
        return;
      }

      console.log('✅ chat_rooms 확인/생성 완료:', roomId);

      // 2. chat_participants 테이블에서 해당 사용자의 last_read_at 업데이트
      const { error: updateError } = await supabase
        .from('chat_participants')
        .upsert({
          user_id: currentUser.id,
          room_id: roomId,
          last_read_at: currentTime,
          joined_at: new Date().toISOString() // joined_at도 함께 설정 (없으면 생성)
        }, {
          onConflict: 'user_id,room_id'
        });

      if (updateError) {
        console.error('❌ chat_participants 업데이트 오류:', updateError);
        return;
      }

      console.log(`🔵 채팅방 ${roomId}의 마지막 읽은 시간 업데이트: ${currentTime}`);

      // UI 즉시 업데이트
      setUnreadByRoom(prev => {
        const updated = { ...prev };
        const roomUnread = updated[roomId] || 0;

        // 전체 카운트에서 해당 방의 읽지 않은 메시지 수 빼기
        setUnreadCount(prevCount => Math.max(0, prevCount - roomUnread));

        // 해당 방의 읽지 않은 메시지 제거
        delete updated[roomId];
        return updated;
      });

    } catch (error) {
      console.error('❌ 채팅방 읽음 처리 오류:', error);
    }
  }, [currentUser]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔵 실시간 메시지 구독 설정 (UnreadMessagesContext)');

    const channel = supabase
      .channel('realtime:unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔵 새 메시지 수신 (UnreadMessagesContext):', payload.new);

          // 내가 보낸 메시지가 아닌 경우에만 카운트 증가
          if (payload.new.user_id !== currentUser.id) {
            calculateUnreadMessages();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔵 Realtime 구독 상태 (UnreadMessagesContext):', status);
      });

    // 초기 로드
    calculateUnreadMessages();

    return () => {
      console.log('🔵 실시간 구독 해제 (UnreadMessagesContext)');
      supabase.removeChannel(channel);
    };
  }, [currentUser, calculateUnreadMessages]);

  const value = {
    unreadCount,
    unreadByRoom,
    markRoomAsRead,
    refreshUnreadCount: calculateUnreadMessages
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
