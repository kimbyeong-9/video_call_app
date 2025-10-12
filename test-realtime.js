// Supabase Realtime 테스트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://copqtgkymbhdayglatqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcHF0Z2t5bWJoZGF5Z2xhdHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDY4OTEsImV4cCI6MjA3NTQ4Mjg5MX0.pDK4IgMuHIjJ8FXsfgm666PH29lGa-FoJJQlmLu0G2E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtime() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Supabase Realtime 상세 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. 채팅방별 실시간 구독 테스트
  const testRoomId = 'chat_a83c96ca-e960-4885-8e3e-11ff4dc6a774_c3d8936b-fd46-415d-bdec-202e194efc80';

  console.log('1️⃣ 채팅방별 실시간 구독 테스트');
  console.log('─────────────────────────────────');
  console.log('📌 테스트 채팅방:', testRoomId);
  console.log('');

  let messageReceived = false;

  const channel = supabase
    .channel(`test-room:${testRoomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${testRoomId}`
      },
      (payload) => {
        console.log('✅ 메시지 수신 성공!');
        console.log('   Room ID:', payload.new.room_id);
        console.log('   Content:', payload.new.content);
        console.log('   User ID:', payload.new.user_id);
        console.log('   Created At:', payload.new.created_at);
        messageReceived = true;
      }
    )
    .subscribe((status) => {
      console.log('   구독 상태:', status);

      if (status === 'SUBSCRIBED') {
        console.log('   ✅ 구독 활성화됨!');
        console.log('');
        console.log('2️⃣ 테스트 메시지 전송');
        console.log('─────────────────────────────────');

        // 테스트 메시지 전송
        setTimeout(async () => {
          console.log('   📤 테스트 메시지 전송 중...');

          const { data, error } = await supabase
            .from('messages')
            .insert({
              room_id: testRoomId,
              user_id: 'a83c96ca-e960-4885-8e3e-11ff4dc6a774',
              content: `[테스트] ${new Date().toLocaleTimeString()}`
            })
            .select()
            .single();

          if (error) {
            console.error('   ❌ 메시지 전송 실패:', error.message);
          } else {
            console.log('   ✅ 메시지 전송 성공!');
            console.log('   Message ID:', data.id);
          }
        }, 2000);
      } else if (status === 'CHANNEL_ERROR') {
        console.log('   ❌ 채널 에러!');
      } else if (status === 'TIMED_OUT') {
        console.log('   ❌ 타임아웃!');
      }
    });

  // 10초 대기
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('');
  console.log('3️⃣ 테스트 결과');
  console.log('─────────────────────────────────');
  if (messageReceived) {
    console.log('   ✅ Realtime 정상 작동!');
    console.log('   메시지가 실시간으로 수신되었습니다.');
  } else {
    console.log('   ❌ Realtime 작동 안 함!');
    console.log('   메시지가 수신되지 않았습니다.');
    console.log('');
    console.log('   가능한 원인:');
    console.log('   1. Supabase Realtime이 비활성화되어 있음');
    console.log('   2. messages 테이블의 Realtime이 비활성화되어 있음');
    console.log('   3. RLS(Row Level Security) 정책 문제');
  }

  console.log('');
  console.log('📴 구독 해제');
  await supabase.removeChannel(channel);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 테스트 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testRealtime().catch(console.error);
