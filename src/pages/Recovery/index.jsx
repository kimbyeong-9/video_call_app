import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Recovery = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('id'); // 'id' or 'password'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    verificationCode: '',
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);

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
    if (activeTab === 'id') {
      if (!formData.name || !formData.phone) {
        setError('모든 필드를 입력해주세요.');
        return;
      }
      if (!validatePhone(formData.phone)) {
        setError('올바른 전화번호 형식이 아닙니다.');
        return;
      }
    } else {
      if (!formData.email) {
        setError('이메일을 입력해주세요.');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('올바른 이메일 형식이 아닙니다.');
        return;
      }
    }

    try {
      // TODO: 인증번호 발송 API 호출
      setIsVerificationSent(true);
      setStep(2);
    } catch (error) {
      setError('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleVerify = async () => {
    if (!formData.verificationCode) {
      setError('인증번호를 입력해주세요.');
      return;
    }

    try {
      // TODO: 인증번호 확인 및 계정 찾기 API 호출
      // 성공 시 결과 페이지로 이동 또는 임시 비밀번호 발급
      alert('인증이 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      setError('인증에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <RecoveryWrapper>
      <RecoveryForm>
        <Title>계정 찾기</Title>

        <TabGroup>
          <Tab
            active={activeTab === 'id'}
            onClick={() => {
              setActiveTab('id');
              setStep(1);
              setError('');
              setIsVerificationSent(false);
            }}
          >
            아이디 찾기
          </Tab>
          <Tab
            active={activeTab === 'password'}
            onClick={() => {
              setActiveTab('password');
              setStep(1);
              setError('');
              setIsVerificationSent(false);
            }}
          >
            비밀번호 찾기
          </Tab>
        </TabGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {step === 1 && activeTab === 'id' && (
          <>
            <InputGroup>
              <Label>이름</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="이름을 입력하세요"
              />
            </InputGroup>

            <InputGroup>
              <Label>휴대폰 번호</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="휴대폰 번호를 입력하세요"
              />
            </InputGroup>
          </>
        )}

        {step === 1 && activeTab === 'password' && (
          <InputGroup>
            <Label>가입한 이메일</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="이메일을 입력하세요"
            />
          </InputGroup>
        )}

        {step === 2 && (
          <InputGroup>
            <Label>인증번호</Label>
            <VerificationWrapper>
              <Input
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="인증번호 6자리를 입력하세요"
                maxLength={6}
              />
              <ResendButton
                type="button"
                onClick={handleSendVerification}
              >
                재발송
              </ResendButton>
            </VerificationWrapper>
          </InputGroup>
        )}

        <ActionButton
          type="button"
          onClick={step === 1 ? handleSendVerification : handleVerify}
        >
          {step === 1 ? '인증번호 받기' : '확인'}
        </ActionButton>

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
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-blue)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-blue)' : 'var(--text-light)'};
  font-weight: ${props => props.active ? '600' : '400'};
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
  padding: 8px;
  border-radius: 4px;
  background-color: var(--error-bg);
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
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--primary-dark-blue);
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