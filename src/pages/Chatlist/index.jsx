import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

const Chatlist = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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

      // 1. 사용자가 메시지를 보내거나 받은 모든 room_id 가져오기
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('room_id, user_id, content, created_at')
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('❌ 메시지 조회 오류:', messagesError);
        setChatRooms([]);
        setLoading(false);
        return;
      }

      console.log('🔵 전체 메시지 데이터:', messagesData);

      if (!messagesData || messagesData.length === 0) {
        console.log('🔵 메시지 없음');
        setChatRooms([]);
        setLoading(false);
        return;
      }

      // 2. 현재 사용자가 참여한 채팅방 ID 추출 (중복 제거)
      const roomIds = [...new Set(
        messagesData
          .filter(msg => msg.user_id === user.id || messagesData.some(m => m.room_id === msg.room_id && m.user_id !== user.id))
          .map(msg => msg.room_id)
      )];

      console.log('🔵 참여 중인 채팅방 ID들:', roomIds);

      // 3. 각 채팅방의 정보 구성
      const roomsData = await Promise.all(
        roomIds.map(async (roomId) => {
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

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    console.log('🔵 Chatlist useEffect 실행');
    loadChatRooms();
  }, [loadChatRooms]);

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
                <ProfileImage src={chat.profileImage} alt={chat.nickname} />
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

const ProfileImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 12px;
  object-fit: cover;
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
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
  top: 50%;
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