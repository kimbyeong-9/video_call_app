import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import LogoImage from '../../assets/images/logo/travo_logo.png';

const Header = () => {
  const navigate = useNavigate();

  return (
    <HeaderWrapper>
      <ProfileSection onClick={() => navigate('/profiles')}>
        <ProfileImage 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=felix" 
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
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #2B579A;
  padding: 2px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  
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