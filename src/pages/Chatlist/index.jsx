import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import { onlineStatusManager } from '../../utils/onlineStatus';

const Chatlist = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // 온라인 사용자 상태
  const { unreadByRoom, markRoomAsRead } = useUnreadMessages();

  const loadChatRooms = useCallback(async () => {
    console.log('🔵 loadChatRooms 시작');

    try {
      // 현재 사용자 정보 가져오기
      const storedUser = localStorage.getItem('currentUser');
      console.log('🔵 localStorage 사용자 정보:', storedUser);

      if (!storedUser) {
        console.log('🔵 사용자 정보 없음');
        setChatRooms([]);
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      console.log('🔵 현재 사용자 ID:', user.id);

      // 데이터베이스에서 사용자가 참여한 채팅방 목록 가져오기
      console.log('🔵 데이터베이스에서 채팅방 목록 조회');

      // 1. 현재 사용자가 보낸 메시지가 있는 room_id 가져오기
      const { data: myMessagesData, error: myMessagesError } = await supabase
        .from('messages')
        .select('room_id')
        .eq('user_id', user.id);

      if (myMessagesError) {
        console.error('❌ 내 메시지 조회 오류:', myMessagesError);
        setChatRooms([]);
        setLoading(false);
        return;
      }

      console.log('🔵 내가 보낸 메시지가 있는 방:', myMessagesData);

      if (!myMessagesData || myMessagesData.length === 0) {
        console.log('🔵 내가 참여한 채팅방 없음');
        setChatRooms([]);
        setLoading(false);
        return;
      }

      // 2. 내가 참여한 채팅방 ID 추출 (중복 제거)
      const myRoomIds = [...new Set(myMessagesData.map(msg => msg.room_id))];
      console.log('🔵 내가 참여 중인 채팅방 ID들:', myRoomIds);

      // 3. 해당 채팅방들의 모든 메시지 가져오기
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('room_id, user_id, content, created_at')
        .in('room_id', myRoomIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('❌ 채팅방 메시지 조회 오류:', messagesError);
        setChatRooms([]);
        setLoading(false);
        return;
      }

      console.log('🔵 내 채팅방들의 메시지 데이터:', messagesData);

      // 4. 각 채팅방의 정보 구성
      const roomsData = await Promise.all(
        myRoomIds.map(async (roomId) => {
          // 해당 채팅방의 모든 메시지
          const roomMessages = messagesData.filter(msg => msg.room_id === roomId);

          // 마지막 메시지
          const lastMsg = roomMessages[0];

          // 상대방 ID 찾기 (나를 제외한 사용자)
          const otherUserIds = [...new Set(
            roomMessages
              .map(msg => msg.user_id)
              .filter(userId => userId !== user.id)
          )];

          // 상대방이 없으면 (혼자만 메시지 보낸 경우) null 반환
          if (otherUserIds.length === 0) {
            return null;
          }

          // 상대방 정보 가져오기 (첫 번째 상대방)
          const { data: otherUserData } = await supabase
            .from('users')
            .select('id, nickname, email, profile_image')
            .eq('id', otherUserIds[0])
            .single();

          if (!otherUserData) {
            return null;
          }

          return {
            id: roomId,
            nickname: otherUserData.nickname,
            email: otherUserData.email,
            profileImage: otherUserData.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserData.nickname}`,
            lastMessage: lastMsg.content,
            lastMessageDate: lastMsg.created_at
          };
        })
      );

      // null 값 제거
      const validRooms = roomsData.filter(room => room !== null);

      console.log('🔵 채팅방 목록:', validRooms);
      setChatRooms(validRooms);

    } catch (error) {
      console.error('❌ 채팅방 목록 로드 오류:', error);
      setChatRooms([]);
    } finally {
      console.log('🔵 로딩 완료');
      setLoading(false);
    }
  }, []);

  // 사용자의 온라인 상태 확인
  const getUserOnlineStatus = (userId) => {
    if (userId === currentUser?.id) {
      return { is_online: true }; // 현재 사용자는 항상 온라인으로 표시
    }
    return onlineUsers.get(userId) || { is_online: false };
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    console.log('🔵 Chatlist useEffect 실행');
    loadChatRooms();
  }, [loadChatRooms]);

  // localStorage 변경 감지 (로그아웃/로그인 시)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔵 Chatlist - localStorage 변경 감지, 데이터 새로고침');
      loadChatRooms();
    };

    // localStorage 변경 감지 (다른 탭)
    window.addEventListener('storage', handleStorageChange);

    // 같은 탭에서의 변경 감지를 위한 interval
    const intervalId = setInterval(() => {
      const storedUser = localStorage.getItem('currentUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // 사용자 정보가 변경되었는지 확인
      if (!parsedUser && currentUser) {
        // 로그아웃 감지
        console.log('🔵 Chatlist - 로그아웃 감지, 상태 초기화');
        setCurrentUser(null);
        setChatRooms([]);
        setLoading(false);
      } else if (parsedUser && (!currentUser || parsedUser.id !== currentUser.id)) {
        // 다른 사용자로 로그인
        console.log('🔵 Chatlist - 사용자 변경 감지, 데이터 새로고침');
        loadChatRooms();
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [currentUser, loadChatRooms]);

  // 온라인 상태 관리
  useEffect(() => {
    if (!currentUser?.id) return;

    let unsubscribeStatusChange;

    const initializeOnlineStatus = async () => {
      try {
        // 온라인 상태 매니저 초기화
        await onlineStatusManager.initialize(currentUser.id);
        
        // 온라인 상태 변경 구독
        unsubscribeStatusChange = onlineStatusManager.onStatusChange((statusEntries) => {
          const newOnlineUsers = new Map(statusEntries);
          setOnlineUsers(newOnlineUsers);
        });
      } catch (error) {
        console.error('❌ Chatlist - 온라인 상태 초기화 오류:', error);
      }
    };

    initializeOnlineStatus();

    return () => {
      if (unsubscribeStatusChange) {
        unsubscribeStatusChange();
      }
      // cleanup은 호출하지 않음 (싱글톤이므로 다른 페이지에서도 사용 중)
    };
  }, [currentUser?.id]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔵 실시간 메시지 구독 설정');

    // 새 메시지가 추가되면 채팅방 목록 업데이트
    const channel = supabase
      .channel('realtime:chatlist')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔵 새 메시지 수신:', payload.new);
          // 채팅방 목록 새로고침
          loadChatRooms();
        }
      )
      .subscribe((status) => {
        console.log('🔵 Realtime 구독 상태:', status);
      });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log('🔵 실시간 구독 해제');
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadChatRooms]);

  const handleChatItemClick = (roomId) => {
    // 채팅방 입장 시 읽음 처리
    markRoomAsRead(roomId);
    navigate(`/chatting/${roomId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // 24시간 이내
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    // 일주일 이내
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    }
    // 그 외
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ChatlistWrapper>
        <CategoryTitle>채팅</CategoryTitle>
        <LoadingMessage>
          채팅 목록을 불러오는 중...
          <br />
          <small>콘솔을 확인해주세요 (F12)</small>
        </LoadingMessage>
      </ChatlistWrapper>
    );
  }

  return (
    <ChatlistWrapper>
      <CategoryTitle>채팅</CategoryTitle>
      {chatRooms.length === 0 ? (
        <EmptyMessage>
          <EmptyIcon>💬</EmptyIcon>
          <EmptyText>아직 채팅이 없습니다.</EmptyText>
          <EmptySubText>새로운 친구와 대화를 시작해보세요!</EmptySubText>
        </EmptyMessage>
      ) : (
        <ChatList>
          {chatRooms.map((chat) => {
            const unreadCount = unreadByRoom[chat.id] || 0;
            return (
              <ChatItem
                key={chat.id}
                onClick={() => handleChatItemClick(chat.id)}
              >
                <ProfileSection>
                  <ProfileImage src={chat.profileImage} alt={chat.nickname} />
                  <OnlineIndicator $isOnline={getUserOnlineStatus(chat.userId).is_online} />
                </ProfileSection>
                <ChatInfo>
                  <ChatHeader>
                    <Nickname>{chat.nickname}</Nickname>
                    <LastMessageDate>
                      {formatDate(chat.lastMessageDate)}
                    </LastMessageDate>
                  </ChatHeader>
                  <LastMessage>{chat.lastMessage}</LastMessage>
                </ChatInfo>
                {unreadCount > 0 && (
                  <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>
                )}
              </ChatItem>
            );
          })}
        </ChatList>
      )}
    </ChatlistWrapper>
  );
};

const ChatlistWrapper = styled.div`
  padding: 20px 16px;
  padding-bottom: 70px;
`;

const CategoryTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #000;
`;

const DebugInfo = styled.div`
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
`;

const ChatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ProfileSection = styled.div`
  position: relative;
  margin-right: 12px;
`;

const ProfileImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  object-fit: cover;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background-color: ${props => props.$isOnline ? '#4CAF50' : '#9E9E9E'};
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 4px ${props => props.$isOnline ? 'rgba(76, 175, 80, 0.3)' : 'rgba(158, 158, 158, 0.3)'};
  animation: ${props => props.$isOnline ? 'pulse-online' : 'none'} 2s ease-in-out infinite;

  @keyframes pulse-online {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
    }
    50% {
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.6);
    }
  }
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Nickname = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #000;
`;

const LastMessageDate = styled.span`
  font-size: 12px;
  color: #8e8e8e;
`;

const LastMessage = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: 65%;
  right: 12px;
  transform: translateY(-50%);
  background-color: #007AFF;
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  font-size: 14px;
  color: #666;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
`;

const EmptySubText = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0;
`;

export default Chatlist;