import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiX } from 'react-icons/fi';
import { myProfileData } from '../../data/MyProfileData';
import InterestModal from '../../components/common/InterestModal';

const AVAILABLE_INTERESTS = [
  { id: 1, name: '언어교환' },
  { id: 2, name: '당일치기' },
  { id: 3, name: '고민상담' },
  { id: 4, name: '공부' },
  { id: 5, name: '친목' },
  { id: 6, name: '해외여행' },
  { id: 7, name: '국내여행' },
  { id: 8, name: '동남아' },
  { id: 9, name: '아시아' },
  { id: 10, name: '미국' },
  { id: 11, name: '일본' },
  { id: 12, name: '중국' },
];

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    profileImage: myProfileData.profileImage,
    nickname: myProfileData.nickname,
    bio: myProfileData.bio || '',
    interests: myProfileData.interests || [],
  });

  const [previewImage, setPreviewImage] = useState(myProfileData.profileImage);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [nextCustomId, setNextCustomId] = useState(100); // 커스텀 관심사의 시작 ID

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestSelect = (interest) => {
    const exists = formData.interests.some(i => i.id === interest.id);
    if (!exists && formData.interests.length < 5) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const handleCustomInterestAdd = (e) => {
    e.preventDefault();
    if (customInterest.trim() && formData.interests.length < 5) {
      const newInterest = {
        id: nextCustomId,
        name: customInterest.trim(),
      };
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }));
      setNextCustomId(prev => prev + 1);
      setCustomInterest('');
    }
  };

  const handleInterestRemove = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i.id !== interestId)
    }));
  };

  const handleInterestModalOpen = () => {
    setShowInterestModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 프로필 업데이트 API 호출
    console.log('Updated Profile:', formData);
    navigate('/profiles/me');
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
            <Label>관심사 (최대 5개)</Label>
            <InterestsWrapper>
              {formData.interests.map((interest) => (
                <InterestTag key={interest.id}>
                  {interest.icon} {interest.name}
                  <RemoveButton onClick={() => handleInterestRemove(interest.id)}>
                    <FiX size={14} />
                  </RemoveButton>
                </InterestTag>
              ))}
              {formData.interests.length < 5 && (
                <AddInterestButton onClick={handleInterestModalOpen}>
                  + 관심사 추가
                </AddInterestButton>
              )}
            </InterestsWrapper>
          </InputGroup>
        </InputSection>
      </EditForm>

      <InterestModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        interests={AVAILABLE_INTERESTS}
        selectedInterests={formData.interests}
        onInterestSelect={handleInterestSelect}
        customInterest={customInterest}
        onCustomInterestChange={(e) => setCustomInterest(e.target.value)}
        onCustomInterestAdd={handleCustomInterestAdd}
      />
    </EditProfileWrapper>
  );
};

const EditProfileWrapper = styled.div`
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
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-input);

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-input);
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const InterestsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const InterestTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--accent-blue);
  border-radius: 20px;
  font-size: 14px;
  color: var(--primary-blue);
  font-weight: 500;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  padding: 2px;
  margin-left: 4px;

  &:hover {
    color: var(--primary-dark-blue);
  }
`;

const AddInterestButton = styled.button`
  padding: 6px 12px;
  background-color: var(--bg-input);
  border: 1px dashed var(--border-color);
  border-radius: 20px;
  color: var(--text-light);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-blue);
    color: var(--primary-blue);
  }
`;


export default EditProfile;
