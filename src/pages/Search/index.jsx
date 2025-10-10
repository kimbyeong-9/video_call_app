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
              <UserCard key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                <ProfileSection>
                  <ProfileImage 
                    src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                    alt={user.nickname} 
                  />
                  <OnlineIndicator />
                </ProfileSection>
                
                <UserInfo>
                  <UserHeader>
                    <Nickname>{user.nickname}</Nickname>
                    <JoinDate>{new Date(user.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 가입</JoinDate>
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
              <UserCard key={user.id} onClick={() => navigate(`/profiles/${user.id}`)}>
                <ProfileSection>
                  <ProfileImage 
                    src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                    alt={user.nickname} 
                  />
                  <OnlineIndicator />
                </ProfileSection>
                
                <UserInfo>
                  <UserHeader>
                    <Nickname>{user.nickname}</Nickname>
                    <JoinDate>{new Date(user.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 가입</JoinDate>
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
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
`;

const RecommendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
`;

const RecommendContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const SearchResults = styled.div`
  margin-top: 24px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  
  h3 {
    margin: 0;
    padding: 16px 20px;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    background-color: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ProfileSection = styled.div`
  position: relative;
  margin-right: 16px;
`;

const ProfileImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  object-fit: cover;
  border: 3px solid #e3f2fd;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background-color: #4CAF50;
  border: 3px solid #ffffff;
  border-radius: 50%;
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

const Nickname = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const JoinDate = styled.span`
  font-size: 12px;
  color: #888;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 12px;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const InterestTag = styled.span`
  font-size: 12px;
  color: #1976d2;
  background-color: #e3f2fd;
  padding: 4px 10px;
  border-radius: 16px;
  font-weight: 500;
  border: 1px solid #bbdefb;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 16px;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 16px;
`;

const Bio = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin: 6px 0 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export default Search;
