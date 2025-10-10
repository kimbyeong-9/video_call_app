import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiShield, FiMoon, FiSun, FiGlobe, FiHelpCircle, FiUser, FiLock } from 'react-icons/fi';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <SettingsWrapper>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft size={24} />
        </BackButton>
        <Title>설정</Title>
        <Spacer />
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

          <SettingsItem onClick={() => navigate('/help')}>
            <SettingsIcon>
              <FiHelpCircle size={20} />
            </SettingsIcon>
            <SettingsInfo>
              <SettingsLabel>도움말</SettingsLabel>
              <SettingsDescription>자주 묻는 질문 및 고객지원</SettingsDescription>
            </SettingsInfo>
          </SettingsItem>
        </SettingsSection>
      </Content>
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

const Spacer = styled.div`
  width: 40px;
`;

const Content = styled.div`
  padding: 20px 16px;
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

export default Settings;
