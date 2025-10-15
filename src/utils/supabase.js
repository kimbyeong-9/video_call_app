import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
    debug: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    },
    fetch: (url, options = {}) => {
      // QUIC 프로토콜 에러 방지를 위해 HTTP/1.1 강제 사용
      return fetch(url, {
        ...options,
        // 재시도 로직 추가
        signal: options.signal || AbortSignal.timeout(15000), // 15초 타임아웃
      }).catch(async (error) => {
        // ERR_QUIC_PROTOCOL_ERROR 시 재시도
        if (error.message.includes('QUIC') || error.message.includes('Failed to fetch')) {
          console.warn('⚠️ 네트워크 에러 발생, 재시도 중...', error.message);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          return fetch(url, options);
        }
        throw error;
      });
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

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

      // 2. users 테이블에 추가 정보 저장
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
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // Refresh Token 오류 시 자동 복구
      if (error && error.message?.includes('refresh_token_not_found')) {
        console.warn('⚠️ Refresh Token 오류 감지, 세션 정리 중...');
        await supabase.auth.signOut();
        localStorage.removeItem('sb-auth-token');
        return { user: null, error: new Error('세션이 만료되었습니다. 다시 로그인해주세요.') };
      }
      
      return { user, error };
    } catch (error) {
      console.error('사용자 정보 조회 에러:', error);
      return { user: null, error };
    }
  },

  // Google 로그인
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    return { data, error };
  },

  // 비밀번호 재설정 이메일 발송
  sendPasswordResetEmail: async (email) => {
    try {
      // 개발/프로덕션 환경에 따라 redirectTo URL 설정
      const redirectTo = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/reset-password'
        : `${window.location.origin}/reset-password`;

      console.log('🔵 비밀번호 재설정 redirectTo:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo
      });

      if (error) {
        console.error('비밀번호 재설정 이메일 발송 에러:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('비밀번호 재설정 이메일 발송 예외:', error);
      return { data: null, error };
    }
  },

  // 새 비밀번호로 변경
  updatePassword: async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('비밀번호 변경 에러:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('비밀번호 변경 예외:', error);
      return { data: null, error };
    }
  },

  // 이메일로 사용자 찾기 (아이디 찾기용)
  findUserByEmail: async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, nickname')
        .eq('email', email)
        .single();

      if (error) {
        console.error('사용자 조회 에러:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('사용자 조회 예외:', error);
      return { data: null, error };
    }
  },
};

// Google 로그인 후 사용자 정보를 users 테이블에 저장
export const saveUserToDatabase = async (user, event) => {
  try {
    // 첫 로그인 시에만 저장 (SIGNED_UP 이벤트일 때)
    if (event !== 'SIGNED_UP') {
      console.log('첫 로그인이 아닙니다. 저장하지 않습니다.');
      return;
    }

    // 먼저 사용자가 이미 존재하는지 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      // 이미 존재하면 아무것도 하지 않음
      console.log('사용자가 이미 존재합니다:', user.id);
      return;
    }

    // Google 소셜 로그인 사용자를 위한 닉네임 생성
    const baseNickname = user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
    let nickname = `google-${baseNickname}`;

    // 닉네임 중복 확인 및 처리
    let attempts = 0;
    let isUnique = false;
    
    while (!isUnique && attempts < 10) {
      const { data: duplicateCheck } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', nickname)
        .maybeSingle();

      if (!duplicateCheck) {
        // 중복이 없으면 사용 가능
        isUnique = true;
      } else {
        // 중복이 있으면 숫자 추가
        attempts++;
        nickname = `google-${baseNickname}${attempts}`;
      }
    }

    // 새 사용자 삽입
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        nickname: nickname
      });

    if (error) {
      console.error('사용자 정보 저장 에러:', error);
    } else {
      console.log('새 Google 사용자 저장 완료:', user.id, '닉네임:', nickname);
    }
  } catch (error) {
    console.error('사용자 정보 저장 에러:', error);
  }
};

// Auth 상태 변경 감지
export const handleAuthStateChange = async (callback) => {
  try {
    const { data } = await supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth 이벤트:', event);  // 이벤트 로깅
      
      // Refresh Token 오류 처리
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('⚠️ 토큰 갱신 실패, 로그아웃 처리');
        await supabase.auth.signOut();
        localStorage.removeItem('sb-auth-token');
        return;
      }
      
      // SIGNED_UP 이벤트 시에만 users 테이블에 저장
      if (event === 'SIGNED_UP' && session?.user) {
        // Google 로그인 시 users 테이블에 사용자 정보 저장
        await saveUserToDatabase(session.user, event);
      }
      callback(event, session);
    });
    return data;
  } catch (error) {
    console.error('Auth 상태 변경 감지 에러:', error);
    return { subscription: { unsubscribe: () => {} } };
  }
};

// 프로필 관련 유틸리티
export const profile = {
  // 프로필 정보 가져오기
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  // 프로필 업데이트
  updateProfile: async (userId, profileData) => {
    try {
      console.log('🔵 updateProfile 함수 시작:', { userId, profileData });
      
      const updateData = {
        nickname: profileData.nickname,
        bio: profileData.bio,
        interests: profileData.interests,
        profile_image: profileData.profile_image,
        gender: profileData.gender,
        location: profileData.location
      };
      
      console.log('🔵 업데이트할 데이터:', updateData);
      
      // 타임아웃 추가 (10초)
      const updatePromise = supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('업데이트 요청 타임아웃 (10초)')), 10000)
      );
      
      const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

      console.log('🔵 Supabase 응답:', { data, error });

      if (error) {
        console.error('❌ 프로필 업데이트 에러:', error);
        return { data: null, error };
      }

      // localStorage 업데이트
      console.log('🔵 localStorage 업데이트');
      localStorage.setItem('user', JSON.stringify(data));
      
      console.log('✅ 프로필 업데이트 성공');
      return { data, error: null };
    } catch (error) {
      console.error('❌ 프로필 업데이트 예외:', error);
      return { data: null, error };
    }
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (userId, file) => {
    try {
      console.log('🔵 이미지 업로드 시작:', { userId, fileName: file.name, fileSize: file.size });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      console.log('🔵 업로드 경로:', filePath);

      // Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      console.log('🔵 업로드 결과:', { uploadData, uploadError });

      if (uploadError) {
        console.error('❌ 이미지 업로드 에러:', uploadError);
        return { data: null, error: uploadError };
      }

      // Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('🔵 Public URL:', urlData.publicUrl);

      return { data: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('❌ 이미지 업로드 예외:', error);
      return { data: null, error };
    }
  }
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
