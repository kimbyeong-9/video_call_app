import { supabase } from './supabase';

/**
 * Live 페이지 실시간 Presence 관리
 * Supabase Realtime Presence를 사용하여 현재 Live 페이지에 접속 중인 유저만 추적
 */
export class LivePresenceManager {
  constructor() {
    this.channel = null;
    this.currentUserId = null;
    this.presenceState = new Map(); // userId -> userInfo
    this.listeners = new Set();
  }

  /**
   * Live 페이지에 참여 (Presence 채널 구독)
   */
  async join(userId, userInfo) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🟢 [LivePresence] Live 페이지 참여 시작');
      console.log('🟢 User ID:', userId);
      console.log('🟢 User Info:', userInfo);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      this.currentUserId = userId;

      // 기존 채널이 있으면 정리
      if (this.channel) {
        await this.leave();
      }

      // 'live-room' 채널 생성 및 구독
      this.channel = supabase.channel('live-room', {
        config: {
          presence: {
            key: userId, // 사용자 ID를 키로 사용
          },
        },
      });

      // Presence 상태 동기화 이벤트 리스너
      this.channel
        .on('presence', { event: 'sync' }, () => {
          console.log('🔵 [LivePresence] Presence 동기화');
          const state = this.channel.presenceState();
          console.log('🔵 [LivePresence] 현재 접속자 상태:', state);

          // Map으로 변환
          this.presenceState.clear();
          Object.keys(state).forEach(userId => {
            const presences = state[userId];
            if (presences && presences.length > 0) {
              // 가장 최근 presence 정보 사용
              const latestPresence = presences[0];
              this.presenceState.set(userId, latestPresence);
            }
          });

          console.log('✅ [LivePresence] 접속 중인 유저 수:', this.presenceState.size);

          // 모든 리스너에게 알림
          this.notifyListeners();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 [LivePresence] 새 유저 입장:', key);
          console.log('   정보:', newPresences);
          // sync 이벤트에서 처리하므로 여기선 로그만
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 [LivePresence] 유저 퇴장:', key);
          console.log('   정보:', leftPresences);
          // sync 이벤트에서 처리하므로 여기선 로그만
        });

      // 채널 구독
      const status = await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [LivePresence] 채널 구독 완료');

          // Presence 상태 추적 시작
          const trackStatus = await this.channel.track({
            user_id: userId,
            nickname: userInfo.nickname,
            email: userInfo.email,
            profile_image: userInfo.profile_image,
            bio: userInfo.bio,
            interests: userInfo.interests || [],
            online_at: new Date().toISOString(),
          });

          console.log('✅ [LivePresence] Presence 추적 시작:', trackStatus);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [LivePresence] 채널 에러');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [LivePresence] 구독 타임아웃');
        }
      });

      return true;
    } catch (error) {
      console.error('❌ [LivePresence] 참여 실패:', error);
      return false;
    }
  }

  /**
   * Live 페이지에서 나가기 (Presence 해제)
   */
  async leave() {
    try {
      console.log('🔵 [LivePresence] Live 페이지 퇴장 시작');

      if (this.channel) {
        // Presence 추적 중지
        await this.channel.untrack();
        console.log('✅ [LivePresence] Presence 추적 중지');

        // 채널 구독 해제
        await supabase.removeChannel(this.channel);
        console.log('✅ [LivePresence] 채널 구독 해제');

        this.channel = null;
      }

      this.currentUserId = null;
      this.presenceState.clear();
      console.log('✅ [LivePresence] Live 페이지 퇴장 완료');
    } catch (error) {
      console.error('❌ [LivePresence] 퇴장 실패:', error);
    }
  }

  /**
   * 현재 접속 중인 유저 목록 가져오기
   */
  getOnlineUsers() {
    const users = [];
    this.presenceState.forEach((presence, userId) => {
      // 자기 자신은 제외
      if (userId !== this.currentUserId) {
        users.push({
          id: presence.user_id,
          nickname: presence.nickname,
          email: presence.email,
          profile_image: presence.profile_image,
          bio: presence.bio || '안녕하세요!',
          interests: presence.interests || [],
          status: '온라인',
          statusType: 'online',
          online_at: presence.online_at,
        });
      }
    });

    return users;
  }

  /**
   * Presence 상태 변경 리스너 등록
   */
  onPresenceChange(callback) {
    this.listeners.add(callback);

    // 구독 해제 함수 반환
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 모든 리스너에게 상태 변경 알림
   */
  notifyListeners() {
    const users = this.getOnlineUsers();
    this.listeners.forEach(callback => {
      try {
        callback(users);
      } catch (error) {
        console.error('❌ [LivePresence] 리스너 실행 실패:', error);
      }
    });
  }

  /**
   * 특정 유저가 온라인인지 확인
   */
  isUserOnline(userId) {
    return this.presenceState.has(userId);
  }

  /**
   * 현재 접속자 수
   */
  getOnlineCount() {
    // 자기 자신 제외
    return Math.max(0, this.presenceState.size - 1);
  }
}

// 싱글톤 인스턴스
export const livePresenceManager = new LivePresenceManager();
