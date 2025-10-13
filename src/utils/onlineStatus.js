import { supabase } from './supabase';

class OnlineStatusManager {
  constructor() {
    this.currentUserId = null;
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = 30000; // 30초마다 heartbeat
    this.lastHeartbeat = null;
    this.onlineUsers = new Map(); // user_id -> { is_online, last_seen }
    this.subscriptions = new Map(); // user_id -> subscription
    this.callbacks = new Map(); // callbackId -> callback function
    this.isOnline = false;
  }

  // 초기화
  async initialize(userId) {
    // 이미 같은 사용자로 초기화되어 있으면 재초기화하지 않음
    if (this.currentUserId === userId && this.isOnline) {
      console.log('🔵 OnlineStatusManager 이미 초기화됨:', userId);
      return;
    }
    
    // 다른 사용자로 초기화하려는 경우 기존 정리
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log('🔵 OnlineStatusManager 재초기화 - 기존 사용자 정리');
      await this.cleanup();
    }
    
    this.currentUserId = userId;
    console.log('🔵 OnlineStatusManager 초기화:', userId);
    
    // 현재 사용자를 온라인으로 설정
    await this.setOnlineStatus(true);
    
    // Heartbeat 시작
    this.startHeartbeat();
    
    // 다른 사용자들의 온라인 상태 구독
    await this.subscribeToOnlineStatus();
    
