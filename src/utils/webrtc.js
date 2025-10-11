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
      const { data, error } = await supabase
        .from('video_calls')
        .select('*, caller:caller_id(id, nickname, email), receiver:receiver_id(id, nickname, email)')
        .eq('id', callId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('통화 정보 조회 에러:', error);
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
   * 시그널링 메시지 실시간 구독
   */
  subscribeToSignals: (callId, callbacks) => {
    const channel = supabase
      .channel(`call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `call_id=eq.${callId}`
        },
        (payload) => {
          const { signal_type, signal_data, sender_id } = payload.new;

          switch (signal_type) {
            case 'offer':
              callbacks.onOffer?.(signal_data.sdp, sender_id);
              break;
            case 'answer':
              callbacks.onAnswer?.(signal_data.sdp, sender_id);
              break;
            case 'ice-candidate':
              callbacks.onIceCandidate?.(signal_data.candidate, sender_id);
              break;
            default:
              console.warn('알 수 없는 시그널 타입:', signal_type);
          }
        }
      )
      .subscribe();

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
    console.log('🔵 [WebRTC] 수신 통화 구독 시작:', userId);

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
          console.log('🔵 [WebRTC] 수신 통화 감지:', payload);

          // pending 상태의 통화만 처리
          if (payload.new.status !== 'pending') {
            console.log('⚠️ [WebRTC] pending 상태가 아님, 무시:', payload.new.status);
            return;
          }

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
          console.log('✅ [WebRTC] 수신 통화 구독 완료');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [WebRTC] 채널 에러');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [WebRTC] 구독 타임아웃');
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
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // 로컬 스트림 추가
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // 원격 스트림 수신
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      onRemoteStream?.(this.remoteStream);
    };

    // ICE Candidate 이벤트
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoCall.sendIceCandidate(
          this.callId,
          this.currentUserId,
          event.candidate
        );
      }
    };

    // 연결 상태 변경
    this.peerConnection.onconnectionstatechange = () => {
      console.log('연결 상태:', this.peerConnection.connectionState);
      onConnectionStateChange?.(this.peerConnection.connectionState);
    };

    return this.peerConnection;
  }

  /**
   * Offer 생성 (발신자)
   */
  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      await videoCall.sendOffer(this.callId, this.currentUserId, offer);
      return offer;
    } catch (error) {
      console.error('Offer 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Answer 생성 (수신자)
   */
  async createAnswer(offerSdp) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerSdp)
      );
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      await videoCall.sendAnswer(this.callId, this.currentUserId, answer);
      return answer;
    } catch (error) {
      console.error('Answer 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Answer 수신 처리 (발신자)
   */
  async handleAnswer(answerSdp) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answerSdp)
      );
    } catch (error) {
      console.error('Answer 처리 실패:', error);
      throw error;
    }
  }

  /**
   * ICE Candidate 수신 처리
   */
  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('ICE Candidate 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 시그널링 구독 시작
   */
  startSignaling(callbacks) {
    this.signalChannel = videoCall.subscribeToSignals(this.callId, {
      onOffer: async (offerSdp, senderId) => {
        if (senderId !== this.currentUserId) {
          await this.createAnswer(offerSdp);
          callbacks.onOffer?.(offerSdp);
        }
      },
      onAnswer: async (answerSdp, senderId) => {
        if (senderId !== this.currentUserId) {
          await this.handleAnswer(answerSdp);
          callbacks.onAnswer?.(answerSdp);
        }
      },
      onIceCandidate: async (candidate, senderId) => {
        if (senderId !== this.currentUserId) {
          await this.handleIceCandidate(candidate);
        }
      }
    });
  }

  /**
   * 통화 종료 및 리소스 정리
   */
  async cleanup() {
    // 로컬 스트림 중지
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // PeerConnection 종료
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // Supabase 채널 구독 해제
    if (this.signalChannel) {
      await supabase.removeChannel(this.signalChannel);
    }
    if (this.statusChannel) {
      await supabase.removeChannel(this.statusChannel);
    }

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
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
