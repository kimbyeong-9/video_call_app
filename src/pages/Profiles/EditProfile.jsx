import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiX } from 'react-icons/fi';
import { profile, supabase } from '../../utils/supabase';
import NotificationPopup from '../../components/common/NotificationPopup';

// 관심사 키워드 목록
const INTEREST_KEYWORDS = [
  // 여행
  { id: 1, name: '해외여행', category: 'travel' },
  { id: 2, name: '국내여행', category: 'travel' },
  { id: 3, name: '배낭여행', category: 'travel' },
  { id: 4, name: '유럽여행', category: 'travel' },
  { id: 5, name: '아시아여행', category: 'travel' },
  { id: 6, name: '미국여행', category: 'travel' },
  { id: 7, name: '일본여행', category: 'travel' },
  { id: 8, name: '동남아여행', category: 'travel' },
  { id: 9, name: '당일치기', category: 'travel' },
  
  // 친목
  { id: 10, name: '친목', category: 'social' },
  { id: 11, name: '맛집탐방', category: 'social' },
  { id: 12, name: '카페투어', category: 'social' },
  { id: 13, name: '술친구', category: 'social' },
  { id: 14, name: '영화감상', category: 'social' },
  
  // 언어교환
  { id: 15, name: '언어교환', category: 'language' },
  { id: 16, name: '영어회화', category: 'language' },
  { id: 17, name: '일본어', category: 'language' },
  { id: 18, name: '중국어', category: 'language' },
  { id: 19, name: '스페인어', category: 'language' },
  
  // 취미/활동
  { id: 20, name: '운동', category: 'hobby' },
  { id: 21, name: '등산', category: 'hobby' },
  { id: 22, name: '요리', category: 'hobby' },
  { id: 23, name: '독서', category: 'hobby' },
  { id: 24, name: '음악', category: 'hobby' },
  { id: 25, name: '사진', category: 'hobby' },
  { id: 26, name: '게임', category: 'hobby' },
  
  // 학습/성장
  { id: 27, name: '공부', category: 'study' },
  { id: 28, name: '자기계발', category: 'study' },
  { id: 29, name: '독서모임', category: 'study' },
  { id: 30, name: '스터디', category: 'study' },
  
  // 기타
  { id: 31, name: '고민상담', category: 'etc' },
  { id: 32, name: '반려동물', category: 'etc' },
  { id: 33, name: '패션', category: 'etc' },
  { id: 34, name: '뷰티', category: 'etc' },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    profileImage: '',
    nickname: '',
    bio: '',
    interests: [], // 관심사 배열
  });

  const [previewImage, setPreviewImage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInterest, setCustomInterest] = useState('');

  // 현재 사용자 정보 불러오기
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // localStorage에서 사용자 정보 가져오기
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      // Supabase에서 최신 프로필 정보 가져오기
      const { data, error } = await profile.getProfile(user.id);
      
      if (error) {
        console.error('프로필 불러오기 오류:', error);
        return;
      }

      if (data) {
        setFormData({
          profileImage: data.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nickname || 'user'}`,
          nickname: data.nickname || '',
          bio: data.bio || '',
          interests: data.interests || [],
        });
        setPreviewImage(data.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nickname || 'user'}`);
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          show: true,
          message: '이미지 크기는 5MB 이하여야 합니다.',
          type: 'error'
        });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
        return;
      }

      // 미리보기 표시
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // 업로드할 파일 저장
      setUploadedFile(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 관심사 키워드 토글
  const handleToggleInterest = (keyword) => {
    // "기타" 버튼 클릭 시
    if (keyword === '기타') {
      setShowCustomInput(true);
      return;
    }

    const isSelected = formData.interests.includes(keyword);
    
    if (isSelected) {
      // 이미 선택된 경우 제거
      setFormData(prev => ({
        ...prev,
        interests: prev.interests.filter(item => item !== keyword)
      }));
    } else {
      // 선택되지 않은 경우 추가 (최대 5개)
      if (formData.interests.length >= 5) {
        setNotification({
          show: true,
          message: '관심사는 최대 5개까지 선택할 수 있습니다.',
          type: 'error'
        });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, keyword]
      }));
    }
  };

  // 커스텀 관심사 추가
  const handleAddCustomInterest = () => {
    if (!customInterest.trim()) {
      setNotification({
        show: true,
        message: '관심사를 입력해주세요.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    if (formData.interests.length >= 5) {
      setNotification({
        show: true,
        message: '관심사는 최대 5개까지 선택할 수 있습니다.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, customInterest.trim()]
    }));
    setCustomInterest('');
    setShowCustomInput(false);
  };

  // Enter 키로 커스텀 관심사 추가
  const handleCustomKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomInterest();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔵 프로필 저장 시작');
    
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    // 닉네임 유효성 검사
    if (!formData.nickname.trim()) {
      setNotification({
        show: true,
        message: '닉네임을 입력해주세요.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    setLoading(true);

    try {
      let profileImageUrl = formData.profileImage;

      // 새 이미지가 업로드된 경우에만 업로드 시도
      if (uploadedFile) {
        console.log('🔵 새 이미지 업로드 시작...');
        const { data: imageUrl, error: uploadError } = await profile.uploadProfileImage(
          currentUser.id,
          uploadedFile
        );

        if (uploadError) {
          console.error('❌ 이미지 업로드 실패:', uploadError);
          // 이미지 업로드 실패해도 계속 진행 (프로필 정보는 저장)
          setNotification({
            show: true,
            message: '이미지 업로드에 실패했지만 다른 정보는 저장됩니다.',
            type: 'error'
          });
          setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
        } else {
          profileImageUrl = imageUrl;
          console.log('✅ 이미지 업로드 완료:', imageUrl);
        }
      } else {
        console.log('🔵 이미지 변경 없음, 기존 이미지 유지');
      }

      // 현재 Auth 사용자 확인
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔵 현재 Auth 사용자:', authUser?.id);
      console.log('🔵 localStorage 사용자:', currentUser.id);
      
      // 프로필 업데이트
      console.log('🔵 프로필 업데이트 시작...', {
        userId: currentUser.id,
        nickname: formData.nickname,
        bio: formData.bio,
        interests: formData.interests,
        profile_image: profileImageUrl
      });

      const { data, error } = await profile.updateProfile(currentUser.id, {
        nickname: formData.nickname,
        bio: formData.bio,
        interests: formData.interests,
        profile_image: profileImageUrl
      });

      if (error) {
        console.error('❌ 프로필 업데이트 실패:', error);
        throw error;
      }

      console.log('✅ 프로필 업데이트 완료:', data);

      // 성공 알림
      setNotification({
        show: true,
        message: '프로필이 성공적으로 업데이트되었습니다!',
        type: 'success'
      });

      // 2초 후 마이페이지로 이동
      setTimeout(() => {
        navigate('/profiles/me');
      }, 2000);

    } catch (error) {
      console.error('❌ 프로필 저장 오류:', error);
      setNotification({
        show: true,
        message: error.message || '프로필 업데이트에 실패했습니다.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setLoading(false);
      console.log('🔵 프로필 저장 프로세스 종료');
    }
  };

  return (
    <EditProfileWrapper>
      <Header>
        <HeaderTitle>프로필 편집</HeaderTitle>
        <SaveButton onClick={handleSubmit}>저장</SaveButton>
      </Header>

      <EditForm>
        <ImageSection>
          <ImageWrapper onClick={handleImageClick}>
            <ProfileImage src={previewImage} alt="프로필" />
            <ImageOverlay>
              <FiCamera size={24} />
            </ImageOverlay>
          </ImageWrapper>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </ImageSection>

        <InputSection>
          <InputGroup>
            <Label>닉네임</Label>
            <Input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
          </InputGroup>

          <InputGroup>
            <Label>한줄소개</Label>
            <TextArea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="자신을 소개해주세요"
              maxLength={100}
            />
          </InputGroup>

          <InputGroup>
            <LabelWrapper>
              <Label>관심사 키워드 선택 (최대 5개)</Label>
              <SelectedCount isMax={formData.interests.length >= 5}>
                {formData.interests.length} / 5
              </SelectedCount>
            </LabelWrapper>
            
            <KeywordGrid>
              {INTEREST_KEYWORDS.map((keyword) => (
                <KeywordButton
                  key={keyword.id}
                  type="button"
                  isSelected={formData.interests.includes(keyword.name)}
                  onClick={() => handleToggleInterest(keyword.name)}
                  disabled={!formData.interests.includes(keyword.name) && formData.interests.length >= 5}
                >
                  {keyword.name}
                </KeywordButton>
              ))}
              
              {/* 기타 버튼 */}
              <KeywordButton
                type="button"
                isCustom={true}
                onClick={() => handleToggleInterest('기타')}
                disabled={formData.interests.length >= 5}
              >
                + 기타
              </KeywordButton>
            </KeywordGrid>
            
            {/* 커스텀 입력창 */}
            {showCustomInput && (
              <CustomInputWrapper>
                <CustomInputBox>
                  <CustomInputLabel>직접 입력</CustomInputLabel>
                  <CustomInputGroup>
                    <CustomInput
                      type="text"
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyPress={handleCustomKeyPress}
                      placeholder="관심사를 입력하세요 (최대 20자)"
                      maxLength={20}
                      autoFocus
                    />
                    <CustomButtonGroup>
                      <CustomAddButton onClick={handleAddCustomInterest}>
                        추가
                      </CustomAddButton>
                      <CustomCancelButton onClick={() => {
                        setShowCustomInput(false);
                        setCustomInterest('');
                      }}>
                        취소
                      </CustomCancelButton>
                    </CustomButtonGroup>
                  </CustomInputGroup>
                </CustomInputBox>
              </CustomInputWrapper>
            )}
            
            {formData.interests.length > 0 && (
              <>
                <SelectedLabel>선택된 관심사:</SelectedLabel>
                <SelectedInterestList>
                  {formData.interests.map((interest, index) => (
                    <SelectedInterestTag key={index}>
                      {interest}
                      <RemoveButton onClick={() => handleToggleInterest(interest)}>
                        <FiX size={14} />
                      </RemoveButton>
                    </SelectedInterestTag>
                  ))}
                </SelectedInterestList>
              </>
            )}
          </InputGroup>
        </InputSection>
      </EditForm>

      {notification.show && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: 'success' })}
        />
      )}

      {loading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>프로필 업데이트 중...</LoadingText>
        </LoadingOverlay>
      )}
    </EditProfileWrapper>
  );
};

