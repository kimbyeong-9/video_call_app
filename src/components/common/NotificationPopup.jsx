import React from 'react';
import styled from 'styled-components';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const NotificationPopup = ({ message, type = 'success', onClose }) => {
  return (
    <PopupWrapper onClick={(e) => e.stopPropagation()}>
      <PopupContent type={type}>
        <IconWrapper type={type}>
          {type === 'success' ? <FiCheckCircle size={24} /> : <FiAlertCircle size={24} />}
        </IconWrapper>
        <Message>{message}</Message>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </PopupContent>
    </PopupWrapper>
  );
};

const PopupWrapper = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const PopupContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid ${props => props.type === 'success' ? 'var(--success-color, #10B981)' : 'var(--error-color, #EF4444)'};
`;

const IconWrapper = styled.div`
  color: ${props => props.type === 'success' ? 'var(--success-color, #10B981)' : 'var(--error-color, #EF4444)'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
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
  margin-left: 8px;

  &:hover {
    color: var(--text-primary);
  }
`;

export default NotificationPopup;
