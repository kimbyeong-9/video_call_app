import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabase';

const SessionInfo = () => {
  const [localStorageData, setLocalStorageData] = useState(null);
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [browserInfo, setBrowserInfo] = useState('');

  useEffect(() => {
    loadSessionInfo();
  }, []);

  const loadSessionInfo = async () => {
    // localStorage 확인
    const currentUser = localStorage.getItem('currentUser');
    setLocalStorageData(currentUser ? JSON.parse(currentUser) : null);

    // Supabase 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    setSupabaseSession(session);

    // 브라우저 정보
    setBrowserInfo(navigator.userAgent);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    alert('localStorage가 초기화되었습니다. 페이지를 새로고침하세요.');
    window.location.reload();
  };

  return (
    <Container>
      <Title>🔍 세션 디버그 정보</Title>

      <Section>
        <SectionTitle>📦 localStorage 정보</SectionTitle>
        {localStorageData ? (
          <CodeBlock>
            <div><strong>ID:</strong> {localStorageData.id}</div>
            <div><strong>Email:</strong> {localStorageData.email}</div>
            <div><strong>Nickname:</strong> {localStorageData.nickname}</div>
          </CodeBlock>
        ) : (
          <EmptyState>localStorage에 사용자 정보 없음</EmptyState>
        )}
      </Section>

      <Section>
        <SectionTitle>🔐 Supabase 세션 정보</SectionTitle>
        {supabaseSession ? (
          <CodeBlock>
            <div><strong>User ID:</strong> {supabaseSession.user.id}</div>
            <div><strong>Email:</strong> {supabaseSession.user.email}</div>
            <div><strong>Session 만료:</strong> {new Date(supabaseSession.expires_at * 1000).toLocaleString()}</div>
          </CodeBlock>
        ) : (
          <EmptyState>Supabase 세션 없음</EmptyState>
        )}
      </Section>

      <Section>
        <SectionTitle>🌐 브라우저 정보</SectionTitle>
        <CodeBlock>
          <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>{browserInfo}</div>
        </CodeBlock>
      </Section>

      <ButtonGroup>
        <Button onClick={loadSessionInfo}>🔄 새로고침</Button>
        <Button onClick={clearLocalStorage} $danger>🗑️ localStorage 초기화</Button>
      </ButtonGroup>

      <Alert>
        ⚠️ <strong>중요:</strong> 영상통화 테스트 시 각 브라우저에서 <strong>다른 User ID</strong>가 표시되어야 합니다!
      </Alert>
    </Container>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 30px;
  text-align: center;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #555;
  margin-bottom: 15px;
`;

const CodeBlock = styled.div`
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: #333;

  div {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: #007AFF;
    margin-right: 8px;
  }
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin: 30px 0;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$danger ? '#F44336' : '#007AFF'};
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Alert = styled.div`
  background: #FFF3CD;
  border: 1px solid #FFE69C;
  border-radius: 8px;
  padding: 16px;
  color: #856404;
  font-size: 14px;
  line-height: 1.6;

  strong {
    font-weight: 700;
  }
`;

export default SessionInfo;

