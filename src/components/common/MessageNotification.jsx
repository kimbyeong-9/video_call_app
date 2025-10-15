import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiMessageCircle, FiX } from 'react-icons/fi';

// 알림 애니메이션
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
`;

const NotificationItem = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${props => props.$isVisible ? slideIn : slideOut} 0.3s ease-in-out;
  transform: ${props => props.$isVisible ? 'translateX(0)' : 'translateX(100%)'};
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const NotificationIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const NotificationMessage = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NotificationTime = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  margin-top: 6px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MessageNotification = ({ notifications, onClose, onClick }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      
      // 새 알림을 visibleNotifications에 추가
      setVisibleNotifications(prev => {
        const exists = prev.find(n => n.id === latestNotification.id);
        
        if (!exists) {
          console.log('🔔 새 메시지 알림 표시:', latestNotification.senderName);
          return [...prev, { ...latestNotification, isVisible: true }];
        }
        return prev;
      });

      // 5초 후 자동으로 사라지게 하기
      setTimeout(() => {
        setVisibleNotifications(prev => 
          prev.map(n => 
            n.id === latestNotification.id 
              ? { ...n, isVisible: false }
              : n
          )
        );
        
        // 애니메이션 완료 후 제거
        setTimeout(() => {
          setVisibleNotifications(prev => 
            prev.filter(n => n.id !== latestNotification.id)
          );
        }, 300);
      }, 5000);
    }
  }, [notifications]);

  const handleClose = (notificationId) => {
    setVisibleNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isVisible: false }
          : n
      )
    );
    
    setTimeout(() => {
      setVisibleNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      onClose?.(notificationId);
    }, 300);
  };

  const handleClick = (notification) => {
    onClick?.(notification);
    handleClose(notification.id);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 1분 미만
      return '방금 전';
    } else if (diff < 3600000) { // 1시간 미만
      return `${Math.floor(diff / 60000)}분 전`;
    } else if (diff < 86400000) { // 1일 미만
      return `${Math.floor(diff / 3600000)}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <NotificationContainer>
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          $isVisible={notification.isVisible}
          onClick={() => handleClick(notification)}
        >
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              handleClose(notification.id);
            }}
          >
            <FiX />
          </CloseButton>
          
          <NotificationHeader>
            <NotificationIcon>
              <FiMessageCircle />
            </NotificationIcon>
            <NotificationContent>
              <NotificationTitle>
                {notification.senderName}님이 메시지를 보냈습니다
              </NotificationTitle>
              <NotificationMessage>
                {notification.message}
              </NotificationMessage>
              <NotificationTime>
                {formatTime(notification.createdAt)}
              </NotificationTime>
            </NotificationContent>
          </NotificationHeader>
        </NotificationItem>
      ))}
    </NotificationContainer>
  );
};

export default MessageNotification;
