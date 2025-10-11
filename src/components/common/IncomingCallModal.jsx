import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FiPhone, FiPhoneOff } from 'react-icons/fi';
import { videoCall } from '../../utils/webrtc';

const IncomingCallModal = ({ currentUserId }) => {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!currentUserId) {
      console.log('⚠️ [IncomingCallModal] currentUserId 없음');
      return;
    }

    console.log('🔵 [IncomingCallModal] 수신 통화 구독 시작:', currentUserId);

    // 수신 통화 구독
    const callChannel = videoCall.subscribeToIncomingCalls(
      currentUserId,
      (callInfo) => {
        console.log('✅ [IncomingCallModal] 수신 통화 콜백 실행:', callInfo);
        setIncomingCall(callInfo);

        // 벨소리 재생 (선택사항)
        playRingtone();
      }
    );

    return () => {
      console.log('🔵 [IncomingCallModal] 구독 해제');
      if (callChannel) {
        callChannel.unsubscribe();
      }
      stopRingtone();
    };
  }, [currentUserId]);

  const playRingtone = () => {
    // 실제 벨소리 구현 (선택사항)
    // const audio = new Audio('/ringtone.mp3');
    // audio.loop = true;
    // audio.play();
  };

  const stopRingtone = () => {
    // 벨소리 중지
  };

  const handleAccept = async () => {
    if (!incomingCall) return;

    stopRingtone();

    // 통화 수락 - 영상통화 페이지로 이동 (수신자 모드)
    navigate(`/video-call?callId=${incomingCall.callId}&mode=receiver`);
    setIncomingCall(null);
  };

  const handleDecline = async () => {
    if (!incomingCall) return;

    stopRingtone();

    // 통화 거절
    await videoCall.updateCallStatus(incomingCall.callId, 'declined');
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <ModalOverlay>
      <ModalContainer>
        <CallerAvatar>
          {incomingCall.caller?.profile_image ? (
            <AvatarImage src={incomingCall.caller.profile_image} alt="Caller" />
          ) : (
            <AvatarPlaceholder>
              {incomingCall.caller?.nickname?.charAt(0) || '?'}
            </AvatarPlaceholder>
          )}
        </CallerAvatar>

        <CallerName>{incomingCall.caller?.nickname || '알 수 없음'}</CallerName>
        <CallStatus>영상통화 걸려옴...</CallStatus>

        <ButtonGroup>
          <DeclineButton onClick={handleDecline}>
            <FiPhoneOff size={24} />
            거절
          </DeclineButton>

          <AcceptButton onClick={handleAccept}>
            <FiPhone size={24} />
            수락
          </AcceptButton>
        </ButtonGroup>
      </ModalContainer>
    </ModalOverlay>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 24px;
  padding: 40px 30px;
  text-align: center;
  max-width: 90%;
  width: 320px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.3s ease;
`;

const CallerAvatar = styled.div`
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  animation: ${pulse} 2s infinite;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #4CAF50;
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  color: white;
  border: 4px solid #4CAF50;
`;

const CallerName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const CallStatus = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const CallButton = styled.button`
  flex: 1;
  padding: 16px 24px;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
  }
`;

const AcceptButton = styled(CallButton)`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
  }
`;

const DeclineButton = styled(CallButton)`
  background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(244, 67, 54, 0.5);
  }
`;

export default IncomingCallModal;
