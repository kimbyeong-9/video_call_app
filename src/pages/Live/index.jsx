import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiVideo } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import { videoCall, WebRTCManager } from '../../utils/webrtc';
import { onlineStatusManager } from '../../utils/onlineStatus';

const Live = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState({});
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // 전체 앱에서 활동 중인 유저 관리 (onlineStatus 사용)
  useEffect(() => {
    let isMounted = true;
    let unsubscribeStatus = null;

    const initializeOnlineUsers = async () => {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          console.log('🔵 Live - 로그인 필요');
          navigate('/');
          return;
        }

        const basicUser = JSON.parse(storedUser);
        console.log('🔵 Live - localStorage 사용자:', basicUser);

        // Supabase에서 완전한 사용자 정보 가져오기
        const { data: fullUserData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', basicUser.id)
          .single();

        if (userError || !fullUserData) {
          console.error('❌ Live - 사용자 정보 조회 실패:', userError);
          navigate('/');
          return;
        }

        console.log('✅ Live - Supabase에서 가져온 전체 사용자 정보:', fullUserData);

        if (isMounted) {
          setCurrentUser(fullUserData);
        }

        // OnlineStatus 매니저 초기화
        await onlineStatusManager.initialize(fullUserData.id);
        console.log('✅ Live - OnlineStatusManager 초기화 완료');

        // 온라인 상태 변경 리스너 등록
        unsubscribeStatus = onlineStatusManager.onStatusChange(async (statusEntries) => {
          console.log('🔵 Live - 온라인 유저 업데이트:', statusEntries.length, '명');

          // statusEntries는 [userId, {is_online, last_seen}] 배열
          const onlineUserIds = statusEntries
            .filter(([_userId, status]) => status.is_online)
            .map(([userId, _status]) => userId);

          console.log('🔵 Live - 온라인 유저 ID 목록:', onlineUserIds);

          if (onlineUserIds.length === 0) {
            if (isMounted) {
              setUsers([]);
              setLoading(false);
            }
            return;
          }

          // Supabase에서 온라인 유저들의 프로필 정보 가져오기
          const { data: usersFromDB, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', onlineUserIds)
            .neq('id', fullUserData.id); // 자신은 제외

          if (usersError) {
            console.error('❌ Live - 유저 정보 조회 실패:', usersError);
            if (isMounted) {
              setUsers([]);
              setLoading(false);
            }
            return;
          }

          console.log('✅ Live - Supabase에서 가져온 온라인 유저 정보:', usersFromDB);

          // 유저 데이터 포맷팅
          const formattedUsers = usersFromDB.map(dbUser => {
            const statusEntry = statusEntries.find(([userId, _]) => userId === dbUser.id);
            const lastSeen = statusEntry ? statusEntry[1].last_seen : new Date().toISOString();

            return {
              id: dbUser.id,
              nickname: dbUser.nickname || dbUser.email?.split('@')[0] || '사용자',
              email: dbUser.email,
              profile_image: dbUser.profile_image,
              profileImage: dbUser.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser.nickname}`,
              bio: dbUser.bio || '안녕하세요!',
              interests: dbUser.interests || [],
              status: '온라인',
              statusType: 'online',
              online_at: lastSeen,
            };
          });

          console.log('✅ Live - 포맷된 유저 데이터:', formattedUsers);

          if (isMounted) {
            setUsers(formattedUsers);
            setLoading(false);
          }
        });

        console.log('✅ Live - 온라인 상태 초기화 완료');
      } catch (error) {
        console.error('❌ Live - 온라인 상태 초기화 오류:', error);
        if (isMounted) {
          setUsers([]);
          setLoading(false);
        }
      }
    };

    initializeOnlineUsers();

    return () => {
      isMounted = false;
      console.log('🔵 Live - cleanup 시작');

      // 상태 변경 리스너 해제
      if (unsubscribeStatus) {
        unsubscribeStatus();
      }

      // OnlineStatusManager는 싱글톤이므로 cleanup 하지 않음
      // 다른 페이지에서도 계속 사용됨
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

      console.log('🔵 Live - 채팅방 생성 및 메시지 전송:', chatRoomId);

      // 1. 채팅방 생성
      await createChatRoom(chatRoomId, currentUser, receiverUser);

      // 2. 메시지 저장
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

  // 채팅방 생성 함수
  const createChatRoom = async (roomId, currentUser, otherUser) => {
    try {
      const currentTime = new Date().toISOString();

      // 1. chat_rooms 테이블에 room_id 생성
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .upsert({
          id: roomId,
          created_at: currentTime,
          updated_at: currentTime
        }, {
          onConflict: 'id'
        });

      if (roomError) {
        console.warn('⚠️ Live - chat_rooms 생성 실패:', roomError);
      } else {
        console.log('✅ Live - chat_rooms 생성 완료:', roomId);
      }

      // 2. chat_participants 테이블에 양쪽 사용자 추가
      const participants = [
        {
          user_id: currentUser.id,
          room_id: roomId,
          joined_at: currentTime,
          last_read_at: currentTime
        },
        {
          user_id: otherUser.id,
          room_id: roomId,
          joined_at: currentTime,
          last_read_at: null // 상대방은 아직 읽지 않음
        }
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .upsert(participants, {
          onConflict: 'user_id,room_id'
        });

      if (participantError) {
        console.warn('⚠️ Live - chat_participants 생성 실패:', participantError);
      } else {
        console.log('✅ Live - chat_participants 생성 완료:', roomId);
      }

    } catch (error) {
      console.error('❌ Live - 채팅방 생성 오류:', error);
      throw error;
    }
  };

  const handleStartCall = async (receiverUser) => {
    if (isCallLoading) return;

    try {
      setIsCallLoading(true);

      if (!currentUser) {
        alert('로그인이 필요합니다.');
        navigate('/');
        return;
      }

      // 이전 WebRTC 인스턴스가 있다면 정리
      const existingManager = new WebRTCManager(currentUser.id);
      existingManager.forceCleanup();

      console.log('🔵 Live - 통화 시작 요청');
      console.log('🔵 Live - 발신자 ID:', currentUser.id);
      console.log('🔵 Live - 수신자:', receiverUser.nickname, '/', receiverUser.id);

      // 통화 생성
      const { data: callData, error } = await videoCall.createCall(
        currentUser.id,
        receiverUser.id
      );

      if (error) {
        console.error('❌ Live - 통화 생성 실패:', error);
        alert(`통화를 시작할 수 없습니다: ${error.message}`);
        return;
      }

      console.log('✅ Live - 통화 생성 완료!');
      console.log('✅ Live - Call ID:', callData.id);
      console.log('✅ Live - Caller ID:', callData.caller_id);
      console.log('✅ Live - Receiver ID:', callData.receiver_id);
      console.log('✅ Live - Status:', callData.status);

      // 영상통화 페이지로 이동 (발신자 모드)
      navigate(`/video-call?callId=${callData.id}&mode=caller`);

    } catch (error) {
      console.error('❌ Live - 통화 시작 에러:', error);
      alert(`통화 연결에 실패했습니다: ${error.message}`);
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
      {users.length === 0 ? (
        <EmptyMessage>
          <EmptyIcon>👥</EmptyIcon>
          <EmptyText>현재 접속 중인 사용자가 없습니다.</EmptyText>
        </EmptyMessage>
      ) : (
        <UserList>
          {users.map((user) => (
            <UserCard key={user.id}>
              <ProfileSection>
                <ProfileImage src={user.profileImage} alt={user.nickname} />
                <OnlineIndicator />
              </ProfileSection>
              <UserInfo>
                <UserHeader>
                  <Nickname>{user.nickname}</Nickname>
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
  background: white;
`;

const CategoryTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFC371 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 10px;
`;


const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const UserCard = styled.div`
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFC371 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
`;

const ProfileSection = styled.div`
  position: relative;
  margin-bottom: 16px;
  background: white;
  border-radius: 16px;
  padding: 8px;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(43, 87, 154, 0.1);
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background-color: #4CAF50;
  border: 4px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.5);
  animation: pulse-online 2s ease-in-out infinite;

  @keyframes pulse-online {
    0%, 100% {
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.5);
    }
    50% {
      box-shadow: 0 2px 16px rgba(76, 175, 80, 0.8);
    }
  }
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
    border-color: #FF6B6B;
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.3);
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);

  &:hover {
    background: linear-gradient(135deg, #FF9A5A 0%, #FF7A7A 100%);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    transform: translateY(-1px);
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