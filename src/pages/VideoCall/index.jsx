import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { WebRTCManager, videoCall } from '../../utils/webrtc';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const callId = searchParams.get('callId');
  const mode = searchParams.get('mode'); // 'caller' or 'receiver'

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('연결 중...');
  const [connectionState, setConnectionState] = useState('new');
  const [callerInfo, setCallerInfo] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcManagerRef = useRef(null);

  useEffect(() => {
    if (!callId) {
      alert('잘못된 통화 정보입니다.');
      navigate('/live');
      return;
    }

    initCall();

    return () => {
      cleanup();
    };
  }, [callId]);

  // 로컬 비디오 설정
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 원격 비디오 설정
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('통화 중');
    }
  }, [remoteStream]);

  const initCall = async () => {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (!currentUserStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const currentUser = JSON.parse(currentUserStr);

      // WebRTC Manager 초기화
      webrtcManagerRef.current = new WebRTCManager(callId, currentUser.id);

      // 로컬 스트림 획득
      const stream = await webrtcManagerRef.current.getLocalStream();
      setLocalStream(stream);

      // PeerConnection 초기화
      webrtcManagerRef.current.initPeerConnection(
        (remoteStream) => {
          setRemoteStream(remoteStream);
        },
        (state) => {
          setConnectionState(state);
          if (state === 'connected') {
            setCallStatus('통화 중');
            // 통화 상태를 'active'로 업데이트
            videoCall.updateCallStatus(callId, 'active');
          } else if (state === 'disconnected' || state === 'failed') {
            setCallStatus('연결 끊김');
          }
        }
      );

      // 시그널링 시작
      webrtcManagerRef.current.startSignaling({
        onOffer: () => {
          setCallStatus('Offer 수신됨');
        },
        onAnswer: () => {
          setCallStatus('연결 중...');
        }
      });

      // 발신자인 경우 Offer 생성
      if (mode === 'caller') {
        setCallStatus('상대방을 호출 중...');
        await videoCall.updateCallStatus(callId, 'ringing');
        await webrtcManagerRef.current.createOffer();
      } else {
        // 수신자인 경우 통화 정보 조회
        console.log('🔵 수신자 모드 - 통화 정보 조회 시작');
        const { data: callData, error: callError } = await videoCall.getCall(callId);
        
        if (callError) {
          console.error('❌ 통화 정보 조회 실패:', callError);
          // 에러가 발생해도 통화는 계속 진행
        } else if (callData?.caller) {
          console.log('✅ 발신자 정보 조회 성공:', callData.caller);
          setCallerInfo(callData.caller);
        } else {
          console.warn('⚠️ 발신자 정보 없음');
        }
        
        setCallStatus('통화 수락됨');
        await videoCall.updateCallStatus(callId, 'active');
      }

    } catch (error) {
      console.error('통화 초기화 실패:', error);
      alert('카메라/마이크 권한을 허용해주세요.');
      navigate('/live');
    }
  };

  const cleanup = async () => {
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.cleanup();
    }
  };

  const handleEndCall = async () => {
    await videoCall.updateCallStatus(callId, 'ended');
    await cleanup();
    navigate('/live');
  };

  const toggleMute = () => {
    if (webrtcManagerRef.current) {
      const newMutedState = !isMuted;
      webrtcManagerRef.current.toggleAudio(!newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const toggleVideo = () => {
    if (webrtcManagerRef.current) {
      const newVideoState = !isVideoOff;
      webrtcManagerRef.current.toggleVideo(!newVideoState);
      setIsVideoOff(newVideoState);
    }
  };

  return (
    <CallContainer>
      <VideoContainer>
        {/* 원격 비디오 (전체 화면) */}
        <RemoteVideo
          ref={remoteVideoRef}
          autoPlay
          playsInline
        />
        {!remoteStream && (
          <PlaceholderBox>
            <PlaceholderText>
              {callerInfo ? `${callerInfo.nickname}님과 연결 중...` : callStatus}
            </PlaceholderText>
          </PlaceholderBox>
        )}

        {/* 로컬 비디오 (작은 화면) */}
        <LocalVideo
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
        />
      </VideoContainer>

      {/* 상태 표시 */}
      <StatusBar>
        <StatusText>{callStatus}</StatusText>
        <ConnectionIndicator state={connectionState} />
      </StatusBar>

      {/* 컨트롤 버튼 */}
      <ControlBar>
        <ControlButton onClick={toggleMute} $active={!isMuted}>
          {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </ControlButton>

        <ControlButton onClick={toggleVideo} $active={!isVideoOff}>
          {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
        </ControlButton>

        <EndCallButton onClick={handleEndCall}>
          <FiPhoneOff size={24} />
        </EndCallButton>
      </ControlBar>
    </CallContainer>
  );
};

const CallContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
`;

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1a1a1a;
`;

const LocalVideo = styled.video`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;

  @media (min-width: 768px) {
    width: 200px;
    height: 266px;
  }
`;

const PlaceholderBox = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const PlaceholderText = styled.p`
  color: #fff;
  font-size: 18px;
  font-weight: 500;
`;

const StatusBar = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
`;

const StatusText = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
`;

const ConnectionIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.state) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
      case 'new':
        return '#FFC107';
      case 'disconnected':
      case 'failed':
        return '#F44336';
      default:
        return '#999';
    }
  }};
  animation: ${props => (props.state === 'connecting' || props.state === 'new') ? 'pulse 1.5s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const ControlBar = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  align-items: center;
`;

const ControlButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)'};
  color: ${props => props.$active ? '#333' : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const EndCallButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #F44336;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    background: #D32F2F;
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default VideoCall;
