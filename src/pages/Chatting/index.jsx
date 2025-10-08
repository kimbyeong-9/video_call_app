import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Chatting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <ChattingContainer>
      <ChatHeader>
        <BackButton onClick={() => navigate(-1)}>←</BackButton>
        <RoomTitle>채팅방 {roomId}</RoomTitle>
      </ChatHeader>
      
      <ChatContent>
        {/* 채팅 메시지들이 여기에 표시됩니다 */}
      </ChatContent>

      <ChatInput>
        <input type="text" placeholder="메시지를 입력하세요..." />
        <button>전송</button>
      </ChatInput>
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
`;

const ChatInput = styled.div`
  width: 100%;
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;

  input {
    flex: 1;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    outline: none;
    font-size: 1rem;

    &:focus {
      border-color: #007aff;
    }
  }

  button {
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
  }
`;

export default Chatting;