import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

const Chatting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const chatContentRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const { markRoomAsRead, setActiveRoom, clearActiveRoom } = useUnreadMessages();

  // 1️⃣ 페이지 진입 시 사용자 정보 가져오기 & 기존 메시지 불러오기
  useEffect(() => {
    console.log('🔵 useEffect 실행, roomId:', roomId);
    initializeChat();
    // 채팅방 입장 시 활성 채팅방 설정 및 읽음 처리
    setActiveRoom(roomId);
    markRoomAsRead(roomId);
    
    // 컴포넌트 언마운트 시 활성 채팅방 해제
    return () => {
      clearActiveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // localStorage 변경 감지 (로그아웃/로그인 시)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const storedUser = localStorage.getItem('currentUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // 사용자 정보가 변경되었는지 확인
      if (!parsedUser && currentUser) {
        // 로그아웃 감지
        console.log('🔵 Chatting - 로그아웃 감지, 로그인 페이지로 이동');
        navigate('/login');
      } else if (parsedUser && currentUser && parsedUser.id !== currentUser.id) {
        // 다른 사용자로 로그인
        console.log('🔵 Chatting - 사용자 변경 감지, 데이터 새로고침');
        initializeChat();
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, navigate]);

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
        async (payload) => {
          console.log('🔵 새 메시지 수신:', payload.new);

          // 발신자 정보 가져오기
          const { data: senderData, error: senderError } = await supabase
            .from('users')
            .select('id, nickname, email, profile_image')
            .eq('id', payload.new.user_id)
            .single();

          // 발신자 정보가 없으면 기본값 설정
          const messageWithSender = {
            ...payload.new,
            sender: senderData || {
              id: payload.new.user_id,
              nickname: '알 수 없는 사용자',
              email: null,
              profile_image: null
            }
          };

          if (senderError) {
            console.warn('⚠️ 발신자 정보 조회 실패:', senderError);
          }

          console.log('🔵 발신자 정보 포함된 메시지:', messageWithSender);
          setMessages((prev) => [...prev, messageWithSender]);

          // 새 메시지가 도착하면 읽음 처리 (상대방의 메시지인 경우)
          if (payload.new.user_id !== currentUser?.id) {
            console.log('🔵 상대방의 새 메시지, 읽음 처리');
            markRoomAsRead(roomId);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔵 Realtime 구독 상태:', status);
      });

    // 3️⃣ 컴포넌트 종료 시 구독 해제 및 읽음 처리
    return () => {
      console.log('🔵 실시간 구독 해제 및 최종 읽음 처리');
      markRoomAsRead(roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUser, markRoomAsRead]);

  // 4️⃣ 새 메시지가 추가되면 스크롤을 맨 아래로
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 5️⃣ 전역 클릭 이벤트로 메시지 삭제 버튼 닫기
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // 삭제 버튼이 표시된 상태일 때만 처리
      if (showDeleteButton && selectedMessageId) {
        // 클릭된 요소가 메시지 버블이나 삭제 버튼이 아닌 경우
        const messageBubble = e.target.closest('[data-message-bubble]');
        const deleteButton = e.target.closest('[data-delete-button]');
        
        // 메시지 버블이 아니고 삭제 버튼도 아닌 경우에만 삭제 버튼 닫기
        if (!messageBubble && !deleteButton) {
          console.log('🔵 전역 클릭으로 메시지 삭제 버튼 닫기');
          setShowDeleteButton(false);
          setSelectedMessageId(null);
        }
      }
    };

    // 전역 클릭 이벤트 리스너 추가
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [showDeleteButton, selectedMessageId]);

  const initializeChat = async () => {
    console.log('🔵 initializeChat 시작, roomId:', roomId);
    try {
      // 현재 사용자 가져오기 (localStorage에서 먼저 확인)
      const storedUser = localStorage.getItem('currentUser');
      console.log('🔵 localStorage user:', storedUser);

      if (!storedUser) {
        console.log('🔵 사용자 정보 없음');
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      console.log('🔵 parsedUser:', parsedUser);
      setCurrentUser(parsedUser);

      // 상대방 정보 미리 로드
      await loadOtherUserInfo(parsedUser);

      // 채팅방 입장 시 chat_rooms와 chat_participants 생성
      await createChatRoomIfNotExists(parsedUser);

      // 실제 메시지 로드
      console.log('🔵 실제 메시지 로드 시도');
      await loadMessages();
      console.log('🔵 loadMessages 완료');
    } catch (error) {
      console.error('❌ 초기화 오류:', error);
      alert('채팅을 불러오는데 실패했습니다: ' + error.message);
    } finally {
      console.log('🔵 setLoading(false) 호출');
      setLoading(false);
    }
  };

  // 상대방 정보 미리 로드 함수
  const loadOtherUserInfo = async (currentUser) => {
    try {
      console.log('🔵 상대방 정보 로드 시작, roomId:', roomId);
      
      // roomId에서 상대방 ID 추출
      const roomIdParts = roomId.replace('chat_', '').split('_');
      const otherUserId = roomIdParts.find(id => id !== currentUser.id);
      
      if (!otherUserId) {
        console.log('🔵 상대방 ID를 찾을 수 없음');
        return;
      }

      console.log('🔵 상대방 ID:', otherUserId);

      // 상대방 정보 조회
      const { data: otherUserData, error } = await supabase
        .from('users')
        .select('id, nickname, email, profile_image')
        .eq('id', otherUserId)
        .single();

      if (error) {
        console.error('❌ 상대방 정보 조회 오류:', error);
        return;
      }

      if (otherUserData) {
        console.log('🔵 상대방 정보 로드 완료:', otherUserData);
        setOtherUser(otherUserData);
      }
    } catch (error) {
      console.error('❌ 상대방 정보 로드 오류:', error);
    }
  };

  // 채팅방 생성 함수
  const createChatRoomIfNotExists = async (user) => {
    try {
      console.log('🔵 채팅방 생성/확인 시작:', roomId);

      const currentTime = new Date().toISOString();

      // 1. chat_rooms 테이블에 room_id 생성
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .upsert({
          id: roomId,
          created_at: currentTime,
          updated_at: currentTime
        }, {
          onConflict: 'id'
        });

      if (roomError) {
        console.warn('⚠️ chat_rooms 생성/업데이트 실패:', roomError);
      } else {
        console.log('✅ chat_rooms 확인/생성 완료:', roomId);
      }

      // 2. chat_participants 테이블에 현재 사용자 추가
      const { error: participantError } = await supabase
        .from('chat_participants')
        .upsert({
          user_id: user.id,
          room_id: roomId,
          joined_at: currentTime,
          last_read_at: currentTime
        }, {
          onConflict: 'user_id,room_id'
        });

      if (participantError) {
        console.warn('⚠️ chat_participants 생성/업데이트 실패:', participantError);
      } else {
        console.log('✅ chat_participants 확인/생성 완료:', user.id, roomId);
      }

      // 3. 상대방도 chat_participants에 추가 (room_id에서 상대방 ID 추출)
      const roomIdParts = roomId.replace('chat_', '').split('_');
      const otherUserId = roomIdParts.find(id => id !== user.id);
      
      if (otherUserId) {
        const { error: otherParticipantError } = await supabase
          .from('chat_participants')
          .upsert({
            user_id: otherUserId,
            room_id: roomId,
            joined_at: currentTime,
            last_read_at: null // 상대방은 아직 읽지 않음
          }, {
            onConflict: 'user_id,room_id'
          });

        if (otherParticipantError) {
          console.warn('⚠️ 상대방 chat_participants 생성/업데이트 실패:', otherParticipantError);
        } else {
          console.log('✅ 상대방 chat_participants 확인/생성 완료:', otherUserId, roomId);
        }
      }

    } catch (error) {
      console.error('❌ 채팅방 생성 오류:', error);
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

      // 2. 현재 사용자가 숨긴 메시지 조회 (currentUser가 존재할 때만)
      let hiddenMessageIds = new Set();
      if (currentUser?.id) {
        const { data: hiddenMessagesData, error: hiddenError } = await supabase
          .from('hidden_messages')
          .select('message_id')
          .eq('user_id', currentUser.id);

        if (hiddenError) {
          console.warn('⚠️ 숨겨진 메시지 조회 실패:', hiddenError);
        } else {
          hiddenMessageIds = new Set(hiddenMessagesData?.map(h => h.message_id) || []);
        }
      }
      console.log('🔵 숨겨진 메시지 ID들:', hiddenMessageIds);

      // 3. 숨겨진 메시지 필터링
      const filteredMessages = messagesData.filter(msg => !hiddenMessageIds.has(msg.id));
      console.log('🔵 필터링 후 메시지 개수:', filteredMessages.length);

      // 4. 각 메시지의 사용자 정보 가져오기 (간소화)
      const messagesWithSender = [];
      const userCache = {};

      for (const msg of filteredMessages) {
        try {
          console.log(`🔵 메시지 ${msg.id}의 사용자 정보 조회:`, msg.user_id);

          // 캐시에 이미 있으면 재사용
          let userData = userCache[msg.user_id];
          if (!userData) {
            const { data, error: userError } = await supabase
              .from('users')
              .select('id, nickname, email, profile_image')
              .eq('id', msg.user_id)
              .single();

            console.log(`🔵 사용자 정보 조회 결과:`, { data, userError });
            userData = data;
            if (userData) {
              userCache[msg.user_id] = userData;
            }
          }

          messagesWithSender.push({
            ...msg,
            sender: userData || null
          });

          // 상대방 정보 저장 (내가 아닌 사용자)
          if (userData && userData.id !== currentUser?.id && !otherUser) {
            setOtherUser(userData);
          }
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
      
      // 1. 먼저 chat_rooms 테이블에 room_id가 있는지 확인하고, 없으면 생성
      const currentTime = new Date().toISOString();
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .upsert({
          id: roomId,
          created_at: currentTime,
          updated_at: currentTime
        }, {
          onConflict: 'id'
        });

      if (roomError) {
        console.warn('⚠️ chat_rooms 생성/업데이트 실패 (무시하고 계속):', roomError);
      } else {
        console.log('✅ chat_rooms 확인/생성 완료:', roomId);
      }

      // 2. 메시지 전송
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

  // 롱프레스 핸들러
  const handleMessageLongPress = (messageId, isOwnMessage) => {
    setSelectedMessageId(messageId);
    setShowDeleteButton(true);
  };

  const handleMessagePressStart = (messageId, isOwnMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      handleMessageLongPress(messageId, isOwnMessage);
    }, 500); // 500ms 후 롱프레스 인식
  };

  const handleMessagePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMessageClick = () => {
    // 일반 클릭 시 삭제 버튼 숨기기
    if (showDeleteButton) {
      setShowDeleteButton(false);
      setSelectedMessageId(null);
    }
  };

  // 상대방 프로필 클릭 시 해당 유저의 프로필로 이동
  const handleProfileClick = (userId) => {
    console.log('🔵 상대방 프로필 클릭:', userId);
    navigate(`/profiles/${userId}`);
  };

  // 메시지 삭제/숨기기 함수
  const handleDeleteMessage = async (messageId, isOwnMessage) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isOwnMessage) {
      // 자신의 메시지: 완전 삭제
      const confirmDelete = window.confirm('이 메시지를 삭제하시겠습니까?');
      if (!confirmDelete) return;

      try {
        console.log('🔵 메시지 삭제 시작, messageId:', messageId);

        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error('❌ 메시지 삭제 오류:', error);
          throw error;
        }

        // 로컬 상태에서도 메시지 제거
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        console.log('✅ 메시지 삭제 완료');
        setShowDeleteButton(false);
        setSelectedMessageId(null);
        
      } catch (error) {
        console.error('❌ 메시지 삭제 오류:', error);
        alert('메시지 삭제에 실패했습니다: ' + error.message);
      }
    } else {
      // 상대방의 메시지: 나에게만 숨기기
      const confirmHide = window.confirm('이 메시지를 나에게만 숨기시겠습니까?');
      if (!confirmHide) return;

      try {
        console.log('🔵 메시지 숨기기 시작, messageId:', messageId);

        const { error } = await supabase
          .from('hidden_messages')
          .insert({
            user_id: currentUser.id,
            message_id: messageId
          });

        if (error) {
          console.error('❌ 메시지 숨기기 오류:', error);
          throw error;
        }

        // 로컬 상태에서도 메시지 제거
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        console.log('✅ 메시지 숨기기 완료');
        setShowDeleteButton(false);
        setSelectedMessageId(null);
        
      } catch (error) {
        console.error('❌ 메시지 숨기기 오류:', error);
        alert('메시지 숨기기에 실패했습니다: ' + error.message);
      }
    }
  };

  const handleExitChat = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const confirmExit = window.confirm('채팅방을 나가시겠습니까? 채팅방이 삭제됩니다.');
    if (!confirmExit) return;

    try {
      console.log('🔵 채팅방 나가기 시작, roomId:', roomId, 'userId:', currentUser.id);

      // 1. 현재 사용자를 chat_participants에서 제거
      const { error: participantError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);

      if (participantError) {
        console.error('❌ 참가자 제거 오류:', participantError);
        throw participantError;
      }

      console.log('✅ 참가자 제거 완료');

      // 2. 남은 참가자가 있는지 확인
      const { data: remainingParticipants, error: checkError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (checkError) {
        console.error('❌ 남은 참가자 확인 오류:', checkError);
        throw checkError;
      }

      console.log('🔵 남은 참가자 수:', remainingParticipants?.length || 0);

      // 3. 참가자가 없으면 채팅방과 메시지 삭제
      if (!remainingParticipants || remainingParticipants.length === 0) {
        console.log('🔵 참가자가 없으므로 채팅방 삭제');

        // 메시지 삭제
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .eq('room_id', roomId);

        if (messagesError) {
          console.error('❌ 메시지 삭제 오류:', messagesError);
          throw messagesError;
        }

        // 채팅방 삭제
        const { error: roomError } = await supabase
          .from('chat_rooms')
          .delete()
          .eq('id', roomId);

        if (roomError) {
          console.error('❌ 채팅방 삭제 오류:', roomError);
          throw roomError;
        }

        console.log('✅ 채팅방과 메시지 삭제 완료');
      }

      // 4. 채팅방 목록으로 이동
      alert('채팅방을 나갔습니다.');
      navigate('/chatlist');

    } catch (error) {
      console.error('❌ 채팅방 나가기 오류:', error);
      alert('채팅방 나가기에 실패했습니다: ' + error.message);
    }
  };

  const formatTime = (timestamp) => {
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const date = new Date(timestamp);
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const now = new Date();
    const nowKorean = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const diffInHours = (nowKorean - koreanTime) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // 오늘: 오전/오후 시간:분
      const hours = koreanTime.getHours();
      const minutes = koreanTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${ampm} ${displayHours}:${minutes}`;
    } else if (diffInHours < 24 * 7) {
      // 이번 주: 요일
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[koreanTime.getDay()];
    } else {
      // 그 외: 월/일
      const month = (koreanTime.getMonth() + 1).toString().padStart(2, '0');
      const day = koreanTime.getDate().toString().padStart(2, '0');
      return `${month}/${day}`;
    }
  };

  // 날짜 구분선을 위한 함수
  const formatDateSeparator = (timestamp) => {
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const date = new Date(timestamp);
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const year = koreanTime.getFullYear();
    const month = koreanTime.getMonth() + 1;
    const day = koreanTime.getDate();
    
    return `${year}년 ${month}월 ${day}일`;
  };

  // 날짜가 다른지 확인하는 함수
  const isDifferentDate = (date1, date2) => {
    if (!date1 || !date2) return true;
    
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const koreanTime1 = new Date(d1.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const koreanTime2 = new Date(d2.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    
    return koreanTime1.getFullYear() !== koreanTime2.getFullYear() ||
           koreanTime1.getMonth() !== koreanTime2.getMonth() ||
           koreanTime1.getDate() !== koreanTime2.getDate();
  };

  const formatFullTime = (timestamp) => {
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const date = new Date(timestamp);
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const year = koreanTime.getFullYear();
    const month = (koreanTime.getMonth() + 1).toString().padStart(2, '0');
    const day = koreanTime.getDate().toString().padStart(2, '0');
    const hours = koreanTime.getHours();
    const minutes = koreanTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${year}.${month}.${day} ${ampm} ${displayHours}:${minutes}`;
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
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft size={22} />
        </BackButton>
        <RoomTitle>
          {otherUser?.nickname || '상대방 정보 로딩 중...'}
        </RoomTitle>
        <ExitButton onClick={handleExitChat}>
          <FiTrash2 size={20} />
        </ExitButton>
      </ChatHeader>

      <ChatContent ref={chatContentRef}>
        {messages.length === 0 ? (
          <EmptyMessage>메시지가 없습니다. 첫 메시지를 보내보세요!</EmptyMessage>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.user_id === currentUser?.id;
            const senderName = msg.sender?.nickname || msg.sender?.email?.split('@')[0] || '익명';
            // 프로필 이미지 처리 - 실시간 메시지 수신 시에도 올바른 이미지 표시
            const senderImage = msg.sender?.profile_image && msg.sender.profile_image.trim() !== '' 
              ? msg.sender.profile_image 
              : (msg.sender ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}` : null);

            // 이전 메시지와 비교하여 같은 분 단위인지 확인
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showProfile = !isOwn && (!prevMsg ||
              prevMsg.user_id !== msg.user_id ||
              formatTime(prevMsg.created_at) !== formatTime(msg.created_at) ||
              prevMsg.user_id === currentUser?.id
            );

            // 날짜 구분선 표시 여부 확인
            const showDateSeparator = index === 0 || isDifferentDate(msg.created_at, prevMsg?.created_at);
            
            if (showDateSeparator) {
              console.log('🔵 날짜 구분선 표시:', formatDateSeparator(msg.created_at), '메시지:', msg.content);
            }
            
            // 같은 시간대의 첫 번째 메시지인지 확인 (프로필 이미지와 시간 표시용)
            const showTimeAndProfile = !isOwn && (!prevMsg ||
              prevMsg.user_id !== msg.user_id ||
              formatTime(prevMsg.created_at) !== formatTime(msg.created_at) ||
              prevMsg.user_id === currentUser?.id
            );
            
            // 내 메시지의 시간 표시 조건 (같은 시간대의 첫 번째 메시지에만)
            const showMyMessageTime = isOwn && (!prevMsg ||
              prevMsg.user_id !== msg.user_id ||
              formatTime(prevMsg.created_at) !== formatTime(msg.created_at) ||
              prevMsg.user_id !== currentUser?.id
            );

            return (
              <React.Fragment key={msg.id}>
                {/* 날짜 구분선 */}
                {showDateSeparator && (
                  <DateSeparator>
                    <DateSeparatorText>{formatDateSeparator(msg.created_at)}</DateSeparatorText>
                  </DateSeparator>
                )}
                
                <MessageWrapper $isOwn={isOwn}>
                  {!isOwn && (
                  <OpponentMessageContainer>
                    <MessageGroup>
                      {showTimeAndProfile ? (
                        <ProfileImageWrapper 
                          onClick={() => handleProfileClick(msg.user_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {senderImage ? (
                            <ProfileImage src={senderImage} alt={senderName} />
                          ) : (
                            <ProfileImagePlaceholder>
                              <LoadingSpinner />
                            </ProfileImagePlaceholder>
                          )}
                        </ProfileImageWrapper>
                      ) : (
                        <ProfileImagePlaceholder />
                      )}
                      <MessageContent>
                        {showTimeAndProfile && (
                          <SenderName 
                            onClick={() => handleProfileClick(msg.user_id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {senderName}
                          </SenderName>
                        )}
                        <MessageBubble 
                          data-message-bubble={msg.id}
                          $isOwn={isOwn} 
                          $isSelected={selectedMessageId === msg.id}
                          title={formatFullTime(msg.created_at)}
                          onMouseDown={() => handleMessagePressStart(msg.id, isOwn)}
                          onMouseUp={handleMessagePressEnd}
                          onMouseLeave={handleMessagePressEnd}
                          onTouchStart={() => handleMessagePressStart(msg.id, isOwn)}
                          onTouchEnd={handleMessagePressEnd}
                          onClick={handleMessageClick}
                        >
                          <MessageText>{msg.content}</MessageText>
                        </MessageBubble>
                      </MessageContent>
                    </MessageGroup>
                    {showTimeAndProfile && (
                      <OpponentMessageTime>{formatTime(msg.created_at)}</OpponentMessageTime>
                    )}
                  </OpponentMessageContainer>
                )}
                {isOwn && (
                  <OwnMessageContainer>
                    {showMyMessageTime && (
                      <OwnMessageTime>{formatTime(msg.created_at)}</OwnMessageTime>
                    )}
                    <MessageBubble 
                      data-message-bubble={msg.id}
                      $isOwn={isOwn} 
                      $isSelected={selectedMessageId === msg.id}
                      title={formatFullTime(msg.created_at)}
                      onMouseDown={() => handleMessagePressStart(msg.id, isOwn)}
                      onMouseUp={handleMessagePressEnd}
                      onMouseLeave={handleMessagePressEnd}
                      onTouchStart={() => handleMessagePressStart(msg.id, isOwn)}
                      onTouchEnd={handleMessagePressEnd}
                      onClick={handleMessageClick}
                    >
                      <MessageText>{msg.content}</MessageText>
                    </MessageBubble>
                  </OwnMessageContainer>
                )}
                
                {/* 삭제/숨기기 버튼 */}
                {showDeleteButton && selectedMessageId === msg.id && (
                  <DeleteButtonContainer>
                    <DeleteButton 
                      data-delete-button={msg.id}
                      onClick={() => handleDeleteMessage(msg.id, isOwn)}
                    >
                      <FiTrash2 size={16} />
                      {isOwn ? '삭제' : '숨기기'}
                    </DeleteButton>
                  </DeleteButtonContainer>
                )}
                </MessageWrapper>
              </React.Fragment>
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
  height: 64px;
  padding: 0 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const BackButton = styled.button`
  border: none;
  background-color: transparent;
  color: var(--primary-blue);
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--accent-blue);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
    background-color: #d0e7ff;
  }
`;

const RoomTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  flex: 1;
  text-align: center;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ExitButton = styled.button`
  border: none;
  background-color: transparent;
  color: #dc2626;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(220, 38, 38, 0.1);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
    background-color: rgba(220, 38, 38, 0.2);
  }
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

