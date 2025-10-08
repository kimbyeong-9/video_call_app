import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/friends', label: '친구목록', icon: '👥' },
    { path: '/chatlist', label: '채팅', icon: '💬' },
    { path: '/search', label: '검색', icon: '🔍' },
    { path: '/live', label: 'Live', icon: '📹' }
  ];

  return (
    <FooterWrapper>
      <TabsContainer>
        {tabs.map((tab) => (
          <TabItem
            key={tab.path}
            $isActive={location.pathname === tab.path}
            onClick={() => navigate(tab.path)}
          >
            <TabIcon>{tab.icon}</TabIcon>
            <TabLabel $isActive={location.pathname === tab.path}>
              {tab.label}
            </TabLabel>
          </TabItem>
        ))}
      </TabsContainer>
    </FooterWrapper>
  );
};

const FooterWrapper = styled.footer`
  width: 100%;
  max-width: var(--mobile-width);
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;

  @media screen and (min-width: 768px) {
    max-width: var(--tablet-width);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 0 8px;
`;

const TabItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  color: ${props => props.$isActive ? '#007AFF' : '#666666'};
  transition: color 0.2s ease;
  min-width: 0;

  &:hover {
    color: #007AFF;
  }
`;

const TabIcon = styled.span`
  font-size: 20px;
  margin-bottom: 2px;
`;

const TabLabel = styled.span`
  font-size: 10px;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  text-align: center;
  line-height: 1.2;
`;

export default Footer;