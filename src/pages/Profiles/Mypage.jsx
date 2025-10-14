import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const Mypage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('🔵 Mypage - 사용자 프로필 로드 시작');
      setLoading(true);
      
      // 현재 Supabase Auth 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔵 Mypage - 현재 Auth 세션:', session);
      
      if (sessionError) {
        console.error('❌ Mypage - 세션 확인 오류:', sessionError);
        navigate('/login');
        return;
      }

      if (!session?.user) {
        console.log('❌ Mypage - 로그인된 사용자 없음, 로그인 페이지로 이동');
        navigate('/login');
        return;
      }

      console.log('🔵 Mypage - 현재 Auth 사용자:', session.user.email, session.user.id);

      // users 테이블에서 사용자 프로필 데이터 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('🔵 Mypage - Supabase 응답:', { profileData, profileError });
      console.log('🔵 Mypage - Gender:', profileData?.gender);
      console.log('🔵 Mypage - Location:', profileData?.location);

      if (profileError) {
        console.error('❌ Mypage - 프로필 로드 오류:', profileError);
        
        // 오류가 발생해도 기본 정보로 프로필 표시
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email,
          nickname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '사용자',
          profile_image: session.user.user_metadata?.avatar_url || null,
          bio: null,
          interests: [],
          gender: null,
          location: null,
          created_at: session.user.created_at || new Date().toISOString()
        };
        
        setUserProfile(fallbackProfile);
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          nickname: fallbackProfile.nickname
        });
        
        // localStorage 업데이트
        localStorage.setItem('currentUser', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          nickname: fallbackProfile.nickname
        }));
        
      } else {
        console.log('✅ Mypage - 프로필 데이터 로드 성공:', profileData);
        setUserProfile(profileData);
        setCurrentUser({
          id: profileData.id,
          email: profileData.email,
          nickname: profileData.nickname
        });
        
        // localStorage 업데이트
        localStorage.setItem('currentUser', JSON.stringify({
          id: profileData.id,
          email: profileData.email,
          nickname: profileData.nickname
        }));
      }
      
    } catch (error) {
      console.error('❌ Mypage - 프로필 로드 중 오류:', error);
      navigate('/login');
    } finally {
      console.log('🔵 Mypage - 로딩 완료');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProfileWrapper>
        <LoadingMessage>프로필을 불러오는 중...</LoadingMessage>
      </ProfileWrapper>
    );
  }

  if (!userProfile) {
    return (
      <ProfileWrapper>
        <ErrorMessage>프로필을 불러올 수 없습니다.</ErrorMessage>
      </ProfileWrapper>
    );
  }

  // 프로필 이미지 URL 생성 (DiceBear API 사용)
  const profileImageUrl = userProfile.profile_image || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile.nickname || userProfile.email)}`;

  // 관심사 데이터 처리
  const interests = userProfile.interests || [];

  // 가입일 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 성별 값을 한국어로 변환
  const getGenderLabel = (gender) => {
    const genderMap = {
      'male': '남성',
      'female': '여성',
      'prefer_not_to_say': '비공개'
    };
    return genderMap[gender] || gender;
  };

  // 지역 값을 한국어로 변환
  const getLocationLabel = (location) => {
    const locationMap = {
      'seoul': '서울특별시',
      'busan': '부산광역시',
      'daegu': '대구광역시',
      'incheon': '인천광역시',
      'gwangju': '광주광역시',
      'daejeon': '대전광역시',
      'ulsan': '울산광역시',
      'sejong': '세종특별자치시',
      'gyeonggi': '경기도',
      'gangwon': '강원도',
      'chungbuk': '충청북도',
      'chungnam': '충청남도',
      'jeonbuk': '전라북도',
      'jeonnam': '전라남도',
      'gyeongbuk': '경상북도',
      'gyeongnam': '경상남도',
      'jeju': '제주특별자치도'
    };
    return locationMap[location] || location;
  };

  return (
    <ProfileWrapper>
      <Header>
        <HeaderTitle>프로필</HeaderTitle>
        <EditButton onClick={() => navigate('/profiles/edit')}>
          편집
        </EditButton>
      </Header>

      <ProfileContent>
        <ProfileImageSection>
          <ProfileImage src={profileImageUrl} alt="프로필" />
          <OnlineIndicator />
        </ProfileImageSection>

        <ProfileInfo>
          <Nickname>{userProfile.nickname || '닉네임 없음'}</Nickname>
          <Bio>{userProfile.bio || '소개가 없습니다.'}</Bio>
          
          {/* 성별과 지역 정보 */}
          <ProfileDetails>
            {userProfile.gender && (
              <DetailItem>
                <DetailLabel>성별</DetailLabel>
                <DetailValue>{getGenderLabel(userProfile.gender)}</DetailValue>
              </DetailItem>
            )}
            {userProfile.location && (
              <DetailItem>
                <DetailLabel>내 동네</DetailLabel>
                <DetailValue>{getLocationLabel(userProfile.location)}</DetailValue>
              </DetailItem>
            )}
          </ProfileDetails>
        </ProfileInfo>

        {interests.length > 0 && (
          <InterestsSection>
            <SectionTitle>관심사</SectionTitle>
            <InterestsList>
              {interests.map((interest, index) => (
                <InterestItem key={index}>
                  <InterestName>{interest}</InterestName>
                </InterestItem>
              ))}
            </InterestsList>
          </InterestsSection>
        )}


        <AccountDetails>
          <DetailItem>
            <DetailLabel>이메일</DetailLabel>
            <DetailValue>{userProfile.email}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>가입일</DetailLabel>
            <DetailValue>{formatDate(userProfile.created_at)}</DetailValue>
          </DetailItem>
        </AccountDetails>
      </ProfileContent>
    </ProfileWrapper>
  );
};

const ProfileWrapper = styled.div`
  padding: 20px 0;
  padding-bottom: 70px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 20px;
`;

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-blue);
`;

const EditButton = styled.button`
  padding: 8px 16px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-dark-blue);
  }
`;

const ProfileContent = styled.div`
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const ProfileImageSection = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 60px;
  object-fit: cover;
  border: 3px solid var(--primary-light-blue);
  box-shadow: 0 4px 12px rgba(43, 87, 154, 0.15);
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background-color: #4CAF50;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
`;

const ProfileInfo = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Nickname = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const Bio = styled.p`
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.5;
`;

const InterestsSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

const InterestsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const InterestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--accent-blue);
  border-radius: 20px;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-light-blue);
  }
`;

const InterestName = styled.span`
  font-size: 14px;
  color: var(--primary-blue);
  font-weight: 500;
`;

// 프로필 상세 정보 (성별, 지역)
const ProfileDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background-color: var(--accent-blue);
  border-radius: 12px;
`;

// 계정 정보 (이메일, 가입일)
const AccountDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--primary-light-blue);
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DetailLabel = styled.span`
  font-size: 14px;
  color: var(--text-light);
  min-width: 40px;
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  flex: 1;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: var(--text-secondary);
`;

const ErrorMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: var(--error-red);
`;

export default Mypage;