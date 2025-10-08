import React from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

const InterestModal = ({
  isOpen,
  onClose,
  interests,
  selectedInterests,
  onInterestSelect,
  customInterest,
  onCustomInterestChange,
  onCustomInterestAdd,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>관심사 선택</h3>
          <span>최대 5개까지 선택 가능</span>
        </ModalHeader>
        
        <ModalBody>
          <InterestGrid>
            {interests.map((interest) => {
              const isSelected = selectedInterests.some(i => i.id === interest.id);
              return (
                <InterestOption
                  key={interest.id}
                  onClick={() => onInterestSelect(interest)}
                  isSelected={isSelected}
                  disabled={isSelected || selectedInterests.length >= 5}
                >
                  {interest.name}
                </InterestOption>
              );
            })}
          </InterestGrid>

          <CustomInterestForm onSubmit={onCustomInterestAdd}>
            <CustomInterestInput
              type="text"
              value={customInterest}
              onChange={onCustomInterestChange}
              placeholder="직접 입력"
              maxLength={10}
            />
            <CustomInterestButton 
              type="submit"
              disabled={!customInterest.trim() || selectedInterests.length >= 5}
            >
              추가
            </CustomInterestButton>
          </CustomInterestForm>
        </ModalBody>

        <ModalFooter>
          <ModalButton onClick={onClose}>
            닫기
          </ModalButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--bg-card);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 20px;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  span {
    font-size: 14px;
    color: var(--text-light);
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
`;

const InterestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
`;

const InterestOption = styled.button`
  padding: 8px 12px;
  background-color: ${props => props.isSelected ? 'var(--primary-light-blue)' : 'var(--bg-card)'};
  border: 1px solid ${props => props.isSelected ? 'var(--primary-blue)' : 'var(--border-color)'};
  border-radius: 20px;
  color: ${props => props.isSelected ? 'var(--primary-blue)' : 'var(--text-secondary)'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? '0.5' : '1'};
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--primary-blue);
    color: var(--primary-blue);
  }
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background-color: var(--bg-input);
  color: var(--text-primary);

  &:hover {
    background-color: var(--border-color);
  }
`;

const CustomInterestForm = styled.form`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
`;

const CustomInterestInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-input);

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const CustomInterestButton = styled.button`
  padding: 8px 16px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: var(--primary-dark-blue);
  }
`;

export default InterestModal;
