import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const Chatlist = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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

      // 간단한 테스트: 사용자가 참가한 채팅방만 표시
      console.log('🔵 간단한 채팅방 목록 생성');
      
      const rooms = [
        {
          id: '1',
          nickname: '김병호',
          profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kimbungho',
          lastMessage: '테스트 메시지입니다.',
          lastMessageDate: new Date().toISOString(),
          unreadCount: 0
        },
        {
          id: '4', 
          nickname: '김병구',
          profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kimbungu',
          lastMessage: '안녕하세요!',
          lastMessageDate: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 1
        }
      ];
      
      console.log('🔵 테스트 채팅방 목록:', rooms);
      setChatRooms(rooms);
      
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
          {chatRooms.map((chat) => (
            <ChatItem 
              key={chat.id}
              onClick={() => navigate(`/chatting/${chat.id}`)}
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
              {chat.unreadCount > 0 && (
                <UnreadBadge>{chat.unreadCount}</UnreadBadge>
              )}
            </ChatItem>
          ))}
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