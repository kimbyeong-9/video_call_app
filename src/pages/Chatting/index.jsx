import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../utils/supabase';

const Chatting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const chatContentRef = useRef(null);

  // 1️⃣ 페이지 진입 시 사용자 정보 가져오기 & 기존 메시지 불러오기
  useEffect(() => {
    console.log('🔵 useEffect 실행, roomId:', roomId);
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 2️⃣ 실시간 구독 설정
  useEffect(() => {
    console.log('🔵 실시간 구독 설정, roomId:', roomId);
    const channel = supabase
      .channel(`realtime:messages:${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('🔵 새 메시지 수신:', payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // 3️⃣ 컴포넌트 종료 시 구독 해제
    return () => {
      console.log('🔵 실시간 구독 해제');
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 4️⃣ 새 메시지가 추가되면 스크롤을 맨 아래로
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    console.log('🔵 initializeChat 시작, roomId:', roomId);
    try {
      // 현재 사용자 가져오기 (localStorage에서 먼저 확인)
      const storedUser = localStorage.getItem('currentUser');
      console.log('🔵 localStorage user:', storedUser);
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔵 parsedUser:', parsedUser);
        setCurrentUser(parsedUser);
      } else {
        console.log('🔵 사용자 정보 없음');
        setLoading(false);
        return;
      }

      // 간단한 테스트 메시지 설정
      console.log('🔵 테스트 메시지 설정');
      const testMessages = [
        {
          id: 'test1',
          room_id: roomId,
          user_id: parsedUser.id,
          content: '테스트 메시지입니다.',
          created_at: new Date().toISOString(),
          sender: {
            id: parsedUser.id,
            nickname: parsedUser.nickname,
            email: parsedUser.email
          }
        }
      ];
      
      console.log('🔵 테스트 메시지 설정 완료:', testMessages);
      setMessages(testMessages);
      
      // 실제 메시지도 로드 시도
      console.log('🔵 실제 메시지 로드 시도');
      await loadMessages();
      console.log('🔵 loadMessages 완료');
    } catch (error) {
      console.error('❌ 초기화 오류:', error);
      alert('채팅을 불러오는데 실패했습니다.');
      navigate('/login');
    } finally {
      console.log('🔵 setLoading(false) 호출');
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    console.log('🔵 loadParticipants 시작, roomId:', roomId);
    try {
      // 해당 채팅방에 메시지를 보낸 사용자들의 ID 수집
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('user_id')
        .eq('room_id', String(roomId))
        .order('created_at', { ascending: false });

      if (messageError) {
        console.error('❌ 메시지 조회 오류:', messageError);
        throw messageError;
      }

      if (!messageData || messageData.length === 0) {
        console.log('🔵 메시지가 없어서 참가자 정보 없음');
        setParticipants([]);
        return;
      }

      // 고유한 사용자 ID 추출
      const uniqueUserIds = [...new Set(messageData.map(msg => msg.user_id))];
      console.log('🔵 고유 사용자 ID들:', uniqueUserIds);

      // 각 사용자의 정보 가져오기
      const participantsData = await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, nickname, email, profile_image')
              .eq('id', userId)
              .single();
            
            if (userError) {
              console.warn('⚠️ 사용자 조회 실패:', userId, userError);
              return null;
            }
            
            return userData;
          } catch (err) {
            console.warn('⚠️ 사용자 조회 예외:', err);
            return null;
          }
        })
      );

      // null 값 제거
      const validParticipants = participantsData.filter(p => p !== null);
      console.log('🔵 참가자 정보:', validParticipants);
      setParticipants(validParticipants);
    } catch (error) {
      console.error('❌ 참가자 정보 불러오기 오류:', error);
      setParticipants([]);
    }
  };

  const loadMessages = async () => {
    console.log('🔵 loadMessages 시작, roomId:', roomId);
    try {
      // 1. 메시지 조회 (기본)
      console.log('🔵 메시지 데이터 조회 시작');
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', String(roomId))
        .order('created_at', { ascending: true });

      console.log('🔵 메시지 조회 결과:', { messagesData, messagesError });

      if (messagesError) {
        console.error('❌ 메시지 조회 오류:', messagesError);
        throw messagesError;
      }

      // 메시지가 없으면 빈 배열로 설정하고 종료
      if (!messagesData || messagesData.length === 0) {
        console.log('🔵 메시지 없음, 빈 배열 설정');
        setMessages([]);
        return;
      }

      console.log('🔵 메시지 개수:', messagesData.length);

      // 2. 각 메시지의 사용자 정보 가져오기 (간소화)
      const messagesWithSender = [];
      
      for (const msg of messagesData) {
        try {
          console.log(`🔵 메시지 ${msg.id}의 사용자 정보 조회:`, msg.user_id);
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, nickname, email')
            .eq('id', msg.user_id)
            .single();

          console.log(`🔵 사용자 정보 조회 결과:`, { userData, userError });

          messagesWithSender.push({
            ...msg,
            sender: userData || null
          });
        } catch (error) {
          console.error(`❌ 메시지 ${msg.id} 사용자 정보 조회 오류:`, error);
          messagesWithSender.push({
            ...msg,
            sender: null
          });
        }
      }
      
      console.log('🔵 최종 메시지 목록:', messagesWithSender);
      setMessages(messagesWithSender);
      console.log('🔵 setMessages 완료, 메시지 개수:', messagesWithSender.length);
    } catch (error) {
      console.error('❌ 메시지 불러오기 오류:', error);
      // 오류 발생 시 빈 배열로 설정
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      console.log('🔵 메시지 전송 시작:', newMessage.trim());
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: currentUser.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      
      console.log('🔵 메시지 전송 성공');
      setNewMessage('');
    } catch (error) {
      console.error('❌ 메시지 전송 오류:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // 오늘: 시간:분
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffInHours < 24 * 7) {
      // 이번 주: 요일
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[date.getDay()];
    } else {
      // 그 외: 월/일
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}/${day}`;
    }
  };

  const formatFullTime = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <ChattingContainer>
        <LoadingMessage>채팅을 불러오는 중...</LoadingMessage>
      </ChattingContainer>
    );
  }

  return (
    <ChattingContainer>
      <ChatHeader>
        <BackButton onClick={() => navigate(-1)}>←</BackButton>
        <RoomInfo>
          <RoomTitle>채팅방 {roomId}</RoomTitle>
          <ParticipantCount>
            {currentUser ? '로그인됨' : '로그인 필요'}
          </ParticipantCount>
        </RoomInfo>
      </ChatHeader>
      
      <ChatContent ref={chatContentRef}>
        {messages.length === 0 ? (
          <EmptyMessage>메시지가 없습니다. 첫 메시지를 보내보세요!</EmptyMessage>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === currentUser?.id;
            const senderName = msg.sender?.nickname || msg.sender?.email?.split('@')[0] || '익명';
            
            return (
              <MessageWrapper key={msg.id} isOwn={isOwn}>
                {!isOwn && <SenderName>{senderName}</SenderName>}
                <MessageBubble isOwn={isOwn} title={formatFullTime(msg.created_at)}>
                  <MessageContent>{msg.content}</MessageContent>
                  <MessageTime>{formatTime(msg.created_at)}</MessageTime>
                </MessageBubble>
              </MessageWrapper>
            );
          })
        )}
      </ChatContent>

      <ChatInputForm onSubmit={sendMessage}>
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요... (Enter로 전송)"
        />
        <SendButton type="submit" disabled={!newMessage.trim()}>전송</SendButton>
      </ChatInputForm>
    </ChattingContainer>
  );
};

const ChattingContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const ChatHeader = styled.div`
  width: 100%;
  height: 60px;
  padding: 0 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  position: relative;
`;

const BackButton = styled.button`
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
`;

const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const RoomTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
`;

const ParticipantCount = styled.span`
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
`;

const ChatContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 16px;
  color: var(--text-light);
`;

const EmptyMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 16px;
  color: var(--text-light);
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`;

const SenderName = styled.span`
  font-size: 12px;
  color: var(--text-light, #666);
  margin-bottom: 4px;
  margin-left: 8px;
  font-weight: 500;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: ${props => props.isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};
  background-color: ${props => props.isOwn ? '#007aff' : '#ffffff'};
  color: ${props => props.isOwn ? '#ffffff' : '#000000'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageContent = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  word-wrap: break-word;
`;

const MessageTime = styled.span`
  display: block;
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
`;

const ChatInputForm = styled.form`
  width: 100%;
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  outline: none;
  font-size: 1rem;

  &:focus {
    border-color: #007aff;
  }
`;

const SendButton = styled.button`
  padding: 8px 20px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export default Chatting;