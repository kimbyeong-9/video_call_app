import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const Notices = () => {
  const navigate = useNavigate();

  const notices = [
    {
      id: 1,
      title: '새로운 기능 업데이트 안내',
      content: '채팅 기능과 프로필 편집 기능이 추가되었습니다.',
      date: '2025-01-10',
      isImportant: true
    },
    {
      id: 2,
      title: '서비스 이용 정책 변경',
      content: '개인정보 보호를 위한 정책이 업데이트되었습니다.',
      date: '2025-01-05',
      isImportant: false
    },
    {
      id: 3,
      title: '시스템 점검 안내',
      content: '더 나은 서비스 제공을 위해 시스템 점검을 진행합니다.',
      date: '2025-01-01',
      isImportant: false
    }
  ];

  return (
    <NoticesWrapper>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft size={24} />
        </BackButton>
        <Title>공지사항</Title>
        <Spacer />
      </Header>

      <Content>
        {notices.map((notice) => (
          <NoticeItem key={notice.id}>
            <NoticeHeader>
              <NoticeTitle isImportant={notice.isImportant}>
                {notice.title}
              </NoticeTitle>
              {notice.isImportant && <ImportantBadge>중요</ImportantBadge>}
            </NoticeHeader>
            <NoticeContent>{notice.content}</NoticeContent>
            <NoticeDate>{notice.date}</NoticeDate>
          </NoticeItem>
        ))}
      </Content>
    </NoticesWrapper>
  );
};

const NoticesWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8fafc;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const Spacer = styled.div`
  width: 40px;
`;

const Content = styled.div`
  padding: 20px 0;
  padding-bottom: 70px;
`;

const NoticeItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const NoticeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NoticeTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
`;

const ImportantBadge = styled.span`
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  margin-left: 8px;
`;

const NoticeContent = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 12px 0;
`;

const NoticeDate = styled.span`
  font-size: 12px;
  color: var(--text-light);
`;

export default Notices;
