import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { FiSearch } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import { onlineStatusManager } from '../../utils/onlineStatus';

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // 온라인 사용자 상태
  const [currentUserId, setCurrentUserId] = useState(null);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [isRecommendOpen, setIsRecommendOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [filteredRecommendedUsers, setFilteredRecommendedUsers] = useState([]);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadRecommendedUsers();
    }
  }, [currentUserId]);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFriends(friends);
      setFilteredRecommendedUsers(recommendedUsers);
    } else {
      const searchLower = searchTerm.toLowerCase();
      
      // 친구 목록 필터링
      const filtered = friends.filter(friend => 
        friend.nickname.toLowerCase().includes(searchLower) ||
        (friend.bio && friend.bio.toLowerCase().includes(searchLower)) ||
        (friend.interests && friend.interests.some(interest => 
          interest.toLowerCase().includes(searchLower)
        ))
      );
      setFilteredFriends(filtered);

      // 추천 유저 목록 필터링
      const filteredRec = recommendedUsers.filter(user => 
        user.nickname.toLowerCase().includes(searchLower) ||
        (user.bio && user.bio.toLowerCase().includes(searchLower)) ||
        (user.interests && user.interests.some(interest => 
          interest.toLowerCase().includes(searchLower)
        ))
      );
      setFilteredRecommendedUsers(filteredRec);
    }
  }, [searchTerm, friends, recommendedUsers]);

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

  const loadRecommendedUsers = async () => {
    try {
      // Supabase에서 최근 가입한 사용자들을 추천으로 표시 (자기 자신 제외)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, nickname, email, bio, profile_image, created_at, interests, gender')
        .neq('id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Friends - 추천 사용자 조회 오류:', error);
        setRecommendedUsers([]);
        return;
      }

      setRecommendedUsers(users || []);
    } catch (error) {
      console.error('Friends - 추천 사용자 로드 오류:', error);
      setRecommendedUsers([]);
    }
  };

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
            created_at,
            gender
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

  // 성별 표시 함수
  const getGenderLabel = (gender) => {
    if (!gender || gender.trim() === '') {
      return '미설정';
    }
    switch (gender) {
      case 'male':
        return '남성';
      case 'female':
        return '여성';
      case 'prefer_not_to_say':
        return '비공개';
      default:
        return gender;
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
        <SearchSection>
          <SearchForm>
            <SearchIcon>
              <FiSearch size={20} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="친구나 추천 유저 검색하기"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchForm>
        </SearchSection>
        
        <CategoryTitle>
          친구
          <FriendCount>{filteredFriends.length}</FriendCount>
        </CategoryTitle>
        <EmptyContainer>
          <EmptyIcon>👥</EmptyIcon>
          <EmptyText>아직 친구가 없습니다</EmptyText>
          <EmptySubtext>Home 페이지에서 마음에 드는 사람을 친구로 추가해보세요!</EmptySubtext>
          <AddFriendButton onClick={() => navigate('/')}>
            친구 찾으러 가기
          </AddFriendButton>
        </EmptyContainer>

        {/* 추천 유저 섹션 - 검색어가 없거나 추천 유저 결과가 있을 때만 표시 */}
        {(!searchTerm || filteredRecommendedUsers.length > 0) && (
          <RecommendSection>
            <RecommendHeader onClick={() => setIsRecommendOpen(!isRecommendOpen)}>
              <h3>추천 유저</h3>
              {isRecommendOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </RecommendHeader>
            
            {isRecommendOpen && (
              <RecommendContent>
                {filteredRecommendedUsers.length === 0 && searchTerm ? (
                  <NoResultsMessage>
                    <NoResultsIcon>🔍</NoResultsIcon>
                    <NoResultsText>추천 유저에서 "{searchTerm}"에 대한 검색 결과가 없습니다</NoResultsText>
                    <NoResultsSubtext>다른 검색어를 시도해보세요</NoResultsSubtext>
                  </NoResultsMessage>
                ) : (
                  filteredRecommendedUsers.map(user => (
                <UserCard key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                  <ProfileSection>
                    <ProfileImage 
                      src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                      alt={user.nickname} 
                    />
                    <OnlineIndicator $isOnline={getUserOnlineStatus(user.id).is_online} />
                  </ProfileSection>
                  
                  <UserInfo>
                    <UserHeader>
                      <Nickname>{user.nickname}</Nickname>
                      <GenderBadge $gender={user.gender}>
                        {getGenderLabel(user.gender)}
                      </GenderBadge>
                    </UserHeader>
                    
                    {user.bio && (
                      <Bio>{user.bio}</Bio>
                    )}
                    
                    {user.interests && user.interests.length > 0 && (
                      <InterestTags>
                        {Array.isArray(user.interests) 
                          ? user.interests.slice(0, 3).map((interest, index) => (
                              <InterestTag key={index}>{interest}</InterestTag>
                            ))
                          : null
                        }
                        {user.interests.length > 3 && (
                          <InterestTag>+{user.interests.length - 3}</InterestTag>
                        )}
                      </InterestTags>
                    )}
                  </UserInfo>
                </UserCard>
                  ))
                )}
              </RecommendContent>
            )}
          </RecommendSection>
        )}

        {/* 검색 결과가 전혀 없을 때의 메시지 */}
        {searchTerm && filteredFriends.length === 0 && filteredRecommendedUsers.length === 0 && (
          <NoResultsMessage>
            <NoResultsIcon>🔍</NoResultsIcon>
            <NoResultsText>"{searchTerm}"에 대한 검색 결과가 없습니다</NoResultsText>
            <NoResultsSubtext>친구나 추천 유저에서 해당 검색어를 찾을 수 없습니다</NoResultsSubtext>
          </NoResultsMessage>
        )}
      </FriendsWrapper>
    );
  }

  return (
    <FriendsWrapper>
      <SearchSection>
        <SearchForm>
          <SearchIcon>
            <FiSearch size={20} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="친구나 추천 유저 검색하기"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchForm>
      </SearchSection>
      
      {/* 친구 섹션 - 검색어가 없거나 친구 결과가 있을 때만 표시 */}
      {(!searchTerm || filteredFriends.length > 0) && (
        <>
          <CategoryTitle>
            친구
            <FriendCount>{filteredFriends.length}</FriendCount>
          </CategoryTitle>
          {filteredFriends.length === 0 && searchTerm ? (
            <NoResultsMessage>
              <NoResultsIcon>🔍</NoResultsIcon>
              <NoResultsText>"{searchTerm}"에 대한 검색 결과가 없습니다</NoResultsText>
              <NoResultsSubtext>다른 검색어를 시도해보세요</NoResultsSubtext>
            </NoResultsMessage>
          ) : (
            <FriendsList>
              {filteredFriends.map((friend) => (
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
                <GenderBadge $gender={friend.gender}>
                  {getGenderLabel(friend.gender)}
                </GenderBadge>
              </FriendHeader>
              
              {friend.bio && (
                <Bio>{friend.bio}</Bio>
              )}
              
              <Interests>
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
          )}
        </>
      )}

      {/* 추천 유저 섹션 - 검색어가 없거나 추천 유저 결과가 있을 때만 표시 */}
      {(!searchTerm || filteredRecommendedUsers.length > 0) && (
        <RecommendSection>
          <RecommendHeader onClick={() => setIsRecommendOpen(!isRecommendOpen)}>
            <h3>추천 유저</h3>
            {isRecommendOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </RecommendHeader>
          
          {isRecommendOpen && (
            <RecommendContent>
              {filteredRecommendedUsers.length === 0 && searchTerm ? (
                <NoResultsMessage>
                  <NoResultsIcon>🔍</NoResultsIcon>
                  <NoResultsText>추천 유저에서 "{searchTerm}"에 대한 검색 결과가 없습니다</NoResultsText>
                  <NoResultsSubtext>다른 검색어를 시도해보세요</NoResultsSubtext>
                </NoResultsMessage>
              ) : (
                filteredRecommendedUsers.map(user => (
              <UserCard key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                <ProfileSection>
                  <ProfileImage 
                    src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                    alt={user.nickname} 
                  />
                  <OnlineIndicator $isOnline={getUserOnlineStatus(user.id).is_online} />
                </ProfileSection>
                
                <UserInfo>
                  <UserHeader>
                    <Nickname>{user.nickname}</Nickname>
                    <GenderBadge $gender={user.gender}>
                      {getGenderLabel(user.gender)}
                    </GenderBadge>
                  </UserHeader>
                  
                  {user.bio && (
                    <Bio>{user.bio}</Bio>
                  )}
                  
                  {user.interests && user.interests.length > 0 && (
                    <InterestTags>
                      {Array.isArray(user.interests) 
                        ? user.interests.slice(0, 3).map((interest, index) => (
                            <InterestTag key={index}>{interest}</InterestTag>
                          ))
                        : null
                      }
                      {user.interests.length > 3 && (
                        <InterestTag>+{user.interests.length - 3}</InterestTag>
                      )}
                    </InterestTags>
                  )}
                </UserInfo>
              </UserCard>
                ))
              )}
            </RecommendContent>
          )}
        </RecommendSection>
      )}

      {/* 검색 결과가 전혀 없을 때의 메시지 */}
      {searchTerm && filteredFriends.length === 0 && filteredRecommendedUsers.length === 0 && (
        <NoResultsMessage>
          <NoResultsIcon>🔍</NoResultsIcon>
          <NoResultsText>"{searchTerm}"에 대한 검색 결과가 없습니다</NoResultsText>
          <NoResultsSubtext>친구나 추천 유저에서 해당 검색어를 찾을 수 없습니다</NoResultsSubtext>
        </NoResultsMessage>
      )}
    </FriendsWrapper>
  );
};

const FriendsWrapper = styled.div`
  padding: 20px 0;
  padding-bottom: 70px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

// 검색 섹션 스타일
const SearchSection = styled.div`
  margin-bottom: 20px;
  padding: 0 20px;
`;

const SearchForm = styled.form`
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: 25px;
  padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;

  &:focus-within {
    box-shadow: 0 6px 25px rgba(43, 87, 154, 0.15);
    border-color: var(--primary-light-blue);
  }
`;

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  margin-right: 12px;
  transition: color 0.2s ease;

  ${SearchForm}:focus-within & {
    color: var(--primary-blue);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;

  &::placeholder {
    color: var(--text-light);
  }
`;

const CategoryTitle = styled.h1`
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 20px;
  color: var(--primary-blue);
  text-shadow: 0 2px 4px rgba(43, 87, 154, 0.1);
  padding: 0 20px;
`;

const FriendCount = styled.span`
  color: var(--primary-blue);
  font-size: 24px;
  font-weight: 800;
  margin-left: 8px;
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

// 성별 배지 스타일
const GenderBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$gender',
})`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
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
  color: ${props => {
    switch (props.$gender) {
      case 'male':
        return '#3b82f6'; // 파란색
      case 'female':
        return '#ec4899'; // 핑크색
      case 'prefer_not_to_say':
        return '#6b7280'; // 회색
      default:
        return 'var(--text-light)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$gender) {
      case 'male':
        return 'rgba(59, 130, 246, 0.4)';
      case 'female':
        return 'rgba(236, 72, 153, 0.4)';
      case 'prefer_not_to_say':
        return 'rgba(107, 114, 128, 0.4)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  }};
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

// 추천 유저 섹션 스타일
const RecommendSection = styled.div`
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  margin-top: 24px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const RecommendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background-color: rgba(43, 87, 154, 0.05);
  border-bottom: 1px solid rgba(43, 87, 154, 0.1);
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(43, 87, 154, 0.1);
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
`;

const RecommendContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(43, 87, 154, 0.1);
  background: var(--bg-card);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(43, 87, 154, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

// 검색 결과 없음 메시지 스타일
const NoResultsMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: var(--bg-card);
  border-radius: 16px;
  margin: 16px 0;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const NoResultsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
`;

const NoResultsText = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const NoResultsSubtext = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
`;

export default Friends;