import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { myProfileData } from '../../data/MyProfileData';

const Mypage = () => {
  const navigate = useNavigate();

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
          <ProfileImage src={myProfileData.profileImage} alt="프로필" />
          <OnlineIndicator />
        </ProfileImageSection>

        <ProfileInfo>
          <Nickname>{myProfileData.nickname}</Nickname>
          <Bio>{myProfileData.bio}</Bio>
        </ProfileInfo>

        <InterestsSection>
          <SectionTitle>관심사</SectionTitle>
          <InterestsList>
            {myProfileData.interests.map((interest) => (
              <InterestItem key={interest.id}>
                <InterestIcon>{interest.icon}</InterestIcon>
                <InterestName>{interest.name}</InterestName>
              </InterestItem>
            ))}
          </InterestsList>
        </InterestsSection>

        <SettingsSection>
          <SettingButton onClick={() => navigate('/settings')}>
            <SettingIcon>⚙️</SettingIcon>
            <span>설정</span>
          </SettingButton>
        </SettingsSection>

        <ProfileDetails>
          <DetailItem>
            <DetailLabel>이메일</DetailLabel>
            <DetailValue>{myProfileData.email}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>위치</DetailLabel>
            <DetailValue>{myProfileData.location}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>가입일</DetailLabel>
            <DetailValue>{myProfileData.joinDate}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>언어</DetailLabel>
            <DetailValue>{myProfileData.language}</DetailValue>
          </DetailItem>
        </ProfileDetails>
      </ProfileContent>
    </ProfileWrapper>
  );
};

const ProfileWrapper = styled.div`
  padding: 20px 16px;
  padding-bottom: 70px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

const InterestIcon = styled.span`
  font-size: 18px;
`;

const InterestName = styled.span`
  font-size: 14px;
  color: var(--primary-blue);
  font-weight: 500;
`;

const SettingsSection = styled.div`
  margin-bottom: 24px;
  border-top: 1px solid var(--primary-light-blue);
  padding-top: 24px;
`;

const SettingButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: var(--accent-blue);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--primary-blue);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-light-blue);
  }
`;

const SettingIcon = styled.span`
  font-size: 20px;
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

export default Mypage;