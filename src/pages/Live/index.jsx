import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiVideo } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import { videoCall } from '../../utils/webrtc';

const Live = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState({});
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // 사용자 목록 로드
  useEffect(() => {
    let isMounted = true;
    let debounceTimer = null;

    const loadUsers = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          console.log('🔵 Live - 로그인 필요');
          navigate('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        if (isMounted && !currentUser) {
          setCurrentUser(user);
          console.log('🔵 Live - 현재 사용자:', user.id);
        }

        // Supabase에서 모든 사용자 가져오기 (자기 자신 제외)
        const { data: usersData, error } = await supabase
          .from('users')
          .select('id, nickname, email, bio, interests, profile_image')
          .neq('id', user.id) // 자기 자신 제외
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Live - 사용자 목록 조회 오류:', error);
          if (isMounted) setUsers([]);
          return;
        }

        console.log('🔵 Live - 사용자 목록:', usersData);

        // 프로필 이미지가 없는 경우 기본 이미지 설정
        const usersWithImages = usersData.map(u => ({
          ...u,
          profileImage: u.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.nickname}`,
          interests: u.interests || [],
          bio: u.bio || '안녕하세요!',
          status: '통화 가능',
          statusType: 'available'
        }));

        if (isMounted) setUsers(usersWithImages);
      } catch (error) {
        console.error('❌ Live - 사용자 로드 오류:', error);
        if (isMounted) setUsers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // 디바운스된 로드 함수
    const debouncedLoadUsers = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) loadUsers();
      }, 1000); // 1초 디바운스
    };

    loadUsers();

    // 실시간 사용자 업데이트 구독
    console.log('🔵 Live - 실시간 구독 설정');

    const channel = supabase
      .channel('realtime:live-users')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔵 Live - 사용자 변경 감지:', payload);
          debouncedLoadUsers();
        }
      )
      .subscribe((status) => {
        console.log('🔵 Live - Realtime 구독 상태:', status);
      });

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      console.log('🔵 Live - 실시간 구독 해제');
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleMessageChange = (userId, value) => {
    setMessages(prev => ({ ...prev, [userId]: value }));
  };

  const handleSendMessage = async (receiverUser) => {
    if (!messages[receiverUser.id]?.trim()) return;

    try {
      // 채팅방 ID 생성 (두 사용자 ID를 정렬하여 일관된 room_id 생성)
      const roomId = [currentUser.id, receiverUser.id].sort().join('_');
      const chatRoomId = `chat_${roomId}`;

      console.log('🔵 Live - 메시지 전송:', chatRoomId);

      // 메시지 저장
      const { error } = await supabase.from('messages').insert({
        room_id: chatRoomId,
        user_id: currentUser.id,
        content: messages[receiverUser.id].trim(),
      });

      if (error) {
        console.error('❌ Live - 메시지 전송 오류:', error);
        alert('메시지 전송에 실패했습니다.');
        return;
      }

      console.log('✅ Live - 메시지 전송 완료');
      setMessages(prev => ({ ...prev, [receiverUser.id]: '' }));

      // 채팅방으로 이동
      navigate(`/chatting/${chatRoomId}`);
    } catch (error) {
      console.error('❌ Live - 메시지 전송 예외:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const handleStartCall = async (receiverUser) => {
    if (isCallLoading) return;

    try {
      setIsCallLoading(true);

      if (!currentUser) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      console.log('🔵 Live - 통화 시작:', receiverUser.nickname);

      // 통화 생성
      const { data: callData, error } = await videoCall.createCall(
        currentUser.id,
        receiverUser.id
      );

      if (error) {
        console.error('❌ Live - 통화 생성 실패:', error);
        alert('통화를 시작할 수 없습니다.');
        return;
      }

      console.log('✅ Live - 통화 생성 완료:', callData.id);

      // 영상통화 페이지로 이동 (발신자 모드)
      navigate(`/video-call?callId=${callData.id}&mode=caller`);

    } catch (error) {
      console.error('❌ Live - 통화 시작 에러:', error);
      alert('통화 연결에 실패했습니다.');
    } finally {
      setIsCallLoading(false);
    }
  };

  if (loading) {
    return (
      <LiveWrapper>
        <CategoryTitle>Live</CategoryTitle>
        <LoadingMessage>사용자 목록을 불러오는 중...</LoadingMessage>
      </LiveWrapper>
    );
  }

  return (
    <LiveWrapper>
      <CategoryTitle>Live</CategoryTitle>

      {/* 디버그 정보 */}
      {currentUser && (
        <DebugInfo>
          <strong>현재 사용자:</strong> {currentUser.nickname} ({currentUser.email})
          <br />
          <strong>User ID:</strong> {currentUser.id}
        </DebugInfo>
      )}

      {users.length === 0 ? (
        <EmptyMessage>
          <EmptyIcon>👥</EmptyIcon>
          <EmptyText>현재 접속 중인 사용자가 없습니다.</EmptyText>
        </EmptyMessage>
      ) : (
        <UserList>
          {users.map((user) => (
            <UserCard key={user.id}>
              <ProfileImage src={user.profileImage} alt={user.nickname} />
              <UserInfo>
                <UserHeader>
                  <Nickname>{user.nickname}</Nickname>
                  <StatusBadge type={user.statusType}>{user.status}</StatusBadge>
                </UserHeader>

                <Bio>{user.bio}</Bio>

                <InterestTags>
                  {Array.isArray(user.interests) && user.interests.length > 0 ? (
                    user.interests.map((interest, index) => (
                      <InterestTag key={index}>{interest}</InterestTag>
                    ))
                  ) : (
                    <InterestTag>관심사 없음</InterestTag>
                  )}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(user)}
                  />
                  <SendButton onClick={() => handleSendMessage(user)}>
                    전송
                  </SendButton>
                </MessageSection>
              </UserInfo>
            </UserCard>
          ))}
        </UserList>
      )}
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

const DebugInfo = styled.div`
  background: #f0f8ff;
  border: 2px solid var(--primary-blue);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;

  strong {
    color: var(--primary-blue);
  }
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

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  font-size: 16px;
  color: var(--text-secondary);
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
`;

export default Live;