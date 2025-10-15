import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { FiMessageCircle } from 'react-icons/fi';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // 성별 데이터를 한국어로 변환하는 헬퍼 함수
  const getGenderLabel = (gender) => {
    if (!gender || gender.trim() === '') return '미설정';
    
    const genderMap = {
      'male': '남성',
      'female': '여성',
      'prefer_not_to_say': '비공개'
    };
    
    return genderMap[gender] || gender;
  };

  // 지역 데이터를 한국어로 변환하는 헬퍼 함수
  const getLocationLabel = (location) => {
    if (!location) return null;
    
    const locationMap = {
      'seoul': '서울',
      'busan': '부산',
      'daegu': '대구',
      'incheon': '인천',
      'gwangju': '광주',
      'daejeon': '대전',
      'ulsan': '울산',
      'gyeonggi': '경기',
      'gangwon': '강원',
      'chungbuk': '충북',
      'chungnam': '충남',
      'jeonbuk': '전북',
      'jeonnam': '전남',
      'gyeongbuk': '경북',
      'gyeongnam': '경남',
      'jeju': '제주'
    };
    
    return locationMap[location] || null;
  };

  const loadUserProfile = async () => {
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }

      // 프로필 조회 대상 사용자 정보 가져오기
      const { data: profileUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('UserProfile - 사용자 조회 오류:', error);
        throw error;
      }

      if (!profileUser) {
        console.error('UserProfile - 사용자를 찾을 수 없음');
        return;
      }

      console.log('🔵 UserProfile - 사용자 데이터 로드:', profileUser);
      console.log('🔵 UserProfile - Gender:', profileUser.gender);
      console.log('🔵 UserProfile - Location:', profileUser.location);

      setUserData(profileUser);
    } catch (error) {
      console.error('UserProfile - 프로필 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleMessageClick = async () => {
    try {
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      if (!userData) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 자신과의 채팅은 불가능
      if (currentUser.id === userData.id) {
        alert('자신에게는 메시지를 보낼 수 없습니다.');
        return;
      }
      
      // 간단한 채팅방 ID 생성 (두 사용자 ID를 조합)
      const sortedIds = [currentUser.id, userData.id].sort();
      const chatRoomId = `chat_${sortedIds[0]}_${sortedIds[1]}`;

      console.log('🔵 UserProfile - 채팅방 생성 시작:', chatRoomId);
      
      // 채팅방 생성
      await createChatRoom(chatRoomId, currentUser, userData);

      // 채팅 페이지로 이동
      navigate(`/chatting/${chatRoomId}`);
      
    } catch (error) {
      console.error('UserProfile - 메시지 버튼 클릭 오류:', error);
      alert('메시지를 시작하는 중 오류가 발생했습니다.');
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
        console.warn('⚠️ UserProfile - chat_rooms 생성 실패:', roomError);
      } else {
        console.log('✅ UserProfile - chat_rooms 생성 완료:', roomId);
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
        console.warn('⚠️ UserProfile - chat_participants 생성 실패:', participantError);
      } else {
        console.log('✅ UserProfile - chat_participants 생성 완료:', roomId);
      }

    } catch (error) {
      console.error('❌ UserProfile - 채팅방 생성 오류:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <LoadingText>프로필을 불러오는 중...</LoadingText>
      </LoadingWrapper>
    );
  }

  if (!userData) {
    return (
      <LoadingWrapper>
        <LoadingText>사용자를 찾을 수 없습니다.</LoadingText>
      </LoadingWrapper>
    );
  }

  return (
    <ProfileWrapper>
      <Header>
        <HeaderTitle>프로필</HeaderTitle>
      </Header>

      <ProfileContent>
        <ProfileImageSection>
          <ProfileImage 
            src={userData.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.nickname}`} 
            alt="프로필" 
          />
          <OnlineIndicator />
        </ProfileImageSection>

        <ProfileInfo>
          <Nickname>{userData.nickname}</Nickname>
          <Bio>{userData.bio || `안녕하세요! ${userData.nickname}입니다.`}</Bio>
        </ProfileInfo>

        <ActionButtons>
          <ActionButton onClick={handleMessageClick}>
            <FiMessageCircle size={20} />
            <span>메시지</span>
          </ActionButton>
        </ActionButtons>

        {userData.interests && userData.interests.length > 0 && (
          <InterestsSection>
            <SectionTitle>관심사</SectionTitle>
            <InterestsList>
              {Array.isArray(userData.interests) 
                ? userData.interests.map((interest, index) => (
                    <InterestItem key={index}>
                      <InterestName>{interest}</InterestName>
                    </InterestItem>
                  ))
                : <InterestItem>
                    <InterestName>관심사 없음</InterestName>
                  </InterestItem>
              }
            </InterestsList>
          </InterestsSection>
        )}

        <ProfileDetails>
          <DetailItem>
            <DetailLabel>성별</DetailLabel>
            <DetailValue>{getGenderLabel(userData.gender)}</DetailValue>
          </DetailItem>
          {getLocationLabel(userData.location) && (
            <DetailItem>
              <DetailLabel>내 동네</DetailLabel>
              <DetailValue>{getLocationLabel(userData.location)}</DetailValue>
            </DetailItem>
          )}
          <DetailItem>
            <DetailLabel>이메일</DetailLabel>
            <DetailValue>{userData.email}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>가입일</DetailLabel>
            <DetailValue>{new Date(userData.created_at).toLocaleDateString()}</DetailValue>
          </DetailItem>
        </ProfileDetails>
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

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background-color: var(--accent-blue);
  color: var(--primary-blue);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    color: var(--primary-blue);
  }

  &:hover {
    background-color: var(--primary-light-blue);
  }
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
  gap: 8px;
`;

const InterestItem = styled.div`
  padding: 8px 16px;
  background-color: var(--accent-blue);
  border-radius: 20px;
  transition: all 0.2s ease;
`;

const InterestName = styled.span`
  font-size: 14px;
  color: var(--primary-blue);
  font-weight: 500;
`;

const ProfileDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 14px;
  color: var(--text-light);
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const LoadingText = styled.div`
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 500;
`;


export default UserProfile;