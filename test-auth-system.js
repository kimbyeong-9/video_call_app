// 인증 시스템 종합 테스트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://copqtgkymbhdayglatqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcHF0Z2t5bWJoZGF5Z2xhdHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDY4OTEsImV4cCI6MjA3NTQ4Mjg5MX0.pDK4IgMuHIjJ8FXsfgm666PH29lGa-FoJJQlmLu0G2E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthSystem() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 인증 시스템 종합 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. RLS 정책 확인
  console.log('1️⃣ RLS 정책 확인');
  console.log('─────────────────────────────────────────');

  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('pg_get_tabledef', { table_name: 'users' })
    .then(() => supabase.from('pg_tables').select('tablename, rowsecurity').eq('tablename', 'users'))
    .catch(() => null);

  // 간단한 테이블 정보 조회
  try {
    const { data: tableInfo } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tableInfo) {
      console.log('✅ users 테이블 SELECT 권한: OK');
    }
  } catch (e) {
    console.log('❌ users 테이블 SELECT 권한: FAILED');
    console.log('   오류:', e.message);
  }

  console.log('');

  // 2. 닉네임 중복 확인 테스트
  console.log('2️⃣ 닉네임 중복 확인 테스트');
  console.log('─────────────────────────────────────────');

  try {
    const { data: nicknameCheck, error: nicknameError } = await supabase
      .from('users')
      .select('nickname')
      .eq('nickname', '김병구')
      .single();

    if (nicknameError && nicknameError.code === 'PGRST116') {
      console.log('✅ 닉네임 없음 (중복 확인 정상 작동)');
    } else if (nicknameCheck) {
      console.log('✅ 닉네임 발견:', nicknameCheck.nickname);
    } else if (nicknameError) {
      console.log('❌ 닉네임 조회 실패:', nicknameError.message);
    }
  } catch (e) {
    console.log('❌ 닉네임 중복 확인 에러:', e.message);
  }

  console.log('');

  // 3. 회원가입 테스트 (테스트 계정)
  console.log('3️⃣ 회원가입 테스트');
  console.log('─────────────────────────────────────────');

  const testEmail = `test_${Date.now()}@test.com`;
  const testPassword = 'Test1234!@#$';
  const testNickname = `테스트_${Date.now()}`;

  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nickname: testNickname
        }
      }
    });

    if (signupError) {
      console.log('❌ 회원가입 실패:', signupError.message);
    } else if (signupData.user) {
      console.log('✅ 회원가입 성공!');
      console.log('   User ID:', signupData.user.id);
      console.log('   Email:', signupData.user.email);
      console.log('   Email Confirmed:', signupData.user.email_confirmed_at ? 'YES' : 'NO');

      // users 테이블에 데이터 삽입 시도
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: signupData.user.id,
            email: testEmail,
            nickname: testNickname
          })
          .select()
          .single();

        if (insertError) {
          console.log('   ❌ users 테이블 삽입 실패:', insertError.message);
        } else {
          console.log('   ✅ users 테이블 삽입 성공');

          // 삭제 (테스트 정리)
          await supabase.from('users').delete().eq('id', signupData.user.id);
          console.log('   🗑️  테스트 데이터 삭제 완료');
        }
      } catch (e) {
        console.log('   ❌ users 테이블 작업 에러:', e.message);
      }
    }
  } catch (e) {
    console.log('❌ 회원가입 테스트 에러:', e.message);
  }

  console.log('');

  // 4. 이메일 인증 설정 확인
  console.log('4️⃣ 이메일 인증 설정 확인');
  console.log('─────────────────────────────────────────');

  // 기존 사용자로 로그인 시도
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'gkrjawnrkf1@gmail.com',
      password: 'wrongpassword'  // 의도적으로 틀린 비밀번호
    });

    if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('✅ 로그인 오류 처리: 정상 (잘못된 비밀번호 감지)');
      } else if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️  이메일 인증 필요 (이메일 인증이 활성화되어 있음)');
      } else {
        console.log('❓ 로그인 오류:', loginError.message);
      }
    }
  } catch (e) {
    console.log('❌ 로그인 테스트 에러:', e.message);
  }

  console.log('');

  // 5. RPC 함수 확인 (이메일 자동 확인용)
  console.log('5️⃣ RPC 함수 확인');
  console.log('─────────────────────────────────────────');

  try {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('confirm_user_email', { user_email: 'test@test.com' });

    if (rpcError) {
      if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        console.log('❌ confirm_user_email 함수가 존재하지 않음');
        console.log('   → 이메일 자동 확인 기능이 작동하지 않습니다');
      } else {
        console.log('❓ RPC 오류:', rpcError.message);
      }
    } else {
      console.log('✅ confirm_user_email 함수 존재');
    }
  } catch (e) {
    console.log('❌ RPC 테스트 에러:', e.message);
  }

  console.log('');

  // 6. 전체 사용자 목록 확인
  console.log('6️⃣ 사용자 목록 확인');
  console.log('─────────────────────────────────────────');

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, nickname, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (usersError) {
    console.log('❌ 사용자 목록 조회 실패:', usersError.message);
  } else if (users) {
    console.log(`✅ 최근 사용자 ${users.length}명:`);
    users.forEach((user, index) => {
      const date = new Date(user.created_at).toLocaleDateString('ko-KR');
      console.log(`   ${index + 1}. ${user.nickname} (${user.email}) - ${date}`);
    });
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 테스트 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testAuthSystem().catch(console.error);
