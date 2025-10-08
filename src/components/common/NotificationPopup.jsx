import React from 'react';
import styled from 'styled-components';
import { FiX, FiBell, FiInfo } from 'react-icons/fi';

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    type: 'notice',
    title: '서비스 업데이트 안내',
    content: '화상 통화 기능이 추가되었습니다.',
    date: '2024.03.15',
    isNew: true,
  },
  {
    id: 2,
    type: 'update',
    title: '새로운 기능 추가',
    content: '관심사 기반 친구 추천 기능이 추가되었습니다.',
    date: '2024.03.14',
    isNew: true,
  },
  {
    id: 3,
    type: 'notice',
    title: '개인정보 처리방침 개정 안내',
    content: '개인정보 처리방침이 개정되었습니다. 자세한 내용은 공지사항을 확인해주세요.',
    date: '2024.03.13',
    isNew: false,
  },
];

const NotificationPopup = ({ onClose }) => {
  return (
    <PopupWrapper onClick={(e) => e.stopPropagation()}>
      <PopupHeader>
        <Title>
          <FiBell />
          알림
        </Title>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </PopupHeader>

      <PopupContent>
        {DUMMY_NOTIFICATIONS.map((notification) => (
          <NotificationItem key={notification.id} isNew={notification.isNew}>
            <NotificationIcon>
              <FiInfo />
            </NotificationIcon>
            <NotificationContent>
              <NotificationTitle>
                {notification.title}
                {notification.isNew && <NewBadge>NEW</NewBadge>}
              </NotificationTitle>
              <NotificationText>{notification.content}</NotificationText>
              <NotificationDate>{notification.date}</NotificationDate>
            </NotificationContent>
          </NotificationItem>
        ))}
      </PopupContent>

      <PopupFooter>
        <ViewAllButton>모든 알림 보기</ViewAllButton>
      </PopupFooter>
    </PopupWrapper>
  );
};

const PopupWrapper = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--text-primary);
  }
`;

const PopupContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const NotificationItem = styled.div.attrs(props => ({
  // attrs 메서드를 사용하여 DOM에 전달되지 않을 props 정의
  'data-new': props.isNew
}))`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: ${props => props['data-new'] ? 'var(--bg-highlight)' : 'transparent'};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-hover);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-light-blue);
  color: var(--primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NewBadge = styled.span`
  background-color: var(--primary-blue);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
`;

const NotificationText = styled.p`
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
  line-height: 1.4;
`;

const NotificationDate = styled.span`
  font-size: 12px;
  color: var(--text-light);
`;

const PopupFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
`;

const ViewAllButton = styled.button`
  width: 100%;
  padding: 8px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-hover);
    border-color: var(--primary-blue);
    color: var(--primary-blue);
  }
`;

export default NotificationPopup;
