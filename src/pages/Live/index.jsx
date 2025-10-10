import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiVideo } from 'react-icons/fi';
import { liveUsersData } from '../../data/LiveUsersData';
import { videoCall } from '../../utils/webrtc';

const Live = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState({});
  const [isCallLoading, setIsCallLoading] = useState(false);

  const handleMessageChange = (userId, value) => {
    setMessages(prev => ({ ...prev, [userId]: value }));
  };

  const handleSendMessage = (userId) => {
    if (messages[userId]?.trim()) {
      console.log(`Message sent to ${userId}: ${messages[userId]}`);
      setMessages(prev => ({ ...prev, [userId]: '' }));
    }
  };

  const handleStartCall = async (receiverUser) => {
    if (isCallLoading) return;

    try {
      setIsCallLoading(true);

      // 현재 사용자 정보 가져오기
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const currentUser = JSON.parse(currentUserStr);

      // Supabase에서 실제 사용자 정보 조회 (receiverUser는 임시 데이터이므로)
      // 실제 환경에서는 receiverUser.id를 실제 Supabase user ID로 매핑 필요
      // 지금은 테스트를 위해 현재 사용자를 수신자로 설정 (자기 자신에게 전화)

      // 통화 생성
      const { data: callData, error } = await videoCall.createCall(
        currentUser.id,
        currentUser.id // 테스트용: 실제로는 receiverUser의 실제 user ID 사용
      );

      if (error) {
        console.error('통화 생성 실패:', error);
        alert('통화를 시작할 수 없습니다.');
        return;
      }

      // 영상통화 페이지로 이동 (발신자 모드)
      navigate(`/video-call?callId=${callData.id}&mode=caller`);

    } catch (error) {
      console.error('통화 시작 에러:', error);
      alert('통화 연결에 실패했습니다.');
    } finally {
      setIsCallLoading(false);
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

              <ActionSection>
                <VideoCallButton
                  onClick={() => handleStartCall(user)}
                  disabled={isCallLoading}
                >
                  <FiVideo size={20} />
                  영상통화
                </VideoCallButton>
              </ActionSection>

              <MessageSection>
                <MessageInput
                  value={messages[user.id] || ''}
                  onChange={(e) => handleMessageChange(user.id, e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(user.id)}
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

const ActionSection = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const VideoCallButton = styled.button`
  flex: 1;
  padding: 14px 20px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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