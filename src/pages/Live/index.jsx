import React, { useState } from 'react';
import styled from 'styled-components';
import { liveUsersData } from '../../data/LiveUsersData';

const Live = () => {
  const [messages, setMessages] = useState({});

  const handleMessageChange = (userId, value) => {
    setMessages(prev => ({ ...prev, [userId]: value }));
  };

  const handleSendMessage = (userId) => {
    if (messages[userId]?.trim()) {
      console.log(`Message sent to ${userId}: ${messages[userId]}`);
      setMessages(prev => ({ ...prev, [userId]: '' }));
    }
  };

  return (
    <LiveWrapper>
      <CategoryTitle>Live</CategoryTitle>
      <UserList>
        {liveUsersData.map((user) => (
          <UserCard key={user.id}>
            <ProfileImage src={user.profileImage} alt={user.nickname} />
            <UserInfo>
              <UserHeader>
                <Nickname>{user.nickname}</Nickname>
                <StatusBadge type={user.statusType}>{user.status}</StatusBadge>
              </UserHeader>

              <Bio>{user.bio}</Bio>

              <InterestTags>
                {user.interests.map((interest, index) => (
                  <InterestTag key={index}>{interest}</InterestTag>
                ))}
              </InterestTags>

              <MessageSection>
                <MessageInput
                  value={messages[user.id] || ''}
                  onChange={(e) => handleMessageChange(user.id, e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(user.id)}
                />
                <SendButton onClick={() => handleSendMessage(user.id)}>
                  전송
                </SendButton>
              </MessageSection>
            </UserInfo>
          </UserCard>
        ))}
      </UserList>
    </LiveWrapper>
  );
};

const LiveWrapper = styled.div`
  padding: 20px 16px;
  padding-bottom: 70px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const CategoryTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--primary-blue);
  text-shadow: 0 2px 4px rgba(43, 87, 154, 0.1);
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const UserCard = styled.div`
  background: var(--bg-card);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(43, 87, 154, 0.15);
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(43, 87, 154, 0.1);
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Nickname = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  background-color: #4CAF50;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const Bio = styled.p`
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.5;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const InterestTag = styled.span`
  font-size: 14px;
  color: var(--primary-blue);
  background-color: var(--accent-blue);
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
`;

const MessageSection = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--primary-light-blue);
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 4px var(--accent-blue);
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-dark-blue);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default Live;