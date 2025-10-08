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
  const chatContentRef = useRef(null);

  // 1️⃣ 페이지 진입 시 사용자 정보 가져오기 & 기존 메시지 불러오기
  useEffect(() => {
    initializeChat();
  }, [roomId]);

  // 2️⃣ 실시간 구독 설정
  useEffect(() => {
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
          console.log('새 메시지:', payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // 3️⃣ 컴포넌트 종료 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 4️⃣ 새 메시지가 추가되면 스크롤을 맨 아래로
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // 현재 사용자 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      setCurrentUser(user);

      // 기존 메시지 불러오기
      await loadMessages();
    } catch (error) {
      console.error('초기화 오류:', error);
      alert('채팅을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('메시지 불러오기 오류:', error);
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
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: currentUser.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
        <RoomTitle>채팅방 {roomId}</RoomTitle>
      </ChatHeader>
      
      <ChatContent ref={chatContentRef}>
        {messages.length === 0 ? (
          <EmptyMessage>메시지가 없습니다. 첫 메시지를 보내보세요!</EmptyMessage>
        ) : (
          messages.map((msg) => (
            <MessageWrapper key={msg.id} isOwn={msg.user_id === currentUser?.id}>
              <MessageBubble isOwn={msg.user_id === currentUser?.id}>
                <MessageContent>{msg.content}</MessageContent>
                <MessageTime>{formatTime(msg.created_at)}</MessageTime>
              </MessageBubble>
            </MessageWrapper>
          ))
        )}
      </ChatContent>

      <ChatInputForm onSubmit={sendMessage}>
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
        />
        <SendButton type="submit">전송</SendButton>
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

const RoomTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 600;
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
  justify-content: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
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