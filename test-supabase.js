// Supabase 데이터베이스 테스트 스크립트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://copqtgkymbhdayglatqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcHF0Z2t5bWJoZGF5Z2xhdHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDY4OTEsImV4cCI6MjA3NTQ4Mjg5MX0.pDK4IgMuHIjJ8FXsfgm666PH29lGa-FoJJQlmLu0G2E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Supabase 데이터베이스 테스트 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Users 테이블 확인
  console.log('1️⃣ Users 테이블 확인');
  console.log('─────────────────────────────────');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(10);

  if (usersError) {
    console.error('❌ Users 테이블 조회 오류:', usersError);
  } else {
    console.log(`✅ Users 테이블: ${users.length}명의 사용자`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nickname} (${user.email}) - ID: ${user.id}`);
    });
  }
  console.log('');

  // 2. Messages 테이블 확인
  console.log('2️⃣ Messages 테이블 확인');
  console.log('─────────────────────────────────');
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (messagesError) {
    console.error('❌ Messages 테이블 조회 오류:', messagesError);
  } else {
    console.log(`✅ Messages 테이블: 최근 ${messages.length}개의 메시지`);
    messages.forEach((msg, index) => {
      const date = new Date(msg.created_at);
      console.log(`   ${index + 1}. [${date.toLocaleString()}] Room ${msg.room_id}: "${msg.content.substring(0, 30)}..." (User: ${msg.user_id})`);
    });
  }
  console.log('');

  // 3. 채팅방별 메시지 그룹화
  console.log('3️⃣ 채팅방별 메시지 통계');
  console.log('─────────────────────────────────');
  if (messages && messages.length > 0) {
    const roomStats = {};
    messages.forEach(msg => {
      if (!roomStats[msg.room_id]) {
        roomStats[msg.room_id] = {
          count: 0,
          users: new Set()
        };
      }
      roomStats[msg.room_id].count++;
      roomStats[msg.room_id].users.add(msg.user_id);
    });

    Object.entries(roomStats).forEach(([roomId, stats]) => {
      console.log(`   Room ${roomId}: ${stats.count}개 메시지, ${stats.users.size}명 참여`);
    });
  }
  console.log('');

  // 4. 실시간 구독 테스트
  console.log('4️⃣ 실시간 구독 테스트 (10초 동안 대기)');
  console.log('─────────────────────────────────');
  console.log('📡 실시간 메시지 수신 대기 중...');

  const channel = supabase
    .channel('test-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('🎉 새 메시지 수신!', payload.new);
      }
    )
    .subscribe((status) => {
      console.log('   구독 상태:', status);
    });

  // 10초 대기
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('📴 구독 해제');
  await supabase.removeChannel(channel);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 테스트 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testSupabase().catch(console.error);