    this.isOnline = true;
  }

  // 정리
  async cleanup() {
    // 이미 정리된 상태면 스킵
    if (!this.currentUserId && !this.isOnline) {
      return;
    }
    
    console.log('🔵 OnlineStatusManager 정리 시작');
    
    // Heartbeat 중지 (먼저 중지해서 추가 요청 방지)
    this.stopHeartbeat();
    
    if (this.currentUserId) {
      // 현재 사용자를 오프라인으로 설정
      await this.setOnlineStatus(false);
    }
    
    // 구독 해제
    this.unsubscribeAll();
    
    // 상태 초기화
    this.onlineUsers.clear();
    this.callbacks.clear();
    this.currentUserId = null;
    this.isOnline = false;
    
    console.log('✅ OnlineStatusManager 정리 완료');
  }

  // 온라인 상태 설정
  async setOnlineStatus(isOnline) {
    if (!this.currentUserId) return;

    try {
      const { error } = await supabase
        .from('user_online_status')
        .upsert(
          {
            user_id: this.currentUserId,
            is_online: isOnline,
            last_seen: new Date().toISOString()
          },
          {
            onConflict: 'user_id', // user_id가 충돌하면 UPDATE
            ignoreDuplicates: false // 중복 시 UPDATE 수행
          }
        );

      if (error) {
        // 중복 키 오류(23505)는 무시 (이미 존재하는 레코드)
        if (error.code === '23505') {
          console.warn('⚠️ 온라인 상태 레코드 이미 존재, 무시:', this.currentUserId);
          return;
        }
        console.error('❌ 온라인 상태 설정 오류:', error);
        return;
      }

      this.lastHeartbeat = new Date();
      // console.log(`✅ 사용자 온라인 상태 업데이트: ${isOnline ? '온라인' : '오프라인'}`);
    } catch (error) {
      console.error('❌ 온라인 상태 설정 예외:', error);
    }
  }

  // Heartbeat 시작
  startHeartbeat() {
    this.stopHeartbeat(); // 기존 interval 정리
    
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentUserId && this.isOnline) {
        await this.setOnlineStatus(true);
      }
    }, this.heartbeatIntervalMs);
    
    console.log('🔵 Heartbeat 시작 (30초 간격)');
  }

  // Heartbeat 중지
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('🔵 Heartbeat 중지');
    }
  }

  // 온라인 상태 구독
  async subscribeToOnlineStatus() {
    try {
      const { data, error } = await supabase
        .channel('user_online_status_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_online_status'
          },
          (payload) => {
            this.handleOnlineStatusChange(payload);
          }
        )
        .subscribe();

      if (error) {
        console.error('❌ 온라인 상태 구독 오류:', error);
        return;
      }

      console.log('✅ 온라인 상태 실시간 구독 시작');
      
      // 초기 온라인 사용자 목록 로드
      await this.loadInitialOnlineUsers();
    } catch (error) {
      console.error('❌ 온라인 상태 구독 예외:', error);
    }
  }

  // 초기 온라인 사용자 목록 로드
  async loadInitialOnlineUsers() {
    try {
      const { data, error } = await supabase
        .from('user_online_status')
        .select('user_id, is_online, last_seen')
        .eq('is_online', true);

      if (error) {
        console.error('❌ 온라인 사용자 목록 로드 오류:', error);
        return;
      }

      // 온라인 사용자 목록 업데이트
      data.forEach(status => {
        this.onlineUsers.set(status.user_id, {
          is_online: status.is_online,
          last_seen: status.last_seen
        });
      });

      console.log(`✅ 초기 온라인 사용자 로드: ${data.length}명`);
      this.notifyCallbacks();
    } catch (error) {
      console.error('❌ 초기 온라인 사용자 로드 예외:', error);
    }
  }

  // 온라인 상태 변경 처리
  handleOnlineStatusChange(payload) {
    const { user_id, is_online, last_seen } = payload.new || payload.old || {};
    
    if (!user_id) return;

    // 현재 사용자는 제외 (자기 자신의 상태는 별도 관리)
    if (user_id === this.currentUserId) return;

    console.log(`🔵 사용자 온라인 상태 변경: ${user_id} -> ${is_online ? '온라인' : '오프라인'}`);

    if (payload.eventType === 'DELETE') {
      this.onlineUsers.delete(user_id);
    } else {
      this.onlineUsers.set(user_id, {
        is_online: is_online,
        last_seen: last_seen
      });
    }

    this.notifyCallbacks();
  }

  // 특정 사용자의 온라인 상태 조회
  getUserOnlineStatus(userId) {
    if (userId === this.currentUserId) {
      return { is_online: this.isOnline, last_seen: this.lastHeartbeat };
    }
    
    return this.onlineUsers.get(userId) || { is_online: false, last_seen: null };
  }

  // 상태 변경 콜백 등록
  onStatusChange(callback) {
    const callbackId = Date.now() + Math.random();
    this.callbacks.set(callbackId, callback);
    
    // 등록 즉시 현재 상태 전달
    callback(Array.from(this.onlineUsers.entries()));
    
    return () => {
      this.callbacks.delete(callbackId);
    };
  }

  // 콜백들에게 상태 변경 알림
  notifyCallbacks() {
    const statusEntries = Array.from(this.onlineUsers.entries());
    this.callbacks.forEach(callback => {
      try {
        callback(statusEntries);
      } catch (error) {
        console.error('❌ 상태 변경 콜백 오류:', error);
      }
    });
  }

  // 모든 구독 해제
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, userId) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    console.log('🔵 모든 구독 해제 완료');
  }

  // 페이지 가시성 변경 처리
  handleVisibilityChange() {
    if (document.hidden) {
      // 페이지가 숨겨지면 오프라인으로 설정
      this.setOnlineStatus(false);
    } else {
      // 페이지가 다시 보이면 온라인으로 설정
      this.setOnlineStatus(true);
      this.startHeartbeat();
    }
  }

  // 페이지 언로드 시 오프라인으로 설정
  handleBeforeUnload() {
    // navigator.sendBeacon을 사용하여 확실히 전송
    if (this.currentUserId && navigator.sendBeacon) {
      const data = JSON.stringify({
        user_id: this.currentUserId,
        is_online: false,
        last_seen: new Date().toISOString()
      });
      
      // Supabase REST API로 직접 전송 (비동기이므로 sendBeacon 사용)
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_online_status`,
        data
      );
    }
  }
}

// 싱글톤 인스턴스
export const onlineStatusManager = new OnlineStatusManager();

// 페이지 이벤트 리스너 설정
if (typeof window !== 'undefined') {
  // 페이지 가시성 변경 감지
  document.addEventListener('visibilitychange', () => {
    onlineStatusManager.handleVisibilityChange();
  });

  // 페이지 언로드 감지
  window.addEventListener('beforeunload', () => {
    onlineStatusManager.handleBeforeUnload();
  });
}

export default onlineStatusManager;
