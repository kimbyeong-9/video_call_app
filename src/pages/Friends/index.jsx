import React from 'react';
import styled from 'styled-components';
import { friendsData } from '../../data/FriendsData';

const Friends = () => {
  return (
    <FriendsWrapper>
      <CategoryTitle>친구</CategoryTitle>
      <FriendsList>
        {friendsData.map((friend) => (
          <FriendItem key={friend.id}>
            <ProfileSection>
              <ProfileImage src={friend.profileImage} alt={friend.nickname} />
              {friend.isOnline && <OnlineIndicator />}
            </ProfileSection>
            
            <FriendInfo>
              <FriendHeader>
                <Nickname>{friend.nickname}</Nickname>
                <Age>{friend.age}세</Age>
              </FriendHeader>
              
              <Details>
                <DetailItem>
                  <DetailLabel>성별</DetailLabel>
                  <DetailValue>{friend.gender}</DetailValue>
                </DetailItem>
                
                <DetailItem>
                  <DetailLabel>국가</DetailLabel>
                  <DetailValue>{friend.country}</DetailValue>
                </DetailItem>
              </Details>
              
              <Interests>
                <InterestLabel>관심사</InterestLabel>
                <InterestTags>
                  {friend.interests.map((interest, index) => (
                    <InterestTag key={index}>{interest}</InterestTag>
                  ))}
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
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(43, 87, 154, 0.15);
    border: 1px solid var(--primary-light-blue);
  }
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

const Age = styled.span`
  font-size: 14px;
  color: var(--primary-blue);
  background-color: var(--primary-light-blue);
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
`;

const Details = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailLabel = styled.span`
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
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

export default Friends;