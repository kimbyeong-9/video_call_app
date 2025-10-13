import { supabase } from './supabase';

/**
 * 사용자 활동 상태 관리
 */
export const activeStatusManager = {
  intervalId: null,
  currentUserId: null,

  /**
   * 현재 사용자의 last_active_at 업데이트
   */
  async updateActiveStatus(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('❌ [ActiveStatus] 활동 상태 업데이트 실패:', error);
        return false;
      }

      console.log('✅ [ActiveStatus] 활동 상태 업데이트 완료');
      return true;
    } catch (error) {
      console.error('❌ [ActiveStatus] 활동 상태 업데이트 에러:', error);
      return false;
    }
  },

  /**
   * 주기적으로 활동 상태 업데이트 시작 (1분마다)
   */
  startTracking(userId) {
    if (!userId) {
      console.error('❌ [ActiveStatus] 유효하지 않은 사용자 ID');
      return;
    }

    // 이미 추적 중이면 중지
    this.stopTracking();

    this.currentUserId = userId;
    console.log('🔵 [ActiveStatus] 활동 추적 시작:', userId);

    // 즉시 한 번 업데이트
    this.updateActiveStatus(userId);

    // 1분마다 업데이트
    this.intervalId = setInterval(() => {
      this.updateActiveStatus(userId);
    }, 60000); // 60초 = 1분
  },

  /**
   * 활동 상태 업데이트 중지
   */
  stopTracking() {
    if (this.intervalId) {
      console.log('🔵 [ActiveStatus] 활동 추적 중지');
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.currentUserId = null;
    }
  },

  /**
   * 활성 사용자 목록 조회 (5분 이내 활동)
   */
  async getActiveUsers(currentUserId, minutesThreshold = 5) {
    try {
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesThreshold);

      console.log('🔵 [ActiveStatus] 활성 사용자 조회 시작');
      console.log('🔵 [ActiveStatus] 기준 시간:', thresholdTime.toISOString());

      const { data, error } = await supabase
        .from('users')
        .select('id, email, nickname, bio, interests, profile_image, last_active_at')
        .neq('id', currentUserId) // 자기 자신 제외
        .gte('last_active_at', thresholdTime.toISOString())
        .order('last_active_at', { ascending: false });

      if (error) {
        console.error('❌ [ActiveStatus] 활성 사용자 조회 실패:', error);
        return { data: [], error };
      }

      console.log('✅ [ActiveStatus] 활성 사용자 수:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ [ActiveStatus] 활성 사용자 조회 에러:', error);
      return { data: [], error };
    }
  },

  /**
   * 특정 사용자의 활성 상태 확인
   */
  async isUserActive(userId, minutesThreshold = 5) {
    try {
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesThreshold);

      const { data, error } = await supabase
        .from('users')
        .select('last_active_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      const lastActive = new Date(data.last_active_at);
      return lastActive >= thresholdTime;
    } catch (error) {
      console.error('❌ [ActiveStatus] 사용자 활성 상태 확인 에러:', error);
      return false;
    }
  }
};

// 페이지 이동 시 활동 상태 업데이트를 위한 헬퍼
export const updateActiveOnNavigation = () => {
  const currentUserStr = localStorage.getItem('currentUser');
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser?.id) {
        activeStatusManager.updateActiveStatus(currentUser.id);
      }
    } catch (error) {
      console.error('❌ [ActiveStatus] 네비게이션 업데이트 실패:', error);
    }
  }
};