const EditProfileWrapper = styled.div`
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

const SaveButton = styled.button`
  padding: 8px 20px;
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

const EditForm = styled.form`
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(43, 87, 154, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const ImageSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  cursor: pointer;

  &:hover > div {
    opacity: 1;
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 60px;
  object-fit: cover;
  border: 3px solid var(--primary-light-blue);
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid var(--primary-light-blue);
  border-radius: 12px;
  font-size: 16px;
  color: var(--text-primary);
  background: white;
  box-shadow: 0 2px 8px rgba(43, 87, 154, 0.1);
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
    box-shadow: 0 4px 12px rgba(43, 87, 154, 0.2);
  }

  &::placeholder {
    color: var(--text-light);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid var(--primary-light-blue);
  border-radius: 12px;
  font-size: 16px;
  color: var(--text-primary);
  background: white;
  min-height: 100px;
  resize: vertical;
  box-shadow: 0 2px 8px rgba(43, 87, 154, 0.1);
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
    box-shadow: 0 4px 12px rgba(43, 87, 154, 0.2);
  }

  &::placeholder {
    color: var(--text-light);
  }
`;

const LabelWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SelectedCount = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'isMax',
})`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.isMax ? '#ff4444' : 'var(--primary-blue)'};
`;

const KeywordGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
`;

const KeywordButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['isSelected', 'isCustom'].includes(prop),
})`
  padding: 10px 16px;
  background-color: ${props => {
    if (props.isCustom) return '#f0f0f0';
    return props.isSelected ? 'var(--primary-blue)' : 'var(--bg-input)';
  }};
  color: ${props => {
    if (props.isCustom) return '#666';
    return props.isSelected ? 'white' : 'var(--text-primary)';
  }};
  border: 1px solid ${props => {
    if (props.isCustom) return '#ddd';
    return props.isSelected ? 'var(--primary-blue)' : 'var(--border-color)';
  }};
  border-radius: 20px;
  font-size: 14px;
  font-weight: ${props => props.isSelected ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: ${props => {
      if (props.isCustom) return '#e0e0e0';
      return props.isSelected ? 'var(--primary-dark-blue)' : 'var(--accent-blue)';
    }};
    border-color: ${props => props.isCustom ? '#bbb' : 'var(--primary-blue)'};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const CustomInputWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const CustomInputBox = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const CustomInputLabel = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

const CustomInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CustomInput = styled.input`
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-input);
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const CustomButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const CustomAddButton = styled.button`
  flex: 1;
  padding: 12px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-dark-blue);
  }
`;

const CustomCancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const SelectedLabel = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const SelectedInterestList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background-color: var(--accent-blue);
  border-radius: 12px;
`;

const SelectedInterestTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--primary-blue);
  border-radius: 16px;
  font-size: 13px;
  color: white;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: white;
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
`;

export default EditProfile;
