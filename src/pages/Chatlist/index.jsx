import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { supabase } from '../../utils/supabase';
import { onlineStatusManager } from '../../utils/onlineStatus';

const Chatlist = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Map()); // 온라인 사용자 상태
  const [swipedItemId, setSwipedItemId] = useState(null); // 스와이프된 아이템 ID
  const [swipeOffset, setSwipeOffset] = useState(0); // 스와이프 오프셋
  
  // 스와이프 관련 refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // 채팅방 정렬 함수 (최신순)
  const sortChatRoomsByLatestMessage = useCallback((rooms) => {
    return rooms.sort((a, b) => {
      // lastMessageDate가 있는 경우 해당 시간으로 정렬
      if (a.lastMessageDate && b.lastMessageDate) {
        const dateA = new Date(a.lastMessageDate);
        const dateB = new Date(b.lastMessageDate);
        return dateB - dateA; // 최신순 (내림차순)
      }
      // lastMessageDate가 없는 경우 (메시지가 없는 채팅방)
      if (a.lastMessageDate && !b.lastMessageDate) {
        return -1; // a가 더 최근 (메시지가 있는 것이 위로)
      }
      if (!a.lastMessageDate && b.lastMessageDate) {
        return 1; // b가 더 최근 (메시지가 있는 것이 위로)
      }
      // 둘 다 메시지가 없는 경우는 순서 유지
      return 0;
    });
  }, []);

  const loadChatRooms = useCallback(async () => {
    console.log('🔵 loadChatRooms 시작');

    try {
      // 현재 사용자 정보 가져오기
      const storedUser = localStorage.getItem('currentUser');
      console.log('🔵 localStorage 사용자 정보:', storedUser);

      if (!storedUser) {
        console.log('🔵 사용자 정보 없음');
        setChatRooms([]);
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      console.log('🔵 현재 사용자 ID:', user.id);

      // 데이터베이스에서 사용자가 참여한 채팅방 목록 가져오기
      console.log('🔵 데이터베이스에서 채팅방 목록 조회');

      // 1. chat_participants 테이블에서 현재 사용자가 참여한 채팅방 ID 가져오기
      const { data: myParticipantsData, error: myParticipantsError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      if (myParticipantsError) {
        console.error('❌ 내 참여 채팅방 조회 오류:', myParticipantsError);
        setChatRooms([]);
        setLoading(false);
        return;
      }

      console.log('🔵 내가 참여한 채팅방:', myParticipantsData);

      if (!myParticipantsData || myParticipantsData.length === 0) {
        console.log('🔵 내가 참여한 채팅방 없음');
        setChatRooms([]);
        setLoading(false);
        return;
      }

      // 2. 내가 참여한 채팅방 ID 추출
      const myRoomIds = myParticipantsData.map(participant => participant.room_id);
      console.log('🔵 내가 참여 중인 채팅방 ID들:', myRoomIds);

      // 3. 해당 채팅방들의 모든 메시지 가져오기
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('room_id, user_id, content, created_at')
        .in('room_id', myRoomIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('❌ 채팅방 메시지 조회 오류:', messagesError);
        setChatRooms([]);
        setLoading(false);
        return;
      }

      console.log('🔵 내 채팅방들의 메시지 데이터:', messagesData);

      // 4. 각 채팅방의 정보 구성
      const roomsData = await Promise.all(
        myRoomIds.map(async (roomId) => {
          // 해당 채팅방의 모든 메시지
          const roomMessages = messagesData.filter(msg => msg.room_id === roomId);

          // 마지막 메시지
          const lastMsg = roomMessages[0];

          // 상대방 ID 찾기 (chat_participants에서 나를 제외한 사용자)
          const { data: participantsData } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('room_id', roomId)
            .neq('user_id', user.id);

          if (!participantsData || participantsData.length === 0) {
            return null;
          }

          // 상대방 정보 가져오기 (첫 번째 상대방)
          const { data: otherUserData } = await supabase
            .from('users')
            .select('id, nickname, email, profile_image')
            .eq('id', participantsData[0].user_id)
            .single();

          if (!otherUserData) {
            return null;
          }

          return {
            id: roomId,
            nickname: otherUserData.nickname,
            email: otherUserData.email,
            profileImage: otherUserData.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserData.nickname}`,
            lastMessage: lastMsg ? lastMsg.content : '메시지가 없습니다',
            lastMessageDate: lastMsg ? lastMsg.created_at : null
          };
        })
      );

      // null 값 제거
      const validRooms = roomsData.filter(room => room !== null);
      console.log('🔵 유효한 채팅방 개수:', validRooms.length);

      // 최신순으로 정렬 (마지막 메시지 시간 기준)
      const sortedRooms = sortChatRoomsByLatestMessage([...validRooms]);

      console.log('🔵 정렬된 채팅방 목록 (최신순):', sortedRooms);
      console.log('🔵 정렬 기준: lastMessageDate (최근 메시지 시간 기준 최신순)');
      
      // 정렬 결과 로깅 (디버깅용)
      sortedRooms.forEach((room, index) => {
        console.log(`   ${index + 1}. ${room.nickname} - ${room.lastMessageDate || '메시지 없음'}`);
      });
      
      setChatRooms(sortedRooms);

    } catch (error) {
      console.error('❌ 채팅방 목록 로드 오류:', error);
      setChatRooms([]);
    } finally {
      console.log('🔵 로딩 완료');
      setLoading(false);
    }
  }, []);

  // 사용자의 온라인 상태 확인
  const getUserOnlineStatus = (userId) => {
    if (userId === currentUser?.id) {
      console.log('🔵 현재 사용자 온라인 상태:', userId, true);
      return { is_online: true }; // 현재 사용자는 항상 온라인으로 표시
    }
    
    const userStatus = onlineUsers.get(userId);
    console.log('🔵 사용자 온라인 상태 조회:', userId, userStatus);
    
    if (userStatus) {
      // Supabase에서 가져온 정확한 온라인 상태 반환
      const status = {
        is_online: userStatus.is_online,
        last_seen: userStatus.last_seen,
        updated_at: userStatus.updated_at
      };
      console.log('🔵 반환할 온라인 상태:', status);
      return status;
    }
    
    console.log('🔵 온라인 상태 없음, 기본값 false 반환:', userId);
    return { is_online: false };
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    console.log('🔵 Chatlist useEffect 실행');
    loadChatRooms();
  }, [loadChatRooms]);


  // localStorage 변경 감지 (로그아웃/로그인 시)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔵 Chatlist - localStorage 변경 감지, 데이터 새로고침');
      loadChatRooms();
    };

    // localStorage 변경 감지 (다른 탭)
    window.addEventListener('storage', handleStorageChange);

    // 같은 탭에서의 변경 감지를 위한 interval
    const intervalId = setInterval(() => {
      const storedUser = localStorage.getItem('currentUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // 사용자 정보가 변경되었는지 확인
      if (!parsedUser && currentUser) {
        // 로그아웃 감지
        console.log('🔵 Chatlist - 로그아웃 감지, 상태 초기화');
        setCurrentUser(null);
        setChatRooms([]);
        setLoading(false);
      } else if (parsedUser && (!currentUser || parsedUser.id !== currentUser.id)) {
        // 다른 사용자로 로그인
        console.log('🔵 Chatlist - 사용자 변경 감지, 데이터 새로고침');
        loadChatRooms();
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [currentUser, loadChatRooms]);

  // 온라인 상태 관리
  useEffect(() => {
    if (!currentUser?.id) return;

    let unsubscribeStatusChange;

    let onlineStatusChannel;

    const initializeOnlineStatus = async () => {
      try {
        // 온라인 상태 매니저 초기화
        await onlineStatusManager.initialize(currentUser.id);
        
        // 온라인 상태 변경 구독
        unsubscribeStatusChange = onlineStatusManager.onStatusChange((statusEntries) => {
          const newOnlineUsers = new Map(statusEntries);
          setOnlineUsers(newOnlineUsers);
        });

        // Supabase 실시간 온라인 상태 구독
        onlineStatusChannel = supabase
          .channel('online-status-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_online_status'
            },
            (payload) => {
              console.log('🔵 실시간 온라인 상태 변경:', payload);
              
              if (payload.new) {
                const { user_id, is_online, last_seen } = payload.new;
                setOnlineUsers(prev => {
                  const newMap = new Map(prev);
                  newMap.set(user_id, { 
                    is_online, 
                    last_seen,
                    updated_at: new Date().toISOString()
                  });
                  return newMap;
                });
              }
            }
          )
          .subscribe();

        // 초기 온라인 상태 데이터 로드
        const { data: initialOnlineStatus, error } = await supabase
          .from('user_online_status')
          .select('user_id, is_online, last_seen, updated_at');

        if (error) {
          console.error('❌ 초기 온라인 상태 로드 오류:', error);
        } else {
          console.log('🔵 초기 온라인 상태 로드:', initialOnlineStatus);
          const initialOnlineUsers = new Map();
          initialOnlineStatus?.forEach(status => {
            console.log('🔵 온라인 상태 설정:', status.user_id, status.is_online);
            initialOnlineUsers.set(status.user_id, {
              is_online: status.is_online,
              last_seen: status.last_seen,
              updated_at: status.updated_at
            });
          });
          console.log('🔵 최종 온라인 사용자 Map:', initialOnlineUsers);
          setOnlineUsers(initialOnlineUsers);
        }
      } catch (error) {
        console.error('❌ Chatlist - 온라인 상태 초기화 오류:', error);
      }
    };

    initializeOnlineStatus();

    return () => {
      if (unsubscribeStatusChange) {
        unsubscribeStatusChange();
      }
      if (onlineStatusChannel) {
        supabase.removeChannel(onlineStatusChannel);
      }
      // cleanup은 호출하지 않음 (싱글톤이므로 다른 페이지에서도 사용 중)
    };
  }, [currentUser?.id]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔵 실시간 메시지 구독 설정');

    // 새 메시지가 추가되면 채팅방 목록 업데이트
    const channel = supabase
      .channel('realtime:chatlist')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔵 새 메시지 수신:', payload.new);
          // 채팅방 목록 새로고침
          loadChatRooms();
        }
      )
      .subscribe((status) => {
        console.log('🔵 Realtime 구독 상태:', status);
      });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log('🔵 실시간 구독 해제');
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadChatRooms]);

  // 시간 표시 실시간 업데이트 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      // 강제로 리렌더링을 위해 상태 업데이트
      setChatRooms(prev => [...prev]);
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 전역 클릭 이벤트로 스와이프 닫기
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // 스와이프된 아이템이 있을 때만 처리
      if (swipedItemId) {
        // 클릭된 요소가 채팅 아이템이나 그 자식 요소가 아닌 경우
        const chatItem = e.target.closest('[data-chat-item]');
        const deleteButton = e.target.closest('[data-delete-button]');
        
        // 채팅 아이템이 아니고 삭제 버튼도 아닌 경우에만 스와이프 닫기
        if (!chatItem && !deleteButton) {
          console.log('🔵 전역 클릭으로 스와이프 닫기');
          // 부드러운 애니메이션을 위해 먼저 offset을 0으로 설정
          setSwipeOffset(0);
          // 약간의 지연 후 swipedItemId를 null로 설정
          setTimeout(() => {
            setSwipedItemId(null);
          }, 100);
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
  }, [swipedItemId]);

  // 스와이프 핸들러
  const handleTouchStart = (e, roomId) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e, roomId) => {
    if (!touchStartX.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // 수직 스크롤과 구분하기 위해 수평 이동이 더 클 때만 스와이프로 인식
    // 더 엄격한 조건: 수평 이동이 수직 이동의 2배 이상일 때만
    if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > 15) {
      isDragging.current = true;
      
      // 왼쪽으로 스와이프할 때만 처리
      if (deltaX < 0) {
        setSwipedItemId(roomId);
        setSwipeOffset(Math.max(deltaX, -80)); // 최대 80px까지 스와이프
      }
    }
  };

  const handleTouchEnd = (e, roomId) => {
    if (!isDragging.current) return;

    const currentX = e.changedTouches[0].clientX;
    const deltaX = currentX - touchStartX.current;

    // 스와이프가 충분히 크면 삭제 버튼 표시, 아니면 원래 위치로
    if (deltaX < -40) {
      setSwipeOffset(-80);
    } else {
      setSwipeOffset(0);
      setSwipedItemId(null);
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
    isDragging.current = false;
  };

  const handleChatItemClick = (roomId) => {
    // 스와이프된 상태가 아니면 채팅방 입장
    if (swipedItemId !== roomId) {
      navigate(`/chatting/${roomId}`);
    }
  };

  // 채팅방 나가기 함수
  const handleExitChatRoom = async (roomId) => {
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

      // 2. 남은 참가자가 있는지 확인
      const { data: remainingParticipants, error: checkError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', roomId);

      if (checkError) {
        console.error('❌ 남은 참가자 확인 오류:', checkError);
        throw checkError;
      }

      // 3. 참가자가 없으면 채팅방과 메시지 삭제
      if (!remainingParticipants || remainingParticipants.length === 0) {
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
      }

      // 4. 로컬 상태에서도 채팅방 제거
      setChatRooms(prev => prev.filter(room => room.id !== roomId));
      
      // 5. 스와이프 상태 초기화
      setSwipedItemId(null);
      setSwipeOffset(0);
      
      console.log('✅ 채팅방 나가기 완료');
      alert('채팅방을 나갔습니다.');
      
    } catch (error) {
      console.error('❌ 채팅방 나가기 오류:', error);
      alert('채팅방 나가기에 실패했습니다: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const date = new Date(dateString);
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const now = new Date();
    const nowKorean = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const diff = nowKorean - koreanTime;

    let result = '';

    // 1분 미만
    if (diff < 60 * 1000) {
      result = '방금 전';
    }
    // 1-59분
    else if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      result = `${minutes}분 전`;
    }
    // 1-23시간
    else if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      result = `${hours}시간 전`;
    }
    // 1-30일
    else if (diff < 30 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      result = `${days}일 전`;
    }
    // 1-12개월
    else if (diff < 365 * 24 * 60 * 60 * 1000) {
      const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
      result = `${months}개월 전`;
    }
    // 1년 이상
    else {
      const years = Math.floor(diff / (365 * 24 * 60 * 60 * 1000));
      result = `${years}년 전`;
    }

    console.log('🔵 시간 포맷팅 (한국시간):', dateString, '→', result, `(${Math.floor(diff / 1000)}초 전)`);
    return result;
  };

  if (loading) {
    return (
      <ChatlistWrapper>
        <CategoryTitle>채팅</CategoryTitle>
        <LoadingMessage>
          채팅 목록을 불러오는 중...
          <br />
          <small>콘솔을 확인해주세요 (F12)</small>
        </LoadingMessage>
      </ChatlistWrapper>
    );
  }

  return (
    <ChatlistWrapper>
      <CategoryTitle>채팅</CategoryTitle>
      {chatRooms.length === 0 ? (
        <EmptyMessage>
          <EmptyIcon>💬</EmptyIcon>
          <EmptyText>아직 채팅이 없습니다.</EmptyText>
          <EmptySubText>새로운 친구와 대화를 시작해보세요!</EmptySubText>
        </EmptyMessage>
      ) : (
        <ChatList>
          {chatRooms.map((chat) => {
            const isSwiped = swipedItemId === chat.id;
            return (
              <ChatItemContainer key={chat.id} data-chat-item={chat.id}>
                <ChatItem
                  $isSwiped={isSwiped}
                  $swipeOffset={swipeOffset}
                  onClick={() => handleChatItemClick(chat.id)}
                  onTouchStart={(e) => handleTouchStart(e, chat.id)}
                  onTouchMove={(e) => handleTouchMove(e, chat.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, chat.id)}
                >
                  <ProfileSection>
                    <ProfileImage src={chat.profileImage} alt={chat.nickname} />
                    <OnlineIndicator 
                      $isOnline={getUserOnlineStatus(chat.userId).is_online}
                      title={`${chat.nickname} - ${getUserOnlineStatus(chat.userId).is_online ? '온라인' : '오프라인'}`}
                    />
                  </ProfileSection>
                  <ChatInfo>
                    <ChatHeader>
                      <Nickname>{chat.nickname}</Nickname>
                      <LastMessageDate>
                        {formatDate(chat.lastMessageDate)}
                      </LastMessageDate>
                    </ChatHeader>
                    <LastMessage>{chat.lastMessage}</LastMessage>
                  </ChatInfo>
                </ChatItem>
                
                {/* 삭제 버튼 */}
                {isSwiped && (
                  <DeleteButtonContainer>
                    <DeleteButton 
                      data-delete-button={chat.id}
                      onClick={() => handleExitChatRoom(chat.id)}
                    >
                      <FiTrash2 size={20} />
                    </DeleteButton>
                  </DeleteButtonContainer>
                )}
              </ChatItemContainer>
            );
          })}
        </ChatList>
      )}
    </ChatlistWrapper>
  );
};

const ChatlistWrapper = styled.div`
  padding: 20px 0;
  padding-bottom: 70px;
`;

const CategoryTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #000;
`;

const DebugInfo = styled.div`
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
`;

const ChatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ChatItemContainer = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 12px;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  transform: translateX(${props => props.$swipeOffset || 0}px);
  z-index: 2;
  touch-action: pan-y pinch-zoom; /* 수직 스크롤과 줌은 허용, 수평 스크롤은 제한 */

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ProfileSection = styled.div`
  position: relative;
  margin-right: 12px;
`;

const ProfileImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  object-fit: cover;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 16px;
  height: 16px;
  background-color: ${props => props.$isOnline ? '#4CAF50' : '#9E9E9E'};
  border: 3px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 6px ${props => props.$isOnline ? 'rgba(76, 175, 80, 0.4)' : 'rgba(158, 158, 158, 0.4)'};
  animation: ${props => props.$isOnline ? 'pulse-online' : 'none'} 2s ease-in-out infinite;
  z-index: 10;

  @keyframes pulse-online {
    0%, 100% {
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 2px 12px rgba(76, 175, 80, 0.7);
      transform: scale(1.1);
    }
  }
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Nickname = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #000;
`;

const LastMessageDate = styled.span`
  font-size: 12px;
  color: #8e8e8e;
`;

const LastMessage = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;


const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  font-size: 14px;
  color: #666;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
`;

const EmptySubText = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0;
`;

const DeleteButtonContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  border-radius: 0 12px 12px 0;
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default Chatlist;