import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiSettings, FiLogOut, FiFileText, FiShield } from 'react-icons/fi';
import LogoImage from '../../assets/images/logo/travo_logo.png';
import MenuIcon from '../../assets/images/list_14052418.png';
import { supabase } from '../../utils/supabase';
import NotificationPopup from './NotificationPopup';

const Header = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
    
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          setUserProfile(profileData);
        } else {
          // fallback to auth user data
          setUserProfile({
            id: session.user.id,
            nickname: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '사용자',
            profile_image: session.user.user_metadata?.avatar_url || null
          });
        }
      }
    } catch (error) {
      console.error('Header 사용자 프로필 로드 오류:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔵 Header - 로그아웃 시작');
      
      // Supabase Auth 로그아웃
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Header - 로그아웃 오류:', error);
        return;
      }
      
      // localStorage 정리
      localStorage.removeItem('currentUser');
      console.log('✅ Header - 로그아웃 완료, 로그인 페이지로 이동');
      
      // 로그인 페이지로 이동
      navigate('/login');
      
    } catch (error) {
      console.error('❌ Header - 로그아웃 예외:', error);
      // 오류가 발생해도 강제로 로그인 페이지로 이동
      localStorage.removeItem('currentUser');
      navigate('/login');
    }
  };

  return (
    <HeaderWrapper>
      <LogoSection onClick={() => navigate('/')}>
        <Logo src={LogoImage} alt="Travo" />
      </LogoSection>

      <IconSection>
        <NotificationWrapper ref={notificationRef}>
          <IconButton onClick={() => setShowNotifications(!showNotifications)}>
            <NotificationIcon>
              <FiBell size={20} />
            </NotificationIcon>
            <NotificationBadge />
          </IconButton>
          {showNotifications && (
            <NotificationPopup onClose={() => setShowNotifications(false)} />
          )}
        </NotificationWrapper>
        <SettingsWrapper ref={settingsRef}>
          <IconButton onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
            <SettingsIcon>
              <MenuImage src={MenuIcon} alt="메뉴" />
            </SettingsIcon>
          </IconButton>
          {showSettingsMenu && (
            <SettingsMenu>
              <SettingsMenuItem onClick={() => {
                setShowSettingsMenu(false);
                navigate('/settings');
              }}>
                <SettingsIcon>
                  <FiSettings size={16} />
                </SettingsIcon>
                <SettingsText>기본 설정</SettingsText>
              </SettingsMenuItem>
              <SettingsMenuItem onClick={() => {
                setShowSettingsMenu(false);
                navigate('/terms');
              }}>
                <SettingsIcon>
                  <FiShield size={16} />
                </SettingsIcon>
                <SettingsText>이용정책</SettingsText>
              </SettingsMenuItem>
              <SettingsDivider />
              <SettingsMenuItem onClick={() => {
                setShowSettingsMenu(false);
                handleLogout();
              }}>
                <SettingsIcon>
                  <FiLogOut size={16} />
                </SettingsIcon>
                <SettingsText>로그아웃</SettingsText>
              </SettingsMenuItem>
            </SettingsMenu>
          )}
        </SettingsWrapper>
      </IconSection>
    </HeaderWrapper>
  );
};

const HeaderWrapper = styled.header`
  width: 100%;
  padding: 20px 16px;
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LogoSection = styled.div`
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

const NotificationWrapper = styled.div`
  position: relative;
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

const MenuImage = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
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

const SettingsWrapper = styled.div`
  position: relative;
`;

const SettingsMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
`;

const SettingsMenuItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: var(--text-primary);

  &:hover {
    background-color: #f8fafc;
  }

  &:active {
    background-color: #e2e8f0;
  }
`;

const SettingsText = styled.span`
  font-weight: 500;
`;

const SettingsDivider = styled.div`
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
`;

export default Header;