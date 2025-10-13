import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <TermsWrapper>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft size={24} />
        </BackButton>
        <Title>이용정책</Title>
        <Spacer />
      </Header>

      <Content>
        <Section>
          <SectionTitle>1. 서비스 이용 약관</SectionTitle>
          <SectionContent>
            본 서비스는 사용자 간의 소통과 연결을 위한 플랫폼입니다. 
            서비스를 이용하시는 모든 사용자는 본 약관에 동의한 것으로 간주됩니다.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>2. 개인정보 보호정책</SectionTitle>
          <SectionContent>
            • 수집하는 개인정보: 이메일, 닉네임, 프로필 이미지, 관심사<br/>
            • 개인정보 이용목적: 서비스 제공, 사용자 식별, 커뮤니케이션<br/>
            • 개인정보 보유기간: 계정 삭제 시까지<br/>
            • 개인정보는 안전하게 암호화되어 저장됩니다.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>3. 사용자 행동 규칙</SectionTitle>
          <SectionContent>
            • 타인을 존중하고 예의바른 소통을 해주세요<br/>
            • 부적절한 콘텐츠나 스팸은 금지됩니다<br/>
            • 개인정보를 무단으로 수집하거나 유출하지 마세요<br/>
            • 저작권을 침해하는 행위는 금지됩니다
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>4. 서비스 제공 및 변경</SectionTitle>
          <SectionContent>
            • 서비스는 24시간 제공되나, 시스템 점검 시 일시 중단될 수 있습니다<br/>
            • 서비스 내용은 사전 공지 후 변경될 수 있습니다<br/>
            • 서비스 이용 중 발생한 문제는 고객센터로 문의해주세요
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>5. 면책사항</SectionTitle>
          <SectionContent>
            • 사용자 간의 소통에서 발생하는 문제는 해당 사용자들이 해결해야 합니다<br/>
            • 시스템 오류나 해킹으로 인한 피해에 대해서는 최선을 다해 복구하겠습니다<br/>
            • 서비스 이용 중 발생한 손실에 대해 책임을 지지 않습니다
          </SectionContent>
        </Section>

        <ContactSection>
          <ContactTitle>문의하기</ContactTitle>
          <ContactContent>
            서비스 이용 중 궁금한 점이 있으시면 언제든 문의해주세요.<br/>
            이메일: support@travo.com<br/>
            운영시간: 평일 09:00 - 18:00
          </ContactContent>
        </ContactSection>
      </Content>
    </TermsWrapper>
  );
};

const TermsWrapper = styled.div`
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

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-blue);
  margin: 0 0 12px 0;
`;

const SectionContent = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const ContactSection = styled.div`
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark-blue) 100%);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  color: white;
`;

const ContactTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const ContactContent = styled.div`
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
`;

export default Terms;
