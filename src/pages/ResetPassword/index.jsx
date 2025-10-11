import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, supabase } from '../../utils/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // URL에서 에러 파라미터 확인
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorParam = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        console.log('🔵 URL 파라미터:', { errorParam, errorCode, errorDescription });

        // 에러가 있는 경우 처리
        if (errorParam) {
          if (errorCode === 'otp_expired') {
            setError('비밀번호 재설정 링크가 만료되었습니다.\n새로운 링크를 다시 요청해주세요.');
          } else if (errorParam === 'access_denied') {
            setError('접근이 거부되었습니다.\n비밀번호 재설정을 다시 시도해주세요.');
          } else {
            setError(`오류가 발생했습니다: ${errorDescription || errorParam}`);
          }
          return;
        }

        // URL에서 access_token 확인 (Supabase가 리다이렉트 시 포함)
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log('🔵 비밀번호 재설정 페이지 접근:', { accessToken: !!accessToken, type });

        if (!accessToken) {
          setError('유효하지 않은 비밀번호 재설정 링크입니다.\n링크를 다시 확인해주세요.');
          return;
        }

        if (type !== 'recovery') {
          setError('잘못된 링크 유형입니다.');
          return;
        }

        // Supabase 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error('❌ 세션 확인 실패:', sessionError);
          setError('세션이 만료되었습니다.\n비밀번호 재설정을 다시 시도해주세요.');
          return;
        }

        console.log('✅ 유효한 세션 확인됨');
        setIsValidSession(true);
      } catch (error) {
        console.error('❌ 세션 확인 예외:', error);
        setError('세션 확인 중 오류가 발생했습니다.');
      }
    };

    checkSession();
  }, []);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    if (password.length > 72) {
      return '비밀번호는 72자를 초과할 수 없습니다.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 유효성 검사
    if (!password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔵 비밀번호 변경 시작');
      const { error } = await auth.updatePassword(password);

      if (error) {
        console.error('❌ 비밀번호 변경 실패:', error);
        setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      console.log('✅ 비밀번호 변경 완료');
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('❌ 비밀번호 변경 예외:', error);
      setError('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResetPasswordWrapper>
      <ResetPasswordForm onSubmit={handleSubmit}>
        <Title>비밀번호 재설정</Title>
        <Subtitle>새로운 비밀번호를 입력해주세요</Subtitle>

        {error && (
          <>
            <ErrorMessage>{error}</ErrorMessage>
            <RetryButton onClick={() => navigate('/recovery')}>
              비밀번호 재설정 다시 요청하기
            </RetryButton>
          </>
        )}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {!success && !error && !isValidSession && (
          <LoadingMessage>세션을 확인하는 중...</LoadingMessage>
        )}

        {!success && isValidSession && (
          <>
            <InputGroup>
              <Label>새 비밀번호</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                disabled={isLoading}
              />
            </InputGroup>

            <InputGroup>
              <Label>비밀번호 확인</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                disabled={isLoading}
              />
            </InputGroup>

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </SubmitButton>
          </>
        )}

        {success && (
          <SuccessBox>
            <SuccessIcon>✓</SuccessIcon>
            <SuccessTitle>비밀번호가 변경되었습니다!</SuccessTitle>
            <SuccessText>잠시 후 로그인 페이지로 이동합니다...</SuccessText>
          </SuccessBox>
        )}

        <BackToLogin onClick={() => navigate('/login')}>
          로그인으로 돌아가기
        </BackToLogin>
      </ResetPasswordForm>
    </ResetPasswordWrapper>
  );
};

const ResetPasswordWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const ResetPasswordForm = styled.form`
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
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 32px;
  text-align: center;
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

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
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
  line-height: 1.6;
`;

const RetryButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;

  &:hover {
    background-color: #5a6268;
  }
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
`;

const LoadingMessage = styled.div`
  color: var(--text-light);
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
  padding: 32px;
`;

const SubmitButton = styled.button`
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

const SuccessBox = styled.div`
  text-align: center;
  padding: 32px 0;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background-color: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
`;

const SuccessTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const SuccessText = styled.p`
  font-size: 14px;
  color: var(--text-light);
`;

const BackToLogin = styled.button`
  display: block;
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: var(--text-light);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 0;

  &:hover {
    color: var(--primary-blue);
  }
`;

export default ResetPassword;
