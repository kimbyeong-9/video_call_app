import { supabase } from './supabase';

// STUN 서버 설정 (Google Public STUN)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

/**
 * 영상통화 유틸리티 함수들
 */
export const videoCall = {
  /**
   * 통화 시작 (발신)
   */
  createCall: async (callerId, receiverId) => {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .insert({
          caller_id: callerId,
          receiver_id: receiverId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('통화 생성 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * 통화 상태 업데이트
   */
  updateCallStatus: async (callId, status) => {
    try {
      const updateData = { status };

      // 통화 종료 시 종료 시간 기록
      if (status === 'ended' || status === 'declined') {
        updateData.ended_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('video_calls')
        .update(updateData)
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('통화 상태 업데이트 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * 통화 정보 조회
   */
  getCall: async (callId) => {
    try {
      // 1단계: 기본 통화 정보 조회
      const { data: callData, error: callError } = await supabase
        .from('video_calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (callError) throw callError;

      // 2단계: 발신자 정보 조회
      const { data: callerData } = await supabase
        .from('users')
        .select('id, nickname, email, profile_image')
        .eq('id', callData.caller_id)
        .single();

      // 3단계: 수신자 정보 조회
      const { data: receiverData } = await supabase
        .from('users')
        .select('id, nickname, email, profile_image')
        .eq('id', callData.receiver_id)
        .single();

      // 결과 조합
      const result = {
        ...callData,
        caller: callerData || null,
        receiver: receiverData || null
      };

      console.log('✅ 통화 정보 조회 성공:', result);
      return { data: result, error: null };
    } catch (error) {
      console.error('❌ 통화 정보 조회 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * Offer 전송 (발신자)
   */
  sendOffer: async (callId, senderId, offerSdp) => {
    try {
      console.log('🔵 [sendOffer] Offer 전송 시작:', { callId, senderId, offerSdp });

      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'offer',
          signal_data: offerSdp // 이미 { type, sdp } 형태이므로 그대로 저장
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ [sendOffer] Offer 전송 완료:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ [sendOffer] Offer 전송 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * Answer 전송 (수신자)
   */
  sendAnswer: async (callId, senderId, answerSdp) => {
    try {
      console.log('🔵 [sendAnswer] Answer 전송 시작:', { callId, senderId, answerSdp });

      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'answer',
          signal_data: answerSdp // 이미 { type, sdp } 형태이므로 그대로 저장
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ [sendAnswer] Answer 전송 완료:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ [sendAnswer] Answer 전송 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * ICE Candidate 전송
   */
  sendIceCandidate: async (callId, senderId, candidate) => {
    try {
      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'ice-candidate',
          signal_data: { candidate }
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('ICE Candidate 전송 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * 비디오 토글 상태 전송
   */
  sendVideoToggle: async (callId, senderId, enabled) => {
    try {
      console.log('🔵 [sendVideoToggle] 비디오 상태 전송:', { callId, senderId, enabled });

      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'video-toggle',
          signal_data: { enabled }
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ [sendVideoToggle] 비디오 상태 전송 완료');
      return { data, error: null };
    } catch (error) {
      console.error('❌ [sendVideoToggle] 비디오 상태 전송 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * 통화 종료 시그널 전송
   */
  sendCallEnd: async (callId, senderId) => {
    try {
      console.log('🔵 [sendCallEnd] 통화 종료 시그널 전송:', { callId, senderId });

      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'call-end',
          signal_data: { ended: true }
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ [sendCallEnd] 통화 종료 시그널 전송 완료');
      return { data, error: null };
    } catch (error) {
      console.error('❌ [sendCallEnd] 통화 종료 시그널 전송 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * 기존 시그널 조회 (수신자가 늦게 진입한 경우)
   */
  getExistingSignals: async (callId, currentUserId) => {
    try {
      console.log('🔵 [getExistingSignals] 기존 시그널 조회 시작');
      console.log('🔵 Call ID:', callId);

      const { data: signals, error } = await supabase
        .from('webrtc_signals')
        .select('*')
        .eq('call_id', callId)
        .neq('sender_id', currentUserId) // 본인이 보낸 것은 제외
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('✅ [getExistingSignals] 조회된 시그널:', signals?.length || 0, '개');
      return { data: signals || [], error: null };
    } catch (error) {
      console.error('❌ [getExistingSignals] 기존 시그널 조회 에러:', error);
      return { data: [], error };
    }
  },

  /**
   * 시그널링 메시지 실시간 구독
   */
  subscribeToSignals: (callId, currentUserId, callbacks) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [subscribeToSignals] Realtime 구독 시작');
    console.log('🔵 Call ID:', callId);
    console.log('🔵 Current User ID:', currentUserId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 랜덤 UUID 추가로 완전히 독립적인 채널 생성
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const channelName = `webrtc-signals:${callId}:${currentUserId}:${uniqueId}`;
    console.log('🔵 [subscribeToSignals] 고유 채널 이름:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `call_id=eq.${callId}`
        },
        (payload) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎉 [subscribeToSignals] 새 신호 수신!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          const signal = payload.new;
          console.log('📦 신호 타입:', signal.signal_type);
          console.log('📦 발신자 ID:', signal.sender_id);
          console.log('📦 현재 사용자 ID:', currentUserId);

          const { signal_type, signal_data, sender_id } = signal;

          // 본인이 보낸 신호는 무시
          if (sender_id === currentUserId) {
            console.log('⚠️ [subscribeToSignals] 본인의 신호 - 무시');
            return;
          }

          switch (signal_type) {
            case 'offer':
              console.log('📞 [subscribeToSignals] Offer 신호 처리');
              console.log('📞 Offer SDP:', signal_data);
              callbacks.onOffer?.(signal_data, sender_id);
              break;
            case 'answer':
              console.log('✅ [subscribeToSignals] Answer 신호 처리');
              console.log('✅ Answer SDP:', signal_data);
              callbacks.onAnswer?.(signal_data, sender_id);
              break;
            case 'ice-candidate':
              console.log('🧊 [subscribeToSignals] ICE Candidate 신호 처리');
              callbacks.onIceCandidate?.(signal_data.candidate, sender_id);
              break;
            case 'video-toggle':
              console.log('📹 [subscribeToSignals] 비디오 토글 신호 처리:', signal_data.enabled);
              callbacks.onVideoToggle?.(signal_data.enabled, sender_id);
              break;
            case 'call-end':
              console.log('☎️ [subscribeToSignals] 통화 종료 신호 처리');
              callbacks.onCallEnd?.(sender_id);
              break;
            default:
              console.warn('⚠️ [subscribeToSignals] 알 수 없는 시그널 타입:', signal_type);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔵 [subscribeToSignals] 구독 상태:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [subscribeToSignals] 시그널링 구독 완료!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [subscribeToSignals] 채널 에러');
          console.error('   채널 이름:', channelName);
          console.error('   Call ID:', callId);
          console.error('   User ID:', currentUserId);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [subscribeToSignals] 구독 타임아웃');
        }
      });

    return channel;
  },

  /**
   * 통화 상태 변경 실시간 구독
   */
  subscribeToCallStatus: (callId, callback) => {
    const channel = supabase
      .channel(`call-status:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `id=eq.${callId}`
        },
        (payload) => {
          callback(payload.new.status);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * 수신 통화 감지 (특정 사용자에게 오는 통화)
   */
  subscribeToIncomingCalls: (userId, callback) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [WebRTC] 수신 통화 구독 설정');
    console.log('🔵 [WebRTC] User ID:', userId);
    console.log('🔵 [WebRTC] Channel Name:', `incoming-calls:${userId}`);
    console.log('🔵 [WebRTC] Filter:', `receiver_id=eq.${userId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const channel = supabase
      .channel(`incoming-calls:${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_calls',
          filter: `receiver_id=eq.${userId}`
        },
        async (payload) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎉 [WebRTC] 📞 NEW CALL INSERT 감지!!!');
          console.log('🎉 [WebRTC] Payload:', JSON.stringify(payload, null, 2));
          console.log('🎉 [WebRTC] Call ID:', payload.new.id);
          console.log('🎉 [WebRTC] Caller ID:', payload.new.caller_id);
          console.log('🎉 [WebRTC] Receiver ID:', payload.new.receiver_id);
          console.log('🎉 [WebRTC] Status:', payload.new.status);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // pending 상태의 통화만 처리
          if (payload.new.status !== 'pending') {
            console.warn('⚠️ [WebRTC] pending 상태가 아님, 무시:', payload.new.status);
            return;
          }

          console.log('🔵 [WebRTC] 발신자 정보 조회 시작...');
          
          // 발신자 정보 가져오기
          const { data: callerData, error: callerError } = await supabase
            .from('users')
            .select('id, nickname, email, profile_image')
            .eq('id', payload.new.caller_id)
            .single();

          if (callerError) {
            console.error('❌ [WebRTC] 발신자 정보 조회 실패:', callerError);
            return;
          }

          console.log('✅ [WebRTC] 발신자 정보 조회 완료:', callerData);
          console.log('✅ [WebRTC] 콜백 함수 호출...');

          callback({
            callId: payload.new.id,
            caller: callerData,
            status: payload.new.status
          });
        }
      )
      .subscribe((status) => {
        console.log('🔵 [WebRTC] 구독 상태 변경:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [WebRTC] ✨ 수신 통화 구독 완료! 대기 중...');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [WebRTC] 채널 에러');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [WebRTC] 구독 타임아웃');
        } else if (status === 'CLOSED') {
          console.log('🔵 [WebRTC] 채널 닫힘');
        }
      });

    return channel;
  }
};

/**
 * WebRTC PeerConnection 생성 및 관리
 */
export class WebRTCManager {
  constructor(callId, currentUserId) {
    this.callId = callId;
    this.currentUserId = currentUserId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.signalChannel = null;
    this.statusChannel = null;
    this.pendingIceCandidates = []; // ICE Candidate 큐 (remoteDescription 설정 전 도착한 것들)
  }

  /**
   * 로컬 미디어 스트림 획득
   */
  async getLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      return this.localStream;
    } catch (error) {
      console.error('로컬 스트림 획득 실패:', error);
      throw error;
    }
  }

  /**
   * PeerConnection 초기화
   */
  initPeerConnection(onRemoteStream, onConnectionStateChange) {
    console.log('🔵 [WebRTC] PeerConnection 초기화 시작');
    
    // 기존 PeerConnection이 있다면 정리
    if (this.peerConnection) {
      console.log('🔵 [WebRTC] 기존 PeerConnection 정리');
      console.log('   기존 상태:', this.peerConnection.signalingState);
      console.log('   기존 연결 상태:', this.peerConnection.connectionState);
      this.peerConnection.close();
    }
    
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    // 초기 상태 확인
    console.log('🔵 [WebRTC] 새 PeerConnection 생성 완료');
    console.log('   초기 상태:', this.peerConnection.signalingState);
    console.log('   초기 연결 상태:', this.peerConnection.connectionState);
    
    // 상태 큐 초기화
    this.pendingIceCandidates = [];

    // 로컬 스트림 추가
    if (this.localStream) {
      console.log('🔵 [WebRTC] 로컬 스트림 추가:', this.localStream.getTracks().length, 'tracks');
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
        console.log('🔵 [WebRTC] Track 추가:', track.kind, track.label);
      });
    }

    // 원격 스트림 수신
    this.peerConnection.ontrack = (event) => {
      console.log('🎉 [WebRTC] 원격 스트림 수신!');
      console.log('   - Streams 개수:', event.streams.length);
      console.log('   - Track 개수:', event.track ? 1 : 0);
      console.log('   - Track 종류:', event.track?.kind);
      console.log('   - Track 상태:', event.track?.readyState);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('🔵 [WebRTC] 새 원격 스트림 생성');
      }
      
      // event.streams가 있는 경우 (일반적인 경우)
      if (event.streams && event.streams.length > 0) {
        console.log('🔵 [WebRTC] Streams에서 Track 추출');
        event.streams[0].getTracks().forEach(track => {
          console.log('🔵 [WebRTC] 원격 Track 추가:', track.kind, track.label, track.readyState);
          this.remoteStream.addTrack(track);
        });
      }
      // event.streams가 없는 경우 (일부 브라우저)
      else if (event.track) {
        console.log('🔵 [WebRTC] Event에서 직접 Track 추출');
        console.log('🔵 [WebRTC] 원격 Track 추가:', event.track.kind, event.track.label, event.track.readyState);
        this.remoteStream.addTrack(event.track);
      }
      
      console.log('✅ [WebRTC] 원격 스트림 콜백 호출');
      console.log('   - 현재 원격 스트림 Track 수:', this.remoteStream.getTracks().length);
      onRemoteStream?.(this.remoteStream);
    };

    // ICE Candidate 이벤트
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🔵 [WebRTC] ICE Candidate 생성:', event.candidate.candidate);
        videoCall.sendIceCandidate(
          this.callId,
          this.currentUserId,
          event.candidate
        );
      } else {
        console.log('🔵 [WebRTC] ICE gathering 완료');
      }
    };

    // ICE 연결 상태 변경
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🔵 [WebRTC] ICE 연결 상태:', this.peerConnection.iceConnectionState);
      console.log('   - ICE gathering 상태:', this.peerConnection.iceGatheringState);
    };

    // 연결 상태 변경
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔵 [WebRTC] PeerConnection 상태:', this.peerConnection.connectionState);
      console.log('   - Signaling 상태:', this.peerConnection.signalingState);
      console.log('   - ICE 연결 상태:', this.peerConnection.iceConnectionState);
      onConnectionStateChange?.(this.peerConnection.connectionState);
    };

    // 데이터 채널 상태 (디버깅용)
    this.peerConnection.ondatachannel = (_event) => {
      console.log('🔵 [WebRTC] 데이터 채널 수신');
    };

    console.log('✅ [WebRTC] PeerConnection 초기화 완료');
    return this.peerConnection;
  }

  /**
   * Offer 생성 (발신자)
   */
  async createOffer() {
    try {
      console.log('🔵 [WebRTC] Offer 생성 시작');
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      console.log('🔵 [WebRTC] Offer 생성 완료:', offer.type);
      
      await this.peerConnection.setLocalDescription(offer);
      console.log('🔵 [WebRTC] Local Description 설정 완료');
      
      await videoCall.sendOffer(this.callId, this.currentUserId, offer);
      console.log('✅ [WebRTC] Offer 전송 완료');
      
      return offer;
    } catch (error) {
      console.error('❌ [WebRTC] Offer 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Answer 생성 (수신자)
   */
  async createAnswer(offerSdp) {
    try {
      console.log('🔵 [WebRTC] Answer 생성 시작');
      console.log('🔵 [WebRTC] PeerConnection 현재 상태:', this.peerConnection.signalingState);
      console.log('🔵 [WebRTC] Remote Offer 수신:', offerSdp.type);

      // PeerConnection 상태 검증
      if (this.peerConnection.signalingState !== 'stable') {
        console.warn('⚠️ [WebRTC] Answer 생성 중단 - 잘못된 상태:', this.peerConnection.signalingState);
        console.warn('   (Answer는 stable 상태에서만 생성 가능)');
        return null;
      }

      // 이미 remoteDescription이 설정되어 있다면 중복 처리 방지
      if (this.peerConnection.remoteDescription) {
        console.warn('⚠️ [WebRTC] Answer 생성 중단 - 이미 remoteDescription이 설정됨');
        console.warn('   현재 상태:', this.peerConnection.signalingState);
        return null;
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerSdp)
      );
      console.log('🔵 [WebRTC] Remote Description 설정 완료');

      // setRemoteDescription 후 상태 확인
      console.log('🔵 [WebRTC] Remote Description 설정 후 상태:', this.peerConnection.signalingState);

      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      console.log('🔵 [WebRTC] Answer 생성 완료:', answer.type);

      await this.peerConnection.setLocalDescription(answer);
      console.log('🔵 [WebRTC] Local Description 설정 완료');

      await videoCall.sendAnswer(this.callId, this.currentUserId, answer);
      console.log('✅ [WebRTC] Answer 전송 완료');

      // 큐에 저장된 ICE Candidate 처리
      await this.processPendingIceCandidates();

      return answer;
    } catch (error) {
      console.error('❌ [WebRTC] Answer 생성 실패:', error);
      console.error('   PeerConnection 상태:', this.peerConnection.signalingState);
      console.error('   remoteDescription 존재:', !!this.peerConnection.remoteDescription);
      console.error('   localDescription 존재:', !!this.peerConnection.localDescription);
      
      // 상태 충돌 에러인 경우 무시
      if (error.name === 'InvalidStateError') {
        console.warn('⚠️ [WebRTC] 상태 충돌로 인한 Answer 생성 실패 - 무시');
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Answer 수신 처리 (발신자)
   */
  async handleAnswer(answerSdp) {
    try {
      console.log('🔵 [WebRTC] Answer 수신 처리 시작');
      console.log('🔵 [WebRTC] PeerConnection 현재 상태:', this.peerConnection.signalingState);
      console.log('🔵 [WebRTC] Remote Answer 수신:', answerSdp.type);

      // 이미 remoteDescription이 설정되어 있다면 중복 처리 방지
      if (this.peerConnection.remoteDescription) {
        console.warn('⚠️ [WebRTC] Answer 무시 - 이미 remoteDescription이 설정됨');
        console.warn('   현재 상태:', this.peerConnection.signalingState);
        return;
      }

      // Answer는 'have-local-offer' 상태에서만 처리 가능
      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.warn('⚠️ [WebRTC] Answer 무시 - 잘못된 상태:', this.peerConnection.signalingState);
        console.warn('   (Answer는 have-local-offer 상태에서만 처리 가능)');
        return;
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answerSdp)
      );

      console.log('✅ [WebRTC] Answer 처리 완료 - PeerConnection 연결 시작');
      console.log('✅ [WebRTC] 새로운 상태:', this.peerConnection.signalingState);

      // 큐에 저장된 ICE Candidate 처리
      await this.processPendingIceCandidates();
    } catch (error) {
      console.error('❌ [WebRTC] Answer 처리 실패:', error);
      console.error('   상태:', this.peerConnection.signalingState);
      console.error('   remoteDescription 존재:', !!this.peerConnection.remoteDescription);
      
      // 이미 처리된 Answer인 경우 무시
      if (error.name === 'InvalidStateError' && this.peerConnection.remoteDescription) {
        console.warn('⚠️ [WebRTC] 이미 처리된 Answer - 무시');
        return;
      }
      
      // 다른 에러는 다시 throw
      throw error;
    }
  }

  /**
   * ICE Candidate 수신 처리
   */
  async handleIceCandidate(candidate) {
    try {
      console.log('🔵 [WebRTC] ICE Candidate 수신:', candidate.candidate);

      // remoteDescription이 아직 설정되지 않았다면 큐에 저장
      if (!this.peerConnection.remoteDescription) {
        console.log('⏳ [WebRTC] remoteDescription 없음 - ICE Candidate를 큐에 저장');
        this.pendingIceCandidates.push(candidate);
        console.log(`📦 [WebRTC] 큐에 저장된 ICE Candidate 개수: ${this.pendingIceCandidates.length}`);
        return;
      }

      // remoteDescription이 있으면 바로 추가
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );

      console.log('✅ [WebRTC] ICE Candidate 추가 완료');
    } catch (error) {
      console.error('❌ [WebRTC] ICE Candidate 처리 실패:', error);
      // 에러를 throw하지 않고 로그만 남김 (다른 candidate로 연결 가능)
    }
  }

  /**
   * 큐에 저장된 ICE Candidate 처리
   */
  async processPendingIceCandidates() {
    if (this.pendingIceCandidates.length === 0) {
      console.log('📦 [WebRTC] 큐에 저장된 ICE Candidate 없음');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 [WebRTC] 큐에 저장된 ICE Candidate 처리 시작: ${this.pendingIceCandidates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let successCount = 0;
    let failCount = 0;

    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        successCount++;
        console.log(`✅ [WebRTC] 큐 ICE Candidate 추가 성공 (${successCount}/${this.pendingIceCandidates.length})`);
      } catch (error) {
        failCount++;
        console.warn(`⚠️ [WebRTC] 큐 ICE Candidate 추가 실패 (${failCount}개):`, error.message);
        // 실패해도 계속 진행 (다른 candidate로 연결 가능)
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ [WebRTC] 큐 처리 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 큐 비우기
    this.pendingIceCandidates = [];
  }

  /**
   * 시그널링 구독 시작
   */
  async startSignaling(callbacks) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [WebRTC.startSignaling] 시그널링 구독 시작');
    console.log('🔵 [WebRTC.startSignaling] Call ID:', this.callId);
    console.log('🔵 [WebRTC.startSignaling] Current User ID:', this.currentUserId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 기존 시그널 먼저 처리 (수신자가 늦게 진입한 경우)
    const { data: existingSignals } = await videoCall.getExistingSignals(
      this.callId,
      this.currentUserId
    );

    if (existingSignals && existingSignals.length > 0) {
      console.log('🔵 [WebRTC.startSignaling] 기존 시그널 처리:', existingSignals.length, '개');

      for (const signal of existingSignals) {
        const { signal_type, signal_data } = signal;

        try {
          switch (signal_type) {
            case 'offer':
              console.log('📞 [WebRTC.startSignaling] 기존 Offer 처리');
              await this.createAnswer(signal_data);
              callbacks.onOffer?.(signal_data);
              break;
            case 'answer':
              console.log('✅ [WebRTC.startSignaling] 기존 Answer 처리');
              await this.handleAnswer(signal_data);
              callbacks.onAnswer?.(signal_data);
              break;
            case 'ice-candidate':
              console.log('🧊 [WebRTC.startSignaling] 기존 ICE Candidate 처리');
              await this.handleIceCandidate(signal_data.candidate);
              break;
            case 'video-toggle':
              console.log('📹 [WebRTC.startSignaling] 기존 비디오 토글 처리:', signal_data.enabled);
              callbacks.onVideoToggle?.(signal_data.enabled);
              break;
            case 'call-end':
              console.log('☎️ [WebRTC.startSignaling] 기존 통화 종료 처리');
              callbacks.onCallEnd?.();
              break;
            default:
              console.warn('⚠️ [WebRTC.startSignaling] 알 수 없는 시그널 타입:', signal_type);
          }
        } catch (error) {
          console.error('❌ [WebRTC.startSignaling] 기존 시그널 처리 실패:', error);
        }
      }
    }

    // Realtime 구독 시작
    this.signalChannel = videoCall.subscribeToSignals(
      this.callId,
      this.currentUserId,
      {
        onOffer: async (offerSdp) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📞 [WebRTC.onOffer] Offer 수신!');
          console.log('   Offer SDP:', offerSdp);
          console.log('   현재 PeerConnection 상태:', this.peerConnection?.signalingState);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          try {
            const answer = await this.createAnswer(offerSdp);
            if (answer) {
              callbacks.onOffer?.(offerSdp);
              console.log('✅ [WebRTC.onOffer] Answer 생성 및 전송 완료');
            } else {
              console.warn('⚠️ [WebRTC.onOffer] Answer 생성 건너뛰기 - 상태 충돌 또는 중복 처리');
            }
          } catch (error) {
            console.error('❌ [WebRTC.onOffer] Answer 생성 실패:', error);
            // 에러가 발생해도 콜백은 호출 (UI 업데이트를 위해)
            callbacks.onOffer?.(offerSdp);
          }
        },
        onAnswer: async (answerSdp) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ [WebRTC.onAnswer] Answer 수신!');
          console.log('   Answer SDP:', answerSdp);
          console.log('   현재 상태:', this.peerConnection?.signalingState);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          try {
            await this.handleAnswer(answerSdp);
            callbacks.onAnswer?.(answerSdp);
            console.log('✅ [WebRTC.onAnswer] Answer 처리 완료 - 연결 시작!');
          } catch (error) {
            console.error('❌ [WebRTC.onAnswer] Answer 처리 실패:', error);
            // 에러가 발생해도 콜백은 호출 (UI 업데이트를 위해)
            callbacks.onAnswer?.(answerSdp);
          }
        },
        onIceCandidate: async (candidate) => {
          console.log('🧊 [WebRTC.onIceCandidate] ICE Candidate 수신');

          try {
            await this.handleIceCandidate(candidate);
            console.log('✅ [WebRTC.onIceCandidate] ICE Candidate 추가 완료');
          } catch (error) {
            console.error('❌ [WebRTC.onIceCandidate] ICE Candidate 처리 실패:', error);
          }
        },
        onVideoToggle: (enabled) => {
          console.log('📹 [WebRTC.onVideoToggle] 상대방 비디오 상태 변경:', enabled);
          callbacks.onVideoToggle?.(enabled);
        },
        onCallEnd: () => {
          console.log('☎️ [WebRTC.onCallEnd] 상대방이 통화 종료');
          callbacks.onCallEnd?.();
        }
      }
    );

    console.log('✅ [WebRTC.startSignaling] 시그널링 구독 완료');
  }

  /**
   * 통화 종료 및 리소스 정리
   */
  async cleanup() {
    console.log('🔵 [WebRTCManager] cleanup 시작');

    // ICE Candidate 큐 비우기
    if (this.pendingIceCandidates && this.pendingIceCandidates.length > 0) {
      console.log(`🔵 [WebRTCManager] ICE Candidate 큐 비우기: ${this.pendingIceCandidates.length}개`);
      this.pendingIceCandidates = [];
    }

    // 로컬 스트림 중지
    if (this.localStream) {
      console.log('🔵 [WebRTCManager] 로컬 스트림 중지');
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🔵 [WebRTCManager] Track 중지:', track.kind);
      });
      this.localStream = null;
    }

    // 원격 스트림 정리
    if (this.remoteStream) {
      console.log('🔵 [WebRTCManager] 원격 스트림 정리');
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // PeerConnection 종료
    if (this.peerConnection) {
      console.log('🔵 [WebRTCManager] PeerConnection 종료');
      console.log('   현재 상태:', this.peerConnection.connectionState);
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 시그널링 구독 해제 (Realtime)
    if (this.signalChannel) {
      console.log('🔵 [WebRTCManager] 시그널링 구독 해제');
      try {
        await supabase.removeChannel(this.signalChannel);
      } catch (error) {
        console.warn('⚠️ [WebRTCManager] 시그널링 구독 해제 실패:', error);
      }
      this.signalChannel = null;
    }

    // 상태 구독 해제
    if (this.statusChannel) {
      console.log('🔵 [WebRTCManager] 상태 구독 해제');
      try {
        await supabase.removeChannel(this.statusChannel);
      } catch (error) {
        console.warn('⚠️ [WebRTCManager] 상태 구독 해제 실패:', error);
      }
      this.statusChannel = null;
    }

    this.remoteStream = null;
    console.log('✅ [WebRTCManager] cleanup 완료');
  }

  /**
   * 오디오 토글
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * 강제 정리 (모든 리소스 즉시 정리)
   */
  forceCleanup() {
    console.log('🔵 [WebRTCManager] 강제 정리 시작');

    // ICE Candidate 큐 비우기
    this.pendingIceCandidates = [];

    // 즉시 모든 리소스 정리
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalChannel) {
      supabase.removeChannel(this.signalChannel);
      this.signalChannel = null;
    }

    if (this.statusChannel) {
      supabase.removeChannel(this.statusChannel);
      this.statusChannel = null;
    }

    this.remoteStream = null;
    console.log('✅ [WebRTCManager] 강제 정리 완료');
  }

  /**
   * 비디오 토글
   */
  async toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });

      // 상대방에게 비디오 상태 전송
      await videoCall.sendVideoToggle(this.callId, this.currentUserId, enabled);
      console.log('✅ [WebRTC] 비디오 상태 변경 및 전송 완료:', enabled);
    }
  }
}
