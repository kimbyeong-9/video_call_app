import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();

  const tabs = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/friends', label: '친구목록', icon: '👥' },
    { path: '/chatlist', label: '채팅', icon: '💬', showBadge: true },
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
            <IconWrapper>
              <TabIcon>{tab.icon}</TabIcon>
              {tab.showBadge && unreadCount > 0 && (
                <NotificationBadge>{unreadCount > 99 ? '99+' : unreadCount}</NotificationBadge>
              )}
            </IconWrapper>
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

const IconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TabIcon = styled.span`
  font-size: 20px;
  margin-bottom: 2px;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: #FF3B30;
  color: white;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const TabLabel = styled.span`
  font-size: 10px;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  text-align: center;
  line-height: 1.2;
`;

export default Footer;