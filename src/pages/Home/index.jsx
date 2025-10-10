import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiHeart, FiMessageCircle, FiSettings, FiStar, FiMapPin, FiGlobe, FiChevronLeft, FiChevronRight, FiShuffle, FiZap } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';

const Home = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('🔵 Home - 사용자 데이터 로드 시작');
      
      // 현재 Supabase Auth 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔵 Home - 현재 Auth 세션:', session);
      
      if (sessionError) {
        console.error('❌ Home - 세션 확인 오류:', sessionError);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        console.log('❌ Home - 로그인된 사용자 없음');
        setIsLoading(false);
        return;
      }

      console.log('🔵 Home - 현재 Auth 사용자:', session.user.email, session.user.id);

      // users 테이블에서 사용자 프로필 데이터 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('🔵 Home - Supabase 응답:', { profileData, profileError });

      if (profileError) {
        console.error('❌ Home - 프로필 로드 오류:', profileError);
        
        // 오류가 발생해도 기본 정보로 프로필 표시
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
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          nickname: fallbackProfile.nickname
        });
        
      } else {
        console.log('✅ Home - 프로필 데이터 로드 성공:', profileData);
        setUserProfile(profileData);
        setCurrentUser({
          id: profileData.id,
          email: profileData.email,
          nickname: profileData.nickname
        });
      }

      // 추천 사용자들 가져오기 (현재 사용자 제외)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('id', session.user.id)
        .limit(6);

      if (users && !usersError) {
        setRecommendedUsers(users);
        console.log('✅ Home - 추천 사용자 로드 성공:', users.length + '명');
      } else {
        console.error('❌ Home - 추천 사용자 로드 오류:', usersError);
      }
      
    } catch (error) {
      console.error('❌ Home - 데이터 로드 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatching = () => {
    navigate('/live');
  };

  const handlePrevUser = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? recommendedUsers.length - 1 : prev - 1
    );
  };

  const handleNextUser = () => {
    setCurrentIndex((prev) => 
      prev === recommendedUsers.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    // 세로 스크롤 방지
    e.preventDefault();
    
    const touch = e.touches[0].clientX;
    setCurrentX(touch);
    
    // 드래그 중 실시간으로 카드 이동 효과
    const diff = touch - startX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = startX - currentX;
    const threshold = 50; // 50px 이상 드래그 시 카드 전환
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNextUser(); // 왼쪽으로 스와이프 (다음)
      } else {
        handlePrevUser(); // 오른쪽으로 스와이프 (이전)
      }
    }
    
    // 상태 초기화
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
    setDragOffset(0);
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const mouse = e.clientX;
    setCurrentX(mouse);
    
    // 드래그 중 실시간으로 카드 이동 효과
    const diff = mouse - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const diff = startX - currentX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNextUser();
      } else {
        handlePrevUser();
      }
    }
    
    // 상태 초기화
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
    setDragOffset(0);
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
      <Content>
        {/* 나의 프로필 섹션 */}
        <MyProfileSection>
          <ProfileCard>
            <ProfileImageContainer>
              <ProfileImage 
                src={userProfile?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.nickname || userProfile?.email || 'user'}`}
                alt="내 프로필"
              />
              <OnlineStatus />
            </ProfileImageContainer>
            <ProfileInfo>
              <ProfileName>{userProfile?.nickname || '사용자'}</ProfileName>
              <ProfileBio>{userProfile?.bio || '소개가 없습니다.'}</ProfileBio>
              <ProfileInterestsSection>
                <InterestsLabel>관심사</InterestsLabel>
                <ProfileInterests>
                  {userProfile?.interests && userProfile.interests.length > 0 ? (
                    userProfile.interests.map((interest, index) => (
                      <InterestTag key={index}>{interest}</InterestTag>
                    ))
                  ) : (
                    <InterestTag>관심사 없음</InterestTag>
                  )}
                </ProfileInterests>
              </ProfileInterestsSection>
            </ProfileInfo>
            <EditButton onClick={() => navigate('/profiles/edit')}>
              <FiSettings size={16} />
            </EditButton>
          </ProfileCard>
        </MyProfileSection>

        {/* 매칭 시작 버튼 */}
        <MatchingSection>
          <StartMatchingButton onClick={handleStartMatching}>
            <RandomIconWrapper>
              <ShuffleIcon>
                <FiShuffle size={28} />
              </ShuffleIcon>
              <ZapIcon delay="0s">
                <FiZap size={16} />
              </ZapIcon>
              <ZapIcon delay="0.3s">
                <FiZap size={14} />
              </ZapIcon>
              <ZapIcon delay="0.6s">
                <FiZap size={12} />
              </ZapIcon>
            </RandomIconWrapper>
            <ButtonContent>
              <ButtonTitle>랜덤 매칭 시작</ButtonTitle>
              <ButtonSubtitle>
                <ShuffleText>🎲</ShuffleText>
                새로운 인연과 즉시 연결
                <ShuffleText>✨</ShuffleText>
              </ButtonSubtitle>
            </ButtonContent>
            <VideoIconSmall>
              <FiVideo size={20} />
            </VideoIconSmall>
          </StartMatchingButton>
        </MatchingSection>

        {/* 실시간 추천 유저 섹션 */}
        <RecommendedSection>
          <SectionHeader>
            <SectionTitle>
              <FiStar size={20} />
              실시간 추천
            </SectionTitle>
            <SectionSubtitle>지금 활성화된 사용자들과 만나보세요</SectionSubtitle>
          </SectionHeader>

          {recommendedUsers.length > 0 && (
            <SliderContainer>
              <SliderWrapper
                ref={sliderRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {recommendedUsers.map((user, index) => (
                  <LargeUserCard
                    key={user.id}
                    $backgroundImage={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`}
                  >
                    <CardOverlay />
                    <CardContent>
                      <OnlineIndicatorLarge />
                      <UserInfoLarge>
                        <UserNameLarge>{user.nickname}</UserNameLarge>
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
                        <ActionButtonLarge type="like">
                          <FiHeart size={20} />
                        </ActionButtonLarge>
                        <ActionButtonLarge type="chat">
                          <FiMessageCircle size={20} />
                        </ActionButtonLarge>
                      </UserActionsLarge>
                    </CardContent>
                  </LargeUserCard>
                ))}
              </SliderWrapper>

              <NavigationButtons>
                <NavButton onClick={handlePrevUser}>
                  <FiChevronLeft size={24} />
                </NavButton>
                <PaginationDots>
                  {recommendedUsers.map((_, index) => (
                    <Dot
                      key={index}
                      $active={index === currentIndex}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </PaginationDots>
                <NavButton onClick={handleNextUser}>
                  <FiChevronRight size={24} />
                </NavButton>
              </NavigationButtons>
            </SliderContainer>
          )}
        </RecommendedSection>
      </Content>
    </HomeWrapper>
  );
};

const HomeWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
  padding-bottom: 80px;
`;

const Content = styled.div`
  padding: 20px 16px;
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

// 나의 프로필 섹션
const MyProfileSection = styled.div`
  margin-bottom: 32px;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const ProfileImageContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-light-blue);
`;

const OnlineStatus = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background-color: #4CAF50;
  border: 3px solid white;
  border-radius: 50%;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const ProfileBio = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProfileInterestsSection = styled.div`
  margin-top: 8px;
`;

const InterestsLabel = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const ProfileInterests = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const InterestTag = styled.span`
  background-color: var(--accent-blue);
  color: var(--primary-blue);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
`;


const EditButton = styled.button`
  background: var(--accent-blue);
  border: none;
  border-radius: 12px;
  padding: 12px;
  color: var(--primary-blue);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--primary-light-blue);
  }
`;

// 추천 섹션
const RecommendedSection = styled.div`
  margin-bottom: 32px;
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

const SectionSubtitle = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
`;

// 스와이프 가능한 카드 슬라이더
const SliderContainer = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 20px;
`;

const SliderWrapper = styled.div`
  display: flex;
  width: 100%;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
  
  &:active {
    cursor: grabbing;
  }
`;

const LargeUserCard = styled.div`
  min-width: 100%;
  height: 500px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 25%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.2) 75%,
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
  background-color: #4CAF50;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.6);
  animation: pulse-online 2s ease-in-out infinite;

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
  margin: 0 0 12px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.5px;
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
  background: ${props => props.type === 'like' 
    ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%)' 
    : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
  };
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

const NavigationButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 20px;
`;

const NavButton = styled.button`
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: var(--primary-blue);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--accent-blue);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PaginationDots = styled.div`
  display: flex;
  gap: 8px;
`;

const Dot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background-color: ${props => props.$active ? 'var(--primary-blue)' : '#e5e7eb'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-blue);
    transform: scale(1.2);
  }
`;

// 매칭 섹션
const MatchingSection = styled.div`
  margin-bottom: 32px;
`;

const StartMatchingButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFC371 100%);
  border: none;
  border-radius: 24px;
  padding: 24px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 70%
    );
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(255, 107, 107, 0.5);
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }
`;

const RandomIconWrapper = styled.div`
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
`;

const ShuffleIcon = styled.div`
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: rotate 4s linear infinite;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ZapIcon = styled.div`
  position: absolute;
  color: #FFE66D;
  animation: spark 2s ease-in-out infinite;
  animation-delay: ${props => props.delay};
  filter: drop-shadow(0 0 4px #FFE66D);

  &:nth-child(2) {
    top: 5px;
    right: -5px;
  }

  &:nth-child(3) {
    bottom: 8px;
    left: -3px;
  }

  &:nth-child(4) {
    top: 50%;
    right: -8px;
    transform: translateY(-50%);
  }

  @keyframes spark {
    0%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }
`;

const ButtonContent = styled.div`
  flex: 1;
  text-align: left;
  position: relative;
  z-index: 1;
`;

const ButtonTitle = styled.h3`
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  letter-spacing: -0.5px;
`;

const ButtonSubtitle = styled.p`
  font-size: 14px;
  opacity: 0.95;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
`;

const ShuffleText = styled.span`
  display: inline-block;
  animation: bounce 1.5s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: 0s;
  }

  &:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
`;

const VideoIconSmall = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
    }
  }
`;

export default Home;