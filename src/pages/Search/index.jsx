import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { friendsData } from '../../data/FriendsData';

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecommendOpen, setIsRecommendOpen] = useState(true);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    const filteredUsers = friendsData.filter(user =>
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filteredUsers);
  };

  return (
    <SearchWrapper>
      <SearchForm onSubmit={handleSearch}>
        <SearchInput
          type="text"
          placeholder="닉네임으로 검색하기"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchButton type="submit">
          <FiSearch size={20} />
        </SearchButton>
      </SearchForm>

      <RecommendSection>
        <RecommendHeader onClick={() => setIsRecommendOpen(!isRecommendOpen)}>
          <h3>추천 유저</h3>
          {isRecommendOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
        </RecommendHeader>
        
        {isRecommendOpen && (
          <RecommendContent>
            {friendsData.slice(0, 5).map(user => (
              <FriendItem key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                <ProfileSection>
                  <ProfileImage src={user.profileImage} alt={user.nickname} />
                  {user.isOnline && <OnlineIndicator />}
                </ProfileSection>
                
                <FriendInfo>
                  <FriendHeader>
                    <Nickname>{user.nickname}</Nickname>
                    <Age>{user.age}세</Age>
                  </FriendHeader>
                  
                  <Details>
                    <DetailItem>
                      <DetailLabel>성별</DetailLabel>
                      <DetailValue>{user.gender}</DetailValue>
                    </DetailItem>
                    
                    <DetailItem>
                      <DetailLabel>국가</DetailLabel>
                      <DetailValue>{user.country}</DetailValue>
                    </DetailItem>
                  </Details>
                  
                  <Interests>
                    <InterestLabel>관심사</InterestLabel>
                    <InterestTags>
                      {user.interests.map((interest, index) => (
                        <InterestTag key={index}>{interest}</InterestTag>
                      ))}
                    </InterestTags>
                  </Interests>
                </FriendInfo>
              </FriendItem>
            ))}
          </RecommendContent>
        )}
      </RecommendSection>

      {searchTerm && (
        <SearchResults>
          <h3>검색 결과</h3>
          {searchResults.map(user => (
            <FriendItem key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
              <ProfileSection>
                <ProfileImage src={user.profileImage} alt={user.nickname} />
                {user.isOnline && <OnlineIndicator />}
              </ProfileSection>
              
              <FriendInfo>
                <FriendHeader>
                  <Nickname>{user.nickname}</Nickname>
                  <Age>{user.age}세</Age>
                </FriendHeader>
                
                <Details>
                  <DetailItem>
                    <DetailLabel>성별</DetailLabel>
                    <DetailValue>{user.gender}</DetailValue>
                  </DetailItem>
                  
                  <DetailItem>
                    <DetailLabel>국가</DetailLabel>
                    <DetailValue>{user.country}</DetailValue>
                  </DetailItem>
                </Details>
                
                <Interests>
                  <InterestLabel>관심사</InterestLabel>
                  <InterestTags>
                    {user.interests.map((interest, index) => (
                      <InterestTag key={index}>{interest}</InterestTag>
                    ))}
                  </InterestTags>
                </Interests>
              </FriendInfo>
            </FriendItem>
          ))}
        </SearchResults>
      )}
    </SearchWrapper>
  );
};

const SearchWrapper = styled.div`
  padding: 20px 16px;
  padding-bottom: 70px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--primary-light-blue);
  border-radius: 8px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const SearchButton = styled.button`
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: var(--primary-dark-blue);
  }
`;

const RecommendSection = styled.div`
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
`;

const RecommendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
`;

const RecommendContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const SearchResults = styled.div`
  margin-top: 20px;
  
  h3 {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
`;

const FriendItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
`;

const ProfileSection = styled.div`
  position: relative;
  margin-right: 16px;
`;

const ProfileImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  object-fit: cover;
  border: 2px solid var(--primary-light-blue);
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4CAF50;
  border: 2px solid #ffffff;
  border-radius: 50%;
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const Nickname = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const Age = styled.span`
  font-size: 12px;
  color: var(--primary-blue);
  background-color: var(--primary-light-blue);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
`;

const Details = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DetailLabel = styled.span`
  font-size: 12px;
  color: var(--text-light);
`;

const DetailValue = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
`;

const Interests = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
`;

const InterestLabel = styled.span`
  font-size: 12px;
  color: var(--text-light);
  margin-right: 4px;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const InterestTag = styled.span`
  font-size: 11px;
  color: var(--primary-blue);
  background-color: var(--accent-blue);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
`;

export default Search;
