import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { chatListData } from '../../data/ChatlistData';

const Chatlist = () => {
  const navigate = useNavigate();

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

  return (
    <ChatlistWrapper>
      <CategoryTitle>채팅</CategoryTitle>
      <ChatList>
        {chatListData.map((chat) => (
          <ChatItem 
            key={chat.id}
            onClick={() => navigate(`/chat/${chat.id}`)}
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

export default Chatlist;