const DateSeparator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #e0e0e0;
    z-index: 1;
  }
`;

const DateSeparatorText = styled.span`
  background-color: #f8f9fa;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  z-index: 2;
  position: relative;
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 4px;
`;

const OwnMessageContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 4px;
  justify-content: flex-end;
`;

const OwnMessageTime = styled.span`
  font-size: 11px;
  color: #8e8e8e;
  white-space: nowrap;
  margin-bottom: 2px;
`;

const OpponentMessageContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 4px;
`;

const OpponentMessageTime = styled.span`
  font-size: 11px;
  color: #8e8e8e;
  white-space: nowrap;
  margin-bottom: 2px;
`;

const MessageGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 80%;
`;

const ProfileImageWrapper = styled.div`
  flex-shrink: 0;
`;

const ProfileImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
`;

const ProfileImagePlaceholder = styled.div`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: transparent;
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SenderName = styled.span`
  font-size: 12px;
  color: var(--text-light, #666);
  margin-left: 8px;
  font-weight: 500;
`;

const MessageBubble = styled.div`
  max-width: 100%;
  padding: 12px 16px;
  border-radius: ${props => props.$isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};
  background-color: ${props => props.$isOwn ? '#007aff' : '#ffffff'};
  color: ${props => props.$isOwn ? '#ffffff' : '#000000'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  ${props => props.$isSelected && `
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    background-color: ${props.$isOwn ? '#0056b3' : '#f0f0f0'};
  `}
  
  &:active {
    transform: scale(0.98);
  }
`;

const MessageText = styled.p`
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

const DeleteButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  animation: slideIn 0.2s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);

  &:hover {
    background-color: #b91c1c;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }
`;

export default Chatting;