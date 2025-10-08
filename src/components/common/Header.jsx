import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import LogoImage from '../../assets/images/logo/travo_logo.png';
import { myProfileData } from '../../data/MyProfileData';

const Header = () => {
  const navigate = useNavigate();

  return (
    <HeaderWrapper>
      <ProfileSection onClick={() => navigate('/profiles/me')}>
        <ProfileImage 
          src={myProfileData.profileImage}
          alt="profile" 
        />
      </ProfileSection>

      <LogoSection onClick={() => navigate('/')}>
        <Logo src={LogoImage} alt="Travo" />
      </LogoSection>

      <IconSection>
        <IconButton>
          <NotificationIcon>
            🔔
          </NotificationIcon>
          <NotificationBadge />
        </IconButton>
        <IconButton>
          <SettingsIcon>
            ⚙️
          </SettingsIcon>
        </IconButton>
      </IconSection>
    </HeaderWrapper>
  );
};

const HeaderWrapper = styled.header`
  width: 100%;
  height: 60px;
  padding: 0 16px;
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const ProfileSection = styled.div`
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-blue);
  padding: 2px;
  box-shadow: 0 2px 4px rgba(43, 87, 154, 0.1);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--primary-dark-blue);
    box-shadow: 0 2px 8px rgba(43, 87, 154, 0.2);
  }
`;

const LogoSection = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
`;

const Logo = styled.img`
  height: 30px;
  width: auto;
`;

const IconSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  position: relative;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.8;
  }
`;

const NotificationIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SettingsIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: #FF3B30;
  border-radius: 50%;
`;

export default Header;