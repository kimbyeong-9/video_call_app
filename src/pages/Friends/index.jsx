import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      // 현재 사용자 제외한 모든 사용자 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('친구 목록 로드 오류:', error);
        setFriends([]);
      } else {
        setFriends(users || []);
      }
    } catch (error) {
      console.error('친구 목록 로드 중 오류:', error);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
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
          <EmptyText>아직 친구가 없습니다</EmptyText>
          <EmptySubtext>새로운 사람들과 만나보세요!</EmptySubtext>
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
              <OnlineIndicator />
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
  background-color: #4CAF50;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
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
  height: 300px;
  text-align: center;
`;

const EmptyText = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const EmptySubtext = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
`;

export default Friends;