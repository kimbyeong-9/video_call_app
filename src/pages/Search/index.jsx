import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { supabase } from '../../utils/supabase';
import { friendsData } from '../../data/FriendsData';

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecommendOpen, setIsRecommendOpen] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadRecommendedUsers();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error('❌ Search - 현재 사용자 조회 오류:', error);
    }
  };

  const loadRecommendedUsers = async () => {
    try {
      console.log('🔵 Search - 추천 사용자 로드 시작');

      // Supabase에서 최근 가입한 사용자들을 추천으로 표시 (자기 자신 제외)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, nickname, email, bio, profile_image, created_at')
        .neq('id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('🔵 Search - 추천 사용자 조회 결과:', { users, error });

      if (error) {
        console.error('❌ Search - 추천 사용자 조회 오류:', error);
        // 오류 시 하드코딩된 데이터 사용 (자기 자신 제외)
        const filteredData = friendsData.filter(user => user.id !== currentUserId).slice(0, 5);
        setRecommendedUsers(filteredData);
        return;
      }

      if (users && users.length > 0) {
        setRecommendedUsers(users);
      } else {
        // 데이터가 없으면 하드코딩된 데이터 사용 (자기 자신 제외)
        const filteredData = friendsData.filter(user => user.id !== currentUserId).slice(0, 5);
        setRecommendedUsers(filteredData);
      }
    } catch (error) {
      console.error('❌ Search - 추천 사용자 로드 오류:', error);
      // 오류 시 하드코딩된 데이터 사용 (자기 자신 제외)
      const filteredData = friendsData.filter(user => user.id !== currentUserId).slice(0, 5);
      setRecommendedUsers(filteredData);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 Search - 사용자 검색 시작:', searchTerm);

      // Supabase에서 사용자 검색 (닉네임 또는 이메일로 검색, 자기 자신 제외)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, nickname, email, bio, profile_image, created_at')
        .or(`nickname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .neq('id', currentUserId)
        .limit(20);

      console.log('🔵 Search - 검색 결과:', { users, error });

      if (error) {
        console.error('❌ Search - 검색 오류:', error);
        // 오류 시 하드코딩된 데이터에서 검색 (자기 자신 제외)
        const filteredUsers = friendsData.filter(user =>
          user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) &&
          user.id !== currentUserId
        );
        setSearchResults(filteredUsers);
        return;
      }

      setSearchResults(users || []);
    } catch (error) {
      console.error('❌ Search - 검색 중 오류:', error);
      // 오류 시 하드코딩된 데이터에서 검색 (자기 자신 제외)
      const filteredUsers = friendsData.filter(user =>
        user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) &&
        user.id !== currentUserId
      );
      setSearchResults(filteredUsers);
    } finally {
      setLoading(false);
    }
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
            {recommendedUsers.map(user => (
              <FriendItem key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                <ProfileSection>
                  <ProfileImage 
                    src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                    alt={user.nickname} 
                  />
                  <OnlineIndicator />
                </ProfileSection>
                
                <FriendInfo>
                  <FriendHeader>
                    <Nickname>{user.nickname}</Nickname>
                    <Age>{user.email}</Age>
                  </FriendHeader>
                  
                  <Details>
                    <DetailItem>
                      <DetailLabel>가입일</DetailLabel>
                      <DetailValue>{new Date(user.created_at).toLocaleDateString()}</DetailValue>
                    </DetailItem>
                    
                    <DetailItem>
                      <DetailLabel>이메일</DetailLabel>
                      <DetailValue>{user.email}</DetailValue>
                    </DetailItem>
                  </Details>
                  
                  {user.bio && (
                    <Bio>{user.bio}</Bio>
                  )}
                  
                  {user.interests && user.interests.length > 0 && (
                    <Interests>
                      <InterestLabel>관심사</InterestLabel>
                      <InterestTags>
                        {Array.isArray(user.interests) 
                          ? user.interests.map((interest, index) => (
                              <InterestTag key={index}>{interest}</InterestTag>
                            ))
                          : <InterestTag>관심사 없음</InterestTag>
                        }
                      </InterestTags>
                    </Interests>
                  )}
                </FriendInfo>
              </FriendItem>
            ))}
          </RecommendContent>
        )}
      </RecommendSection>

      {searchTerm && (
        <SearchResults>
          <h3>검색 결과 {loading && '(검색 중...)'}</h3>
          {loading ? (
            <LoadingMessage>검색 중...</LoadingMessage>
          ) : searchResults.length > 0 ? (
            searchResults.map(user => (
              <FriendItem key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                <ProfileSection>
                  <ProfileImage 
                    src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                    alt={user.nickname} 
                  />
                  <OnlineIndicator />
                </ProfileSection>
                
                <FriendInfo>
                  <FriendHeader>
                    <Nickname>{user.nickname}</Nickname>
                    <Age>{user.email}</Age>
                  </FriendHeader>
                  
                  <Details>
                    <DetailItem>
                      <DetailLabel>가입일</DetailLabel>
                      <DetailValue>{new Date(user.created_at).toLocaleDateString()}</DetailValue>
                    </DetailItem>
                    
                    <DetailItem>
                      <DetailLabel>이메일</DetailLabel>
                      <DetailValue>{user.email}</DetailValue>
                    </DetailItem>
                  </Details>
                  
                  {user.bio && (
                    <Bio>{user.bio}</Bio>
                  )}
                  
                  {user.interests && user.interests.length > 0 && (
                    <Interests>
                      <InterestLabel>관심사</InterestLabel>
                      <InterestTags>
                        {Array.isArray(user.interests) 
                          ? user.interests.map((interest, index) => (
                              <InterestTag key={index}>{interest}</InterestTag>
                            ))
                          : <InterestTag>관심사 없음</InterestTag>
                        }
                      </InterestTags>
                    </Interests>
                  )}
                </FriendInfo>
              </FriendItem>
            ))
          ) : (
            <NoResultsMessage>검색 결과가 없습니다.</NoResultsMessage>
          )}
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 16px;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 16px;
`;

const Bio = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
  margin: 8px 0;
`;

export default Search;
