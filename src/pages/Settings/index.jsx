import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiShield, FiMoon, FiSun, FiGlobe, FiHelpCircle, FiUser, FiLock, FiLogOut, FiUserX } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import NotificationPopup from '../../components/common/NotificationPopup';

const Settings = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  };

  const handleHelp = () => {
    // 도움말 버튼 클릭 시 아무 동작도 하지 않음
    console.log('🔵 도움말 버튼 클릭 (동작 없음)');
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) {
      return;
    }

    try {
      console.log('🔵 로그아웃 시작');
      
      // Supabase Auth 로그아웃
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ 로그아웃 오류:', error);
        setNotification({
          show: true,
          message: '로그아웃에 실패했습니다.',
          type: 'error'
        });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
        return;
      }
      
      // localStorage 정리
      localStorage.removeItem('currentUser');
      console.log('✅ 로그아웃 완료');
      
      // 로그인 페이지로 이동
      navigate('/login');
      
    } catch (error) {
      console.error('❌ 로그아웃 예외:', error);
      localStorage.removeItem('currentUser');
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 회원탈퇴 하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
      return;
    }

    if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      console.log('🔵 회원탈퇴 시작');
      setLoading(true);

      if (!currentUser) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 사용자 데이터 삭제 (users 테이블의 ON DELETE CASCADE로 관련 데이터도 자동 삭제)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUser.id);

      if (deleteError) {
        console.error('❌ 사용자 데이터 삭제 오류:', deleteError);
        throw deleteError;
      }

      // Supabase Auth 계정 삭제
      const { error: authError } = await supabase.auth.admin.deleteUser(currentUser.id);
      
      if (authError) {
        console.error('❌ Auth 계정 삭제 오류:', authError);
        // Auth 삭제 실패해도 계속 진행 (이미 users 테이블에서 삭제됨)
      }

      // localStorage 정리
      localStorage.removeItem('currentUser');
      
      console.log('✅ 회원탈퇴 완료');
      
      setNotification({
        show: true,
        message: '회원탈퇴가 완료되었습니다.',
        type: 'success'
      });

      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('❌ 회원탈퇴 오류:', error);
      setNotification({
        show: true,
        message: '회원탈퇴에 실패했습니다. 다시 시도해주세요.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsWrapper>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft size={24} />
        </BackButton>
        <Title>설정</Title>
        <HelpButton onClick={handleHelp}>
          <FiHelpCircle size={24} />
        </HelpButton>
      </Header>

      <Content>
        <SettingsSection>
          <SectionTitle>계정</SectionTitle>
          <SettingsItem onClick={() => navigate('/profiles/edit')}>
            <SettingsIcon>
              <FiUser size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>프로필 편집</SettingsLabel>
              <SettingsDescription>프로필 정보를 수정합니다</SettingsDescription>
            </SettingsInfo>
          </SettingsItem>
          
          <SettingsItem onClick={() => navigate('/password-change')}>
            <SettingsIcon>
              <FiLock size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>비밀번호 변경</SettingsLabel>
              <SettingsDescription>계정 비밀번호를 변경합니다</SettingsDescription>
            </SettingsInfo>
          </SettingsItem>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>알림</SectionTitle>
          <SettingsItem>
            <SettingsIcon>
              <FiBell size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>푸시 알림</SettingsLabel>
              <SettingsDescription>새 메시지 및 알림을 받습니다</SettingsDescription>
            </SettingsInfo>
            <ToggleSwitch>
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </ToggleSwitch>
          </SettingsItem>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>표시</SectionTitle>
          <SettingsItem>
            <SettingsIcon>
              <FiMoon size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>다크 모드</SettingsLabel>
              <SettingsDescription>어두운 테마로 표시합니다</SettingsDescription>
            </SettingsInfo>
            <ToggleSwitch>
              <input type="checkbox" />
              <span className="slider"></span>
            </ToggleSwitch>
          </SettingsItem>

          <SettingsItem>
            <SettingsIcon>
              <FiGlobe size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>언어</SettingsLabel>
              <SettingsDescription>한국어</SettingsDescription>
            </SettingsInfo>
          </SettingsItem>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>정보</SectionTitle>
          <SettingsItem onClick={() => navigate('/terms')}>
            <SettingsIcon>
              <FiShield size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>이용정책</SettingsLabel>
              <SettingsDescription>서비스 이용약관 및 개인정보처리방침</SettingsDescription>
            </SettingsInfo>
          </SettingsItem>

          <SettingsItem onClick={handleHelp}>
            <SettingsIcon>
              <FiHelpCircle size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>도움말</SettingsLabel>
              <SettingsDescription>자주 묻는 질문 및 고객지원</SettingsDescription>
            </SettingsInfo>
          </SettingsItem>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>계정 관리</SectionTitle>
          <AccountItem onClick={handleLogout}>
            <SettingsIcon>
              <FiLogOut size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>로그아웃</SettingsLabel>
              <SettingsDescription>현재 계정에서 로그아웃합니다</SettingsDescription>
            </SettingsInfo>
          </AccountItem>

          <DangerItem onClick={handleDeleteAccount}>
            <SettingsIcon>
              <FiUserX size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>회원탈퇴</SettingsLabel>
              <SettingsDescription>모든 데이터가 삭제되며 복구할 수 없습니다</SettingsDescription>
            </SettingsInfo>
          </DangerItem>
        </SettingsSection>
      </Content>

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
          <LoadingText>처리 중...</LoadingText>
        </LoadingOverlay>
      )}
    </SettingsWrapper>
  );
};

const SettingsWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8fafc;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const HelpButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f8fafc;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Content = styled.div`
  padding: 20px 0;
  padding-bottom: 70px;
`;

const SettingsSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding: 0 4px;
`;

const SettingsItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;

  &:hover {
    background-color: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SettingsIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--accent-blue);
  border-radius: 10px;
  color: var(--primary-blue);
`;

const SettingsInfo = styled.div`
  flex: 1;
`;

const SettingsLabel = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
`;

const SettingsDescription = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 28px;

    &:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: var(--primary-blue);
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }
`;

const AccountItem = styled(SettingsItem)`
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;

  &:hover {
    background-color: #e9ecef;
  }
`;

const DangerItem = styled(SettingsItem)`
  background-color: #fff5f5;
  border: 1px solid #ffcccc;

  ${SettingsIcon} {
    background-color: #ffe5e5;
    color: #ff4444;
  }

  ${SettingsLabel} {
    color: #ff4444;
  }

  &:hover {
    background-color: #ffe5e5;
    border-color: #ff9999;
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

export default Settings;
