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
        profile_image: profileData.profile_image
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
