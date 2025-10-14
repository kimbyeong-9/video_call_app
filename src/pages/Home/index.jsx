import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiMessageCircle, FiUserPlus, FiUserCheck, FiUser, FiHeart } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import CommentIcon from '../../assets/images/comment_17619813.png';
import NotificationPopup from '../../components/common/NotificationPopup';
import { onlineStatusManager } from '../../utils/onlineStatus';
import { videoCall, WebRTCManager } from '../../utils/webrtc';

const Home = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendsList, setFriendsList] = useState([]); // 친구 목록
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // 온라인 사용자 상태
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadUserData();
    loadFriendsList();

    // 로그인 성공 플래그 확인 (sessionStorage)
    const socialLoginSuccess = sessionStorage.getItem('socialLoginSuccess');
    const loginMethod = sessionStorage.getItem('loginMethod');

    // 이미 모달을 표시했는지 확인하는 플래그 (localStorage)
    const hasShownLoginModal = localStorage.getItem('hasShownLoginModal');

    // 로그인 플래그가 있고, 아직 모달을 보여주지 않은 경우에만 표시
    if (socialLoginSuccess === 'true' && hasShownLoginModal !== 'true') {
      // 플래그 즉시 제거 및 설정
      sessionStorage.removeItem('socialLoginSuccess');
      sessionStorage.removeItem('loginMethod');
      localStorage.setItem('hasShownLoginModal', 'true');

      // 로그인 방법에 따른 메시지 표시
      let message = '로그인에 성공했습니다.';
      if (loginMethod === 'google') {
        message = 'Google 로그인에 성공했습니다.';
      }

      setNotification({
        show: true,
        message: message,
        type: 'success'
      });

      // 3초 후 알림 자동 닫기
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } else if (socialLoginSuccess === 'true') {
      // 이미 모달을 표시한 적이 있으면 플래그만 제거
      sessionStorage.removeItem('socialLoginSuccess');
      sessionStorage.removeItem('loginMethod');
    }
  }, []);

  // 온라인 상태 관리 및 실시간 추천 유저 업데이트
  useEffect(() => {
    if (!userProfile?.id) return;

    let unsubscribeStatusChange;

    const initializeOnlineStatus = async () => {
      try {
        // 온라인 상태 매니저 초기화
        await onlineStatusManager.initialize(userProfile.id);
        
        // 온라인 상태 변경 구독
        unsubscribeStatusChange = onlineStatusManager.onStatusChange(async (statusEntries) => {
          const newOnlineUsers = new Map(statusEntries);
          setOnlineUsers(newOnlineUsers);

          // 실시간으로 추천 유저 목록 업데이트
          const onlineUserIds = statusEntries
            .filter(([_userId, status]) => status.is_online)
            .map(([userId, _status]) => userId)
            .filter(userId => userId !== userProfile.id); // 현재 사용자 제외

          if (onlineUserIds.length > 0) {
            // Supabase에서 온라인 유저들의 프로필 정보 가져오기
            const { data: users, error: usersError } = await supabase
              .from('users')
              .select('*')
              .in('id', onlineUserIds)
              .limit(6);

            if (users && !usersError) {
              setRecommendedUsers(users);
            }
          } else {
            setRecommendedUsers([]);
          }
        });
      } catch (error) {
        console.error('❌ 온라인 상태 초기화 오류:', error);
      }
    };

    initializeOnlineStatus();

    return () => {
      if (unsubscribeStatusChange) {
        unsubscribeStatusChange();
      }
      // cleanup은 호출하지 않음 (싱글톤이므로 다른 페이지에서도 사용 중)
    };
  }, [userProfile?.id]);


  const loadUserData = async () => {
    try {
      // 현재 Supabase Auth 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setIsLoading(false);
        return;
      }

      // users 테이블에서 사용자 프로필 데이터 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        // 오류 발생 시 기본 정보로 프로필 표시
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email,
          nickname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '사용자',
          profile_image: session.user.user_metadata?.avatar_url || null,
          bio: null,
          interests: [],
          created_at: session.user.created_at || new Date().toISOString()
        };
        
        setUserProfile(fallbackProfile);
      } else {
        setUserProfile(profileData);
      }

      // 실시간 활동중인 사용자들만 가져오기 (현재 사용자 제외)
      const { data: onlineUsers, error: onlineError } = await supabase
        .from('user_online_status')
        .select('user_id')
        .eq('is_online', true);

      if (onlineUsers && !onlineError && onlineUsers.length > 0) {
        // 온라인 유저 ID 목록 추출
        const onlineUserIds = onlineUsers
          .map(status => status.user_id)
          .filter(userId => userId !== session.user.id); // 현재 사용자 제외

        if (onlineUserIds.length > 0) {
          // 온라인 유저들의 프로필 정보 가져오기
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', onlineUserIds)
            .limit(6);

          if (users && !usersError) {
            setRecommendedUsers(users);
          }
        } else {
          setRecommendedUsers([]);
        }
      } else {
        setRecommendedUsers([]);
      }
      
    } catch (error) {
      console.error('Home 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };



  // 프로필 카드 클릭 시 유저 프로필 페이지로 이동
  const handleCardClick = (userId) => {
    navigate(`/profiles/${userId}`);
  };

  // 메시지 버튼 클릭 시 채팅방 생성 및 이동
  const handleMessageClick = async (e, user) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    if (!userProfile?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userProfile.id === user.id) {
      alert('자신에게는 메시지를 보낼 수 없습니다.');
      return;
    }

    try {
      // 채팅방 ID 생성 (두 사용자 ID를 정렬하여 조합)
      const sortedIds = [userProfile.id, user.id].sort();
      const chatRoomId = `chat_${sortedIds[0]}_${sortedIds[1]}`;
      
      console.log('🔵 Home - 채팅방 생성 시작:', chatRoomId);
      
      // 채팅방 생성
      await createChatRoom(chatRoomId, userProfile, user);
      
      // 채팅방으로 이동
      navigate(`/chatting/${chatRoomId}`);
      
    } catch (error) {
      console.error('❌ Home - 채팅방 생성 오류:', error);
      alert('채팅방을 생성하는 중 오류가 발생했습니다.');
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
        console.warn('⚠️ Home - chat_rooms 생성 실패:', roomError);
      } else {
        console.log('✅ Home - chat_rooms 생성 완료:', roomId);
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
        console.warn('⚠️ Home - chat_participants 생성 실패:', participantError);
      } else {
        console.log('✅ Home - chat_participants 생성 완료:', roomId);
      }

    } catch (error) {
      console.error('❌ Home - 채팅방 생성 오류:', error);
      throw error;
    }
  };

  // 친구 목록 로드
  const loadFriendsList = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // friends 테이블에서 현재 사용자의 친구 목록 가져오기
      const { data: friends, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('친구 목록 로드 오류:', error);
        return;
      }

      // friend_id 배열로 변환
      const friendIds = friends?.map(f => f.friend_id) || [];
      setFriendsList(friendIds);
    } catch (error) {
      console.error('친구 목록 로드 중 오류:', error);
    }
  };

  // 친구 추가/제거 버튼 클릭
  const handleFriendToggle = async (e, user) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    if (!userProfile?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userProfile.id === user.id) {
      alert('자기 자신은 친구로 추가할 수 없습니다.');
      return;
    }

    const isFriend = friendsList.includes(user.id);

    try {
      if (isFriend) {
        // 친구 제거
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('friend_id', user.id);

        if (error) throw error;

        setFriendsList(prev => prev.filter(id => id !== user.id));
        setNotification({
          show: true,
          message: `${user.nickname}님을 친구 목록에서 제거했습니다.`,
          type: 'success'
        });
      } else {
        // 친구 추가
        const { error } = await supabase
          .from('friends')
          .insert({
            user_id: userProfile.id,
            friend_id: user.id
          });

        if (error) throw error;

        setFriendsList(prev => [...prev, user.id]);
        setNotification({
          show: true,
          message: `${user.nickname}님을 친구로 추가했습니다!`,
          type: 'success'
        });
      }

      // 3초 후 알림 자동 닫기
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);

    } catch (error) {
      console.error('친구 추가/제거 오류:', error);
      setNotification({
        show: true,
        message: '작업에 실패했습니다. 다시 시도해주세요.',
        type: 'error'
      });

      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // 영상통화 버튼 클릭
  const handleVideoCall = async (e, user) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    if (!userProfile?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (userProfile.id === user.id) {
      alert('자신에게는 영상통화를 걸 수 없습니다.');
      return;
    }

    try {
      console.log('🔵 Home - 영상통화 시작 요청');
      console.log('🔵 Home - 발신자 ID:', userProfile.id);
      console.log('🔵 Home - 수신자:', user.nickname, '/', user.id);

      // 이전 WebRTC 인스턴스가 있다면 정리
      const existingManager = new WebRTCManager(userProfile.id);
      existingManager.forceCleanup();

      // 통화 생성
      const { data: callData, error } = await videoCall.createCall(
        userProfile.id,
        user.id
      );

      if (error) {
        console.error('❌ Home - 통화 생성 실패:', error);
        alert(`영상통화를 시작할 수 없습니다: ${error.message}`);
        return;
      }

      console.log('✅ Home - 통화 생성 완료!');
      console.log('✅ Home - Call ID:', callData.id);

      // 영상통화 페이지로 이동 (발신자 모드)
      navigate(`/video-call?callId=${callData.id}&mode=caller`);

    } catch (error) {
      console.error('❌ Home - 영상통화 시작 에러:', error);
      alert(`영상통화 연결에 실패했습니다: ${error.message}`);
    }
  };

  // 사용자의 온라인 상태 확인
  const getUserOnlineStatus = (userId) => {
    if (userId === userProfile?.id) {
      return { is_online: true }; // 현재 사용자는 항상 온라인으로 표시
    }
    return onlineUsers.get(userId) || { is_online: false };
  };



  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>데이터를 불러오는 중...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <HomeWrapper>
      {notification.show && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}
      <Content>

        {/* 실시간 추천 유저 섹션 */}
        <RecommendedSection>
          <SectionHeader>
            <SectionTitle>
              <CommentImage src={CommentIcon} alt="댓글" />
              실시간 활동중인 사용자
            </SectionTitle>
            <SectionSubtitle>지금 온라인인 사용자들과 만나보세요</SectionSubtitle>
          </SectionHeader>

          {recommendedUsers.length > 0 ? (
            <VerticalScrollContainer>
              {recommendedUsers.map((user, index) => (
                <LargeUserCard
                  key={user.id}
                  $backgroundImage={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`}
                  onClick={() => handleCardClick(user.id)}
                >
                  <CardOverlay />
                  <CardContent>
                    <OnlineIndicatorLarge $isOnline={getUserOnlineStatus(user.id).is_online} />
                    <UserInfoLarge>
                      <UserNameLarge>{user.nickname}</UserNameLarge>
                      {user.gender && user.gender.trim() !== '' && (
                        <UserGenderLarge>
                          <GenderInfo $gender={user.gender}>
                            {user.gender === 'male' ? (
                              <FiUser size={16} />
                            ) : user.gender === 'female' ? (
                              <FiHeart size={16} />
                            ) : user.gender === 'prefer_not_to_say' ? (
                              <FiUser size={16} />
                            ) : (
                              <FiUser size={16} />
                            )}
                            <GenderText>
                              {user.gender === 'male' ? '남성' : 
                               user.gender === 'female' ? '여성' : 
                               user.gender === 'prefer_not_to_say' ? '비공개' :
                               user.gender}
                            </GenderText>
                          </GenderInfo>
                        </UserGenderLarge>
                      )}
                      <UserBioLarge>{user.bio || '소개가 없습니다.'}</UserBioLarge>
                      <UserInterestsLarge>
                        {user.interests && user.interests.length > 0 ? (
                          user.interests.slice(0, 4).map((interest, idx) => (
                            <InterestTagLarge key={idx}>{interest}</InterestTagLarge>
                          ))
                        ) : (
                          <InterestTagLarge>관심사 없음</InterestTagLarge>
                        )}
                      </UserInterestsLarge>
                    </UserInfoLarge>
                    <UserActionsLarge>
                      <ActionButtonLarge 
                        type="friend" 
                        $isFriend={friendsList.includes(user.id)}
                        onClick={(e) => handleFriendToggle(e, user)}
                      >
                        {friendsList.includes(user.id) ? (
                          <FiUserCheck size={20} />
                        ) : (
                          <FiUserPlus size={20} />
                        )}
                      </ActionButtonLarge>
                      <ActionButtonLarge 
                        type="chat" 
                        onClick={(e) => handleMessageClick(e, user)}
                      >
                        <FiMessageCircle size={20} />
                      </ActionButtonLarge>
                      <ActionButtonLarge 
                        type="video" 
                        onClick={(e) => handleVideoCall(e, user)}
                      >
                        <FiVideo size={20} />
                      </ActionButtonLarge>
                    </UserActionsLarge>
                  </CardContent>
                </LargeUserCard>
              ))}
            </VerticalScrollContainer>
          ) : (
            <EmptyStateContainer>
              <EmptyStateIcon>👥</EmptyStateIcon>
              <EmptyStateText>현재 온라인인 사용자가 없습니다.</EmptyStateText>
              <EmptyStateSubtext>잠시 후 다시 확인해보세요!</EmptyStateSubtext>
            </EmptyStateContainer>
          )}
        </RecommendedSection>
      </Content>
    </HomeWrapper>
  );
};

const HomeWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
  padding: 0;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Content = styled.div`
  padding: 20px 16px 40px 16px;
  min-height: calc(100vh - 70px);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid var(--primary-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
`;


// 추천 섹션
const RecommendedSection = styled.div`
  margin-bottom: 30px;
  padding-bottom: 0;
`;

const SectionHeader = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const CommentImage = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
`;

const SectionSubtitle = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
`;

// 세로 스크롤 가능한 카드 컨테이너
const VerticalScrollContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
  margin: 0;
`;

const LargeUserCard = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: auto;
  overflow: hidden;
  background-image: url(${props => props.$backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.85) 0%,
      rgba(0, 0, 0, 0.6) 30%,
      rgba(0, 0, 0, 0.3) 60%,
      rgba(0, 0, 0, 0.1) 80%,
      transparent 100%
    );
    z-index: 1;
  }
`;

const CardOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.3) 25%,
    rgba(0, 0, 0, 0.2) 50%,
    rgba(0, 0, 0, 0.1) 75%,
    transparent 100%
  );
  z-index: 1;
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 24px;
  gap: 20px;
`;

const OnlineIndicatorLarge = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 16px;
  height: 16px;
  background-color: ${props => props.$isOnline ? '#4CAF50' : '#9E9E9E'};
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px ${props => props.$isOnline ? 'rgba(76, 175, 80, 0.6)' : 'rgba(158, 158, 158, 0.6)'};
  animation: ${props => props.$isOnline ? 'pulse-online' : 'none'} 2s ease-in-out infinite;

  @keyframes pulse-online {
    0%, 100% {
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.6);
    }
    50% {
      box-shadow: 0 2px 16px rgba(76, 175, 80, 0.9);
    }
  }
`;

const UserInfoLarge = styled.div`
  width: 100%;
  text-align: left;
`;

const UserNameLarge = styled.h3`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.5px;
`;

const UserGenderLarge = styled.div`
  margin-bottom: 12px;
`;

const GenderInfo = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$gender',
})`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${props => {
    switch (props.$gender) {
      case 'male':
        return 'rgba(59, 130, 246, 0.2)'; // 파란색 계열
      case 'female':
        return 'rgba(236, 72, 153, 0.2)'; // 핑크색 계열
      case 'prefer_not_to_say':
        return 'rgba(107, 114, 128, 0.2)'; // 회색 계열
      default:
        return 'rgba(255, 255, 255, 0.15)';
    }
  }};
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid ${props => {
    switch (props.$gender) {
      case 'male':
        return 'rgba(59, 130, 246, 0.4)'; // 파란색 테두리
      case 'female':
        return 'rgba(236, 72, 153, 0.4)'; // 핑크색 테두리
      case 'prefer_not_to_say':
        return 'rgba(107, 114, 128, 0.4)'; // 회색 테두리
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => {
      switch (props.$gender) {
        case 'male':
          return 'rgba(59, 130, 246, 0.3)';
        case 'female':
          return 'rgba(236, 72, 153, 0.3)';
        case 'prefer_not_to_say':
          return 'rgba(107, 114, 128, 0.3)';
        default:
          return 'rgba(255, 255, 255, 0.25)';
      }
    }};
    transform: translateY(-1px);
  }
`;

const GenderText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const UserBioLarge = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 16px 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const UserInterestsLarge = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
`;

const InterestTagLarge = styled.span`
  background-color: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const UserActionsLarge = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 8px;
`;

const ActionButtonLarge = styled.button`
  background: ${props => {
    if (props.type === 'friend') {
      return props.$isFriend 
        ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' // 친구 추가됨 (초록색)
        : 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)'; // 친구 추가 (주황색)
    }
    if (props.type === 'video') {
      return 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)'; // 영상통화 (핑크색)
    }
    return 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'; // 채팅 (보라색)
  }};
  border: none;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: scale(1.15) translateY(-2px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.4);
  }

  &:active {
    transform: scale(1.05) translateY(0);
  }
`;

// 빈 상태 스타일
const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.7;
`;

const EmptyStateText = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const EmptyStateSubtext = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
`;



export default Home;