import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { WebRTCManager, videoCall } from '../../utils/webrtc';
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';

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
  const [localUserInfo, setLocalUserInfo] = useState(null);
  const [remoteUserInfo, setRemoteUserInfo] = useState(null);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);

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
      // cleanup을 async로 호출하되, useEffect return에서는 await 불가
      cleanup().catch(error => {
        console.error('❌ [VideoCall] cleanup 에러:', error);
      });
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
    console.log('🔵 [VideoCall] 원격 스트림 상태 변경:', remoteStream);
    if (remoteStream && remoteVideoRef.current) {
      console.log('🔵 [VideoCall] 원격 비디오 설정 시작');
      console.log('   - Stream Tracks:', remoteStream.getTracks().length);
      console.log('   - Video Tracks:', remoteStream.getVideoTracks().length);
      console.log('   - Audio Tracks:', remoteStream.getAudioTracks().length);
      
      remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('통화 중');
      
      // 비디오 로드 이벤트 리스너 추가
      remoteVideoRef.current.onloadedmetadata = () => {
        console.log('✅ [VideoCall] 원격 비디오 메타데이터 로드 완료');
        remoteVideoRef.current.play().catch(error => {
          console.error('❌ [VideoCall] 원격 비디오 재생 실패:', error);
        });
      };
      
      remoteVideoRef.current.onplay = () => {
        console.log('✅ [VideoCall] 원격 비디오 재생 시작');
      };
      
      remoteVideoRef.current.onerror = (error) => {
        console.error('❌ [VideoCall] 원격 비디오 에러:', error);
      };
      
      console.log('✅ [VideoCall] 원격 비디오 설정 완료');
    }
  }, [remoteStream]);

  const initCall = async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔵 [VideoCall] 통화 초기화 시작');
      console.log('🔵 [VideoCall] Call ID:', callId);
      console.log('🔵 [VideoCall] Mode:', mode);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const currentUserStr = localStorage.getItem('currentUser');
      console.log('🔵 [VideoCall] localStorage.currentUser:', currentUserStr);

      if (!currentUserStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [VideoCall] 현재 사용자 정보:');
      console.log('   - ID:', currentUser.id);
      console.log('   - Email:', currentUser.email);
      console.log('   - Nickname:', currentUser.nickname);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 통화 정보 먼저 조회 (발신자/수신자 정보 확인)
      console.log('🔵 [VideoCall] 통화 정보 조회 시작...');
      const { data: callData, error: callError } = await videoCall.getCall(callId);

      if (callError) {
        console.error('❌ [VideoCall] 통화 정보 조회 실패:', callError);
        alert('통화 정보를 불러올 수 없습니다.');
        navigate('/live');
        return;
      }

      console.log('✅ [VideoCall] 통화 정보:', callData);

      // 현재 사용자 정보 저장
      setLocalUserInfo(currentUser);

      // 발신자/수신자 정보 저장
      if (mode === 'receiver' && callData?.caller) {
        setCallerInfo(callData.caller);
        setRemoteUserInfo(callData.caller);
        console.log('✅ [VideoCall] 발신자 정보 설정:', callData.caller.nickname);
      } else if (mode === 'caller' && callData?.receiver) {
        setRemoteUserInfo(callData.receiver);
        console.log('✅ [VideoCall] 수신자 정보 설정:', callData.receiver.nickname);
      }

      // WebRTC Manager 초기화
      webrtcManagerRef.current = new WebRTCManager(callId, currentUser.id);
      console.log('✅ [VideoCall] WebRTCManager 생성 완료');

      // 로컬 스트림 획득
      console.log('🔵 [VideoCall] 로컬 스트림 획득 시작...');
      const stream = await webrtcManagerRef.current.getLocalStream();
      setLocalStream(stream);
      console.log('✅ [VideoCall] 로컬 스트림 획득 완료');

      // PeerConnection 초기화
      console.log('🔵 [VideoCall] PeerConnection 초기화...');
      webrtcManagerRef.current.initPeerConnection(
        (remoteStream) => {
          console.log('🎉 [VideoCall] 원격 스트림 수신 콜백 호출!');
          console.log('   - 수신된 스트림:', remoteStream);
          console.log('   - 스트림 Tracks:', remoteStream?.getTracks()?.length || 0);
          setRemoteStream(remoteStream);
        },
        (state) => {
          console.log('🔵 [VideoCall] 연결 상태 변경:', state);
          setConnectionState(state);
          if (state === 'connected') {
            setCallStatus('통화 중');
            videoCall.updateCallStatus(callId, 'active');
          } else if (state === 'connecting') {
            setCallStatus('연결 중...');
          } else if (state === 'disconnected' || state === 'failed') {
            setCallStatus('연결 끊김');
          }
        }
      );

      // 시그널링 구독 시작 (발신자/수신자 모두)
      console.log('🔵 [VideoCall] 시그널링 구독 시작...');
      webrtcManagerRef.current.startSignaling({
        onOffer: () => {
          console.log('📞 [VideoCall] Offer 수신됨 (콜백)');
          setCallStatus('상대방 응답 대기 중...');
        },
        onAnswer: () => {
          console.log('✅ [VideoCall] Answer 수신됨 (콜백)');
          setCallStatus('연결 중...');
        },
        onVideoToggle: (enabled) => {
          console.log('📹 [VideoCall] 상대방 비디오 상태 변경:', enabled);
          setRemoteVideoEnabled(enabled);
        },
        onCallEnd: () => {
          console.log('☎️ [VideoCall] 상대방이 통화 종료');
          setShowEndModal(true);
          // 2초 후 자동으로 Live 페이지로 이동
          setTimeout(async () => {
            await cleanup();
            navigate('/live');
          }, 2000);
        }
      });

      // 모드에 따른 처리
      if (mode === 'caller') {
        // 발신자: Offer 생성 및 전송
        console.log('📞 [VideoCall] 발신자 모드 - Offer 생성 시작');
        setCallStatus('상대방을 호출 중...');
        await videoCall.updateCallStatus(callId, 'ringing');

        // 약간의 지연 후 Offer 생성 (PeerConnection이 완전히 초기화되도록)
        setTimeout(async () => {
          try {
            await webrtcManagerRef.current.createOffer();
            console.log('✅ [VideoCall] Offer 생성 및 전송 완료');
          } catch (error) {
            console.error('❌ [VideoCall] Offer 생성 실패:', error);
          }
        }, 500);
      } else {
        // 수신자: 통화 수락 상태로 변경하고 Offer 대기
        console.log('📱 [VideoCall] 수신자 모드 - Offer 대기 중');
        setCallStatus('통화 수락됨 - 연결 중...');
        await videoCall.updateCallStatus(callId, 'active');
      }

      console.log('✅ [VideoCall] 통화 초기화 완료');

    } catch (error) {
      console.error('❌ [VideoCall] 통화 초기화 실패:', error);
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
    console.log('🔵 [VideoCall] 통화 종료 시작');
    try {
      // 현재 사용자 정보 가져오기
      const currentUserStr = localStorage.getItem('currentUser');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

      // 상대방에게 통화 종료 시그널 전송
      if (currentUser) {
        await videoCall.sendCallEnd(callId, currentUser.id);
        console.log('✅ [VideoCall] 통화 종료 시그널 전송 완료');
      }

      // 통화 상태 업데이트
      await videoCall.updateCallStatus(callId, 'ended');
      console.log('✅ [VideoCall] 통화 상태 업데이트 완료');
    } catch (error) {
      console.error('❌ [VideoCall] 통화 종료 처리 실패:', error);
    }

    await cleanup();
    console.log('✅ [VideoCall] cleanup 완료, Live 페이지로 이동');
    navigate('/live');
  };

  const toggleMute = () => {
    if (webrtcManagerRef.current) {
      const newMutedState = !isMuted;
      webrtcManagerRef.current.toggleAudio(!newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const toggleVideo = async () => {
    if (webrtcManagerRef.current) {
      const newVideoState = !isVideoOff;
      await webrtcManagerRef.current.toggleVideo(!newVideoState);
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
          $hidden={!remoteVideoEnabled}
        />

        {/* 원격 사용자 프로필 이미지 (비디오 꺼짐 시) */}
        {remoteStream && !remoteVideoEnabled && remoteUserInfo && (
          <RemoteProfileBox>
            {remoteUserInfo.profile_image ? (
              <ProfileImage src={remoteUserInfo.profile_image} alt={remoteUserInfo.nickname} />
            ) : (
              <ProfilePlaceholder>
                {remoteUserInfo.nickname?.[0]?.toUpperCase() || '?'}
              </ProfilePlaceholder>
            )}
            <ProfileName>{remoteUserInfo.nickname}</ProfileName>
          </RemoteProfileBox>
        )}

        {!remoteStream && (
          <PlaceholderBox>
            <PlaceholderText>
              {callerInfo ? `${callerInfo.nickname}님과 연결 중...` : callStatus}
            </PlaceholderText>
            <div style={{ color: '#888', fontSize: '14px', marginTop: '10px' }}>
              연결 상태: {connectionState}
            </div>
          </PlaceholderBox>
        )}

        {/* 로컬 비디오 (작은 화면) */}
        <LocalVideoWrapper>
          <LocalVideo
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            $hidden={isVideoOff}
          />

          {/* 로컬 사용자 프로필 이미지 (비디오 꺼짐 시) */}
          {isVideoOff && localUserInfo && (
            <LocalProfileBox>
              {localUserInfo.profile_image ? (
                <LocalProfileImage src={localUserInfo.profile_image} alt={localUserInfo.nickname} />
              ) : (
                <LocalProfilePlaceholder>
                  {localUserInfo.nickname?.[0]?.toUpperCase() || '?'}
                </LocalProfilePlaceholder>
              )}
            </LocalProfileBox>
          )}
        </LocalVideoWrapper>
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

      {/* 통화 종료 모달 */}
      {showEndModal && (
        <EndCallModal>
          <EndCallModalContent>
            <EndCallIcon>
              <FiPhoneOff size={48} />
            </EndCallIcon>
            <EndCallMessage>통화가 종료되었습니다</EndCallMessage>
          </EndCallModalContent>
        </EndCallModal>
      )}
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
  display: ${props => props.$hidden ? 'none' : 'block'};
`;

const RemoteProfileBox = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  z-index: 5;
`;

const ProfileImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    width: 300px;
    height: 300px;
  }
`;

const ProfilePlaceholder = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  font-weight: bold;
  color: #fff;
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    width: 300px;
    height: 300px;
    font-size: 120px;
  }
`;

const ProfileName = styled.div`
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    font-size: 32px;
  }
`;

const LocalVideoWrapper = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
  background: #1a1a1a;

  @media (min-width: 768px) {
    width: 200px;
    height: 266px;
  }
`;

const LocalVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: ${props => props.$hidden ? 'none' : 'block'};
`;

const LocalProfileBox = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
`;

const LocalProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const LocalProfilePlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: #fff;

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;
    font-size: 48px;
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

const EndCallModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const EndCallModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 60px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const EndCallIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #F44336;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  animation: fadeInScale 0.4s ease;

  @keyframes fadeInScale {
    from {
      transform: scale(0.5);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const EndCallMessage = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

export default VideoCall;
