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
      const { data: callerData, error: callerError } = await supabase
        .from('users')
        .select('id, nickname, email, profile_image')
        .eq('id', callData.caller_id)
        .single();

      // 3단계: 수신자 정보 조회
      const { data: receiverData, error: receiverError } = await supabase
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
      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'offer',
          signal_data: { sdp: offerSdp }
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Offer 전송 에러:', error);
      return { data: null, error };
    }
  },

  /**
   * Answer 전송 (수신자)
   */
  sendAnswer: async (callId, senderId, answerSdp) => {
    try {
      const { data, error } = await supabase
        .from('webrtc_signals')
        .insert({
          call_id: callId,
          sender_id: senderId,
          signal_type: 'answer',
          signal_data: { sdp: answerSdp }
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Answer 전송 에러:', error);
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
   * 시그널링 메시지 폴링 방식으로 수신
   */
  subscribeToSignals: (callId, callbacks) => {
    console.log('🔵 [subscribeToSignals] 폴링 방식 시작, callId:', callId);
    
    let lastCheckedTime = new Date().toISOString();
    let pollingInterval = null;
    let isActive = true;

    const pollSignals = async () => {
      if (!isActive) return;

      try {
        const { data: signals, error } = await supabase
          .from('webrtc_signals')
          .select('*')
          .eq('call_id', callId)
          .gt('created_at', lastCheckedTime)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ [subscribeToSignals] 폴링 에러:', error);
          return;
        }

        if (signals && signals.length > 0) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎉 [subscribeToSignals] 새 신호 발견!', signals.length, '개');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          signals.forEach(signal => {
            console.log('📦 신호:', JSON.stringify(signal, null, 2));
            
            const { signal_type, signal_data, sender_id } = signal;

            switch (signal_type) {
              case 'offer':
                console.log('📞 [subscribeToSignals] Offer 신호 처리, sender_id:', sender_id);
                callbacks.onOffer?.(signal_data.sdp, sender_id);
                break;
              case 'answer':
                console.log('✅ [subscribeToSignals] Answer 신호 처리, sender_id:', sender_id);
                callbacks.onAnswer?.(signal_data.sdp, sender_id);
                break;
              case 'ice-candidate':
                console.log('🧊 [subscribeToSignals] ICE Candidate 신호 처리, sender_id:', sender_id);
                callbacks.onIceCandidate?.(signal_data.candidate, sender_id);
                break;
              default:
                console.warn('⚠️ [subscribeToSignals] 알 수 없는 시그널 타입:', signal_type);
            }

            lastCheckedTime = signal.created_at;
          });
        }
      } catch (error) {
        console.error('❌ [subscribeToSignals] 폴링 예외:', error);
      }
    };

    // 즉시 한 번 실행
    pollSignals();

    // 1초마다 폴링
    pollingInterval = setInterval(pollSignals, 1000);

    // 정리 함수를 반환
    return {
      unsubscribe: () => {
        console.log('🔵 [subscribeToSignals] 폴링 중지');
        isActive = false;
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      }
    };
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
    
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

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
      console.log('🎉 [WebRTC] 원격 스트림 수신!', event.streams.length, 'streams');
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      event.streams[0].getTracks().forEach(track => {
        console.log('🔵 [WebRTC] 원격 Track 추가:', track.kind, track.label);
        this.remoteStream.addTrack(track);
      });
      
      console.log('✅ [WebRTC] 원격 스트림 콜백 호출');
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
    };

    // 연결 상태 변경
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔵 [WebRTC] PeerConnection 상태:', this.peerConnection.connectionState);
      onConnectionStateChange?.(this.peerConnection.connectionState);
    };

    // 데이터 채널 상태 (디버깅용)
    this.peerConnection.ondatachannel = (event) => {
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
      console.log('🔵 [WebRTC] Remote Offer 수신:', offerSdp.type);
      
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerSdp)
      );
      console.log('🔵 [WebRTC] Remote Description 설정 완료');
      
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      console.log('🔵 [WebRTC] Answer 생성 완료:', answer.type);
      
      await this.peerConnection.setLocalDescription(answer);
      console.log('🔵 [WebRTC] Local Description 설정 완료');
      
      await videoCall.sendAnswer(this.callId, this.currentUserId, answer);
      console.log('✅ [WebRTC] Answer 전송 완료');
      
      return answer;
    } catch (error) {
      console.error('❌ [WebRTC] Answer 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Answer 수신 처리 (발신자)
   */
  async handleAnswer(answerSdp) {
    try {
      console.log('🔵 [WebRTC] Answer 수신 처리 시작');
      console.log('🔵 [WebRTC] Remote Answer 수신:', answerSdp.type);
      
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answerSdp)
      );
      
      console.log('✅ [WebRTC] Answer 처리 완료 - PeerConnection 연결 시작');
    } catch (error) {
      console.error('❌ [WebRTC] Answer 처리 실패:', error);
      throw error;
    }
  }

  /**
   * ICE Candidate 수신 처리
   */
  async handleIceCandidate(candidate) {
    try {
      console.log('🔵 [WebRTC] ICE Candidate 수신:', candidate.candidate);
      
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      
      console.log('✅ [WebRTC] ICE Candidate 추가 완료');
    } catch (error) {
      console.error('❌ [WebRTC] ICE Candidate 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 시그널링 구독 시작
   */
  startSignaling(callbacks) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [WebRTC.startSignaling] 시그널링 구독 시작');
    console.log('🔵 [WebRTC.startSignaling] Call ID:', this.callId);
    console.log('🔵 [WebRTC.startSignaling] Current User ID:', this.currentUserId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.signalChannel = videoCall.subscribeToSignals(this.callId, {
      onOffer: async (offerSdp, senderId) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📞 [WebRTC.onOffer] Offer 수신!');
        console.log('   Sender ID:', senderId);
        console.log('   Current User ID:', this.currentUserId);
        console.log('   같은 사용자?', senderId === this.currentUserId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (senderId !== this.currentUserId) {
          console.log('✅ [WebRTC.onOffer] 다른 사용자의 Offer - Answer 생성 시작');
          try {
            await this.createAnswer(offerSdp);
            callbacks.onOffer?.(offerSdp);
            console.log('✅ [WebRTC.onOffer] Answer 생성 및 전송 완료');
          } catch (error) {
            console.error('❌ [WebRTC.onOffer] Answer 생성 실패:', error);
          }
        } else {
          console.log('⚠️ [WebRTC.onOffer] 본인의 Offer - 무시');
        }
      },
      onAnswer: async (answerSdp, senderId) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [WebRTC.onAnswer] Answer 수신!');
        console.log('   Sender ID:', senderId);
        console.log('   Current User ID:', this.currentUserId);
        console.log('   같은 사용자?', senderId === this.currentUserId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (senderId !== this.currentUserId) {
          console.log('✅ [WebRTC.onAnswer] 다른 사용자의 Answer - 처리 시작');
          try {
            await this.handleAnswer(answerSdp);
            callbacks.onAnswer?.(answerSdp);
            console.log('✅ [WebRTC.onAnswer] Answer 처리 완료 - 연결 시작!');
          } catch (error) {
            console.error('❌ [WebRTC.onAnswer] Answer 처리 실패:', error);
          }
        } else {
          console.log('⚠️ [WebRTC.onAnswer] 본인의 Answer - 무시');
        }
      },
      onIceCandidate: async (candidate, senderId) => {
        console.log('🧊 [WebRTC.onIceCandidate] ICE Candidate 수신: sender=' + senderId + ', current=' + this.currentUserId);
        
        if (senderId !== this.currentUserId) {
          try {
            await this.handleIceCandidate(candidate);
          } catch (error) {
            console.error('❌ [WebRTC.onIceCandidate] ICE Candidate 처리 실패:', error);
          }
        }
      }
    });
    
    console.log('✅ [WebRTC.startSignaling] 시그널링 구독 완료');
  }

  /**
   * 통화 종료 및 리소스 정리
   */
  async cleanup() {
    console.log('🔵 [WebRTCManager] cleanup 시작');
    
    // 로컬 스트림 중지
    if (this.localStream) {
      console.log('🔵 [WebRTCManager] 로컬 스트림 중지');
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // PeerConnection 종료
    if (this.peerConnection) {
      console.log('🔵 [WebRTCManager] PeerConnection 종료');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 시그널링 구독 해제 (폴링 방식)
    if (this.signalChannel) {
      console.log('🔵 [WebRTCManager] 시그널링 폴링 중지');
      if (typeof this.signalChannel.unsubscribe === 'function') {
        this.signalChannel.unsubscribe();
      }
      this.signalChannel = null;
    }
    
    // 상태 구독 해제
    if (this.statusChannel) {
      console.log('🔵 [WebRTCManager] 상태 구독 해제');
      await supabase.removeChannel(this.statusChannel);
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
      if (typeof this.signalChannel.unsubscribe === 'function') {
        this.signalChannel.unsubscribe();
      }
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
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
}
