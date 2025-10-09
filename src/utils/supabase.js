import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth 관련 유틸리티 함수들
export const auth = {
  // 회원가입
  signUp: async (email, password, nickname) => {
    try {
      // 1. Supabase Auth로 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nickname: nickname
          }
        }
      });

      if (authError) {
        console.error('Auth 회원가입 에러:', authError);
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('사용자 생성에 실패했습니다.') };
      }

      // 2. 이메일 확인 처리 (개발 환경에서만 자동 확인)
      if (import.meta.env.DEV || import.meta.env.VITE_AUTO_CONFIRM_EMAIL === 'true') {
        await supabase.rpc('confirm_user_email', { user_email: email });
      }

      // 3. users 테이블에 추가 정보 저장
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            nickname
          }
        ])
        .select()
        .single();

      if (userError) {
        console.error('Users 테이블 저장 에러:', userError);
        return { error: userError };
      }

      return { data: { auth: authData, user: userData }, error: null };
    } catch (error) {
      console.error('회원가입 에러:', error);
      return { error };
    }
  },

  // 로그인
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 현재 사용자 가져오기
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },
};

// 실시간 구독 유틸리티
export const realtime = {
  // 채팅방 메시지 구독
  subscribeToMessages: (roomId, callback) => {
    return supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        }, 
        callback
      )
      .subscribe();
  },
};
