import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/supabase';

const Recovery = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('password'); // 'id' or 'password'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    verificationCode: '',
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone.replace(/-/g, ''));
  };

  const handleSendVerification = async () => {
    setError('');
    setSuccess('');

    if (activeTab === 'id') {
      // 아이디 찾기 - 현재 앱은 이메일이 아이디이므로 간단히 처리
      if (!formData.email) {
        setError('이메일을 입력해주세요.');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('올바른 이메일 형식이 아닙니다.');
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await auth.findUserByEmail(formData.email);

        if (error || !data) {
          setError('해당 이메일로 가입된 계정을 찾을 수 없습니다.');
          return;
        }

        setSuccess(`가입된 이메일: ${data.email}\n닉네임: ${data.nickname}`);
        setStep(2);
      } catch (error) {
        setError('계정 조회에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 비밀번호 찾기 - Supabase 비밀번호 재설정 이메일 발송
      if (!formData.email) {
        setError('이메일을 입력해주세요.');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('올바른 이메일 형식이 아닙니다.');
        return;
      }

      setIsLoading(true);
      try {
        console.log('🔵 비밀번호 재설정 이메일 발송:', formData.email);
        const { error } = await auth.sendPasswordResetEmail(formData.email);

        if (error) {
          console.error('❌ 비밀번호 재설정 이메일 발송 실패:', error);
          setError('비밀번호 재설정 이메일 발송에 실패했습니다.');
          return;
        }

        console.log('✅ 비밀번호 재설정 이메일 발송 완료');
        setSuccess('비밀번호 재설정 링크가 이메일로 전송되었습니다.\n이메일을 확인해주세요.');
        setStep(2);
      } catch (error) {
        console.error('❌ 비밀번호 재설정 예외:', error);
        setError('비밀번호 재설정 이메일 발송에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerify = async () => {
    // 이 함수는 이제 사용하지 않지만, 추후 확장을 위해 유지
    navigate('/login');
  };

  return (
    <RecoveryWrapper>
      <RecoveryForm>
        <Title>계정 찾기</Title>

        <TabGroup>
          <Tab
            $active={activeTab === 'id'}
            onClick={() => {
              setActiveTab('id');
              setStep(1);
              setError('');
              setSuccess('');
              setIsVerificationSent(false);
            }}
          >
            아이디 찾기
          </Tab>
          <Tab
            $active={activeTab === 'password'}
            onClick={() => {
              setActiveTab('password');
              setStep(1);
              setError('');
              setSuccess('');
              setIsVerificationSent(false);
            }}
          >
            비밀번호 찾기
          </Tab>
        </TabGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {step === 1 && activeTab === 'id' && (
          <InputGroup>
            <Label>가입한 이메일</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="가입 시 사용한 이메일을 입력하세요"
            />
            <HelpText>이메일이 곧 아이디입니다.</HelpText>
          </InputGroup>
        )}

        {step === 1 && activeTab === 'password' && (
          <InputGroup>
            <Label>가입한 이메일</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="가입 시 사용한 이메일을 입력하세요"
            />
            <HelpText>비밀번호 재설정 링크가 이메일로 전송됩니다.</HelpText>
          </InputGroup>
        )}

        {step === 2 && activeTab === 'id' && (
          <ResultBox>
            <ResultTitle>✅ 계정을 찾았습니다</ResultTitle>
            <ResultText>{success}</ResultText>
          </ResultBox>
        )}

        {step === 2 && activeTab === 'password' && (
          <ResultBox>
            <ResultTitle>📧 이메일이 전송되었습니다</ResultTitle>
            <ResultText>{success}</ResultText>
            <HelpText>
              이메일이 도착하지 않았다면:
              <br />
              1. 스팸 메일함을 확인하세요
              <br />
              2. 이메일 주소가 올바른지 확인하세요
              <br />
              3. 아래 버튼으로 다시 전송하세요
            </HelpText>
          </ResultBox>
        )}

        {step === 1 && (
          <ActionButton
            type="button"
            onClick={handleSendVerification}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : activeTab === 'id' ? '계정 찾기' : '재설정 링크 받기'}
          </ActionButton>
        )}

        {step === 2 && activeTab === 'password' && (
          <ActionButton
            type="button"
            onClick={handleSendVerification}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '이메일 다시 보내기'}
          </ActionButton>
        )}

        <ButtonGroup>
          <BackButton onClick={() => navigate(-1)}>
            뒤로가기
          </BackButton>
          <BackToLogin onClick={() => navigate('/login')}>
            로그인으로 돌아가기
          </BackToLogin>
        </ButtonGroup>
      </RecoveryForm>
    </RecoveryWrapper>
  );
};

const RecoveryWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const RecoveryForm = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--bg-card);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 32px;
  text-align: center;
`;

const TabGroup = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? 'var(--primary-blue)' : 'transparent'};
  color: ${props => props.$active ? 'var(--primary-blue)' : 'var(--text-light)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--primary-blue);
  }
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-input);

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const VerificationWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const ResendButton = styled.button`
  padding: 0 16px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: var(--border-color);
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background-color: #ffe5e5;
  border: 1px solid #ffcccc;
  white-space: pre-line;
`;

const SuccessMessage = styled.div`
  color: #155724;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  white-space: pre-line;
  line-height: 1.5;
`;

const HelpText = styled.p`
  font-size: 13px;
  color: var(--text-light);
  margin-top: 8px;
  line-height: 1.5;
`;

const ResultBox = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  text-align: center;
`;

const ResultTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
`;

const ResultText = styled.p`
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-line;
  margin-bottom: 16px;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: var(--primary-dark-blue);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const BackButton = styled.button`
  font-size: 14px;
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: var(--primary-blue);
  }
`;

const BackToLogin = styled.button`
  font-size: 14px;
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: var(--primary-blue);
  }
`;

export default Recovery;