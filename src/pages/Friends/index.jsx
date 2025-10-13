import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { onlineStatusManager } from '../../utils/onlineStatus';

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // 온라인 사용자 상태
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadFriends();
  }, []);

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // 온라인 상태 관리
  useEffect(() => {
    if (!currentUserId) return;

    let unsubscribeStatusChange;

    const initializeOnlineStatus = async () => {
      try {
        // 온라인 상태 매니저 초기화
        await onlineStatusManager.initialize(currentUserId);
        
        // 온라인 상태 변경 구독
        unsubscribeStatusChange = onlineStatusManager.onStatusChange((statusEntries) => {
          const newOnlineUsers = new Map(statusEntries);
          setOnlineUsers(newOnlineUsers);
        });
      } catch (error) {
        console.error('❌ Friends - 온라인 상태 초기화 오류:', error);
      }
    };

    initializeOnlineStatus();

    return () => {
      if (unsubscribeStatusChange) {
        unsubscribeStatusChange();
      }
      // cleanup은 호출하지 않음 (싱글톤이므로 다른 페이지에서도 사용 중)
    };
  }, [currentUserId]);

  const loadFriends = async () => {
    try {
      // 현재 로그인한 사용자 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      console.log('🔵 Friends - 친구 목록 로드 시작, userId:', session.user.id);

      // friends 테이블에서 현재 사용자의 친구 목록 가져오기
      // friend_id로 users 테이블 조인하여 친구의 상세 정보 가져오기
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          created_at,
          friend:users!friend_id (
            id,
            nickname,
            email,
            profile_image,
            bio,
            interests,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      console.log('🔵 Friends - 조회 결과:', { friendsData, error });

      if (error) {
        console.error('❌ Friends - 친구 목록 로드 오류:', error);
        
        // friends 테이블이 없는 경우
        if (error.code === '42P01') {
          console.error('❌ friends 테이블이 존재하지 않습니다. create_friends_table.sql을 실행해주세요.');
        }
        
        setFriends([]);
      } else {
        // friend 객체를 추출하여 배열로 변환
        const friendsList = friendsData?.map(item => item.friend).filter(Boolean) || [];
        console.log('✅ Friends - 친구 목록:', friendsList.length, '명');
        setFriends(friendsList);
      }
    } catch (error) {
      console.error('❌ Friends - 친구 목록 로드 중 오류:', error);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자의 온라인 상태 확인
  const getUserOnlineStatus = (userId) => {
    if (userId === currentUserId) {
      return { is_online: true }; // 현재 사용자는 항상 온라인으로 표시
    }
    return onlineUsers.get(userId) || { is_online: false };
  };

  if (isLoading) {
    return (
      <FriendsWrapper>
        <CategoryTitle>친구</CategoryTitle>
        <LoadingContainer>
          <LoadingText>친구 목록을 불러오는 중...</LoadingText>
        </LoadingContainer>
      </FriendsWrapper>
    );
  }

  if (friends.length === 0) {
    return (
      <FriendsWrapper>
        <CategoryTitle>친구</CategoryTitle>
        <EmptyContainer>
          <EmptyIcon>👥</EmptyIcon>
          <EmptyText>아직 친구가 없습니다</EmptyText>
          <EmptySubtext>Home 페이지에서 마음에 드는 사람을 친구로 추가해보세요!</EmptySubtext>
          <AddFriendButton onClick={() => navigate('/')}>
            친구 찾으러 가기
          </AddFriendButton>
        </EmptyContainer>
      </FriendsWrapper>
    );
  }

  return (
    <FriendsWrapper>
      <CategoryTitle>친구</CategoryTitle>
      <FriendsList>
        {friends.map((friend) => (
          <FriendItem key={friend.id} onClick={() => navigate(`/profiles/${friend.id}`)}>
            <ProfileSection>
              <ProfileImage 
                src={friend.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.nickname}`} 
                alt={friend.nickname} 
              />
              <OnlineIndicator $isOnline={getUserOnlineStatus(friend.id).is_online} />
            </ProfileSection>
            
            <FriendInfo>
              <FriendHeader>
                <Nickname>{friend.nickname}</Nickname>
                <JoinDate>{new Date(friend.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 가입</JoinDate>
              </FriendHeader>
              
              {friend.bio && (
                <Bio>{friend.bio}</Bio>
              )}
              
              <Interests>
                <InterestLabel>관심사</InterestLabel>
                <InterestTags>
                  {friend.interests && friend.interests.length > 0 ? (
                    friend.interests.slice(0, 3).map((interest, index) => (
                      <InterestTag key={index}>{interest}</InterestTag>
                    ))
                  ) : (
                    <InterestTag>관심사 없음</InterestTag>
                  )}
                  {friend.interests && friend.interests.length > 3 && (
                    <InterestTag>+{friend.interests.length - 3}</InterestTag>
                  )}
                </InterestTags>
              </Interests>
            </FriendInfo>
          </FriendItem>
        ))}
      </FriendsList>
    </FriendsWrapper>
  );
};

const FriendsWrapper = styled.div`
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

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FriendItem = styled.div`
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

`;

const ProfileSection = styled.div`
  position: relative;
  margin-right: 16px;
`;

const ProfileImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  object-fit: cover;
  border: 2px solid var(--primary-light-blue);
  box-shadow: 0 2px 8px rgba(43, 87, 154, 0.15);
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
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

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Nickname = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const JoinDate = styled.span`
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
`;

const Bio = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Interests = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InterestLabel = styled.span`
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const InterestTag = styled.span`
  font-size: 12px;
  color: var(--primary-blue);
  background-color: var(--accent-blue);
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid rgba(43, 87, 154, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-light-blue);
    border-color: var(--primary-blue);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  padding: 20px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const EmptyText = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
`;

const EmptySubtext = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const AddFriendButton = styled.button`
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark-blue) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(43, 87, 154, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(43, 87, 154, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default Friends;