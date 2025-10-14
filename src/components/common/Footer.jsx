import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import HouseIcon from '../../assets/images/house_17996174.png';
import PersonIcon from '../../assets/images/person_6797008.png';
import DialogueIcon from '../../assets/images/dialogue-bubble_17603703.png';
import SearchIcon from '../../assets/images/search_18292397.png';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();

  const tabs = [
    { path: '/', label: '홈', icon: 'house', isImage: true },
    { path: '/friends', label: '친구목록', icon: 'person', isImage: true },
    { path: '/chatlist', label: '채팅', icon: 'dialogue', isImage: true, showBadge: true },
    { path: '/search', label: '검색', icon: 'search', isImage: true }
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
              {tab.isImage ? (
                tab.icon === 'house' ? (
                  <HouseImage src={HouseIcon} alt="홈" />
                ) : tab.icon === 'person' ? (
                  <PersonImage src={PersonIcon} alt="친구목록" />
                ) : tab.icon === 'dialogue' ? (
                  <DialogueImage src={DialogueIcon} alt="채팅" />
                ) : (
                  <SearchImage src={SearchIcon} alt="검색" />
                )
              ) : (
                <TabIcon>{tab.icon}</TabIcon>
              )}
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
  height: 60px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 100;
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

const HouseImage = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
  margin-bottom: 2px;
`;

const PersonImage = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
  margin-bottom: 2px;
`;

const DialogueImage = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
  margin-bottom: 2px;
`;

const SearchImage = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
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