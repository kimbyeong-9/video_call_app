import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { auth, supabase } from '../../utils/supabase';
import NotificationPopup from '../../components/common/NotificationPopup';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'error'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 입력 시 알림 메시지 초기화
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setNotification({
        show: true,
        message: '이메일과 비밀번호를 모두 입력해주세요.',
        type: 'error'
      });
      return;
    }

    try {
      // Supabase Auth로 로그인 시도
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        // 이메일 존재 여부 확인
        const { data: emailCheck } = await supabase
          .from('users')
          .select('email')
          .eq('email', formData.email)
          .single();

        if (!emailCheck) {
          setNotification({
            show: true,
            message: '등록되지 않은 아이디입니다.',
            type: 'error'
          });
        } else {
          setNotification({
            show: true,
            message: '비밀번호가 일치하지 않습니다.',
            type: 'error'
          });
        }
        return;
      }

      // 사용자 추가 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      // 로그인 성공
      setNotification({
        show: true,
        message: '로그인에 성공했습니다.',
        type: 'success'
      });

      // 세션 저장 (localStorage 사용)
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname
      }));

      // 1초 후 홈으로 이동
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('로그인 에러:', error);
      setNotification({
        show: true,
        message: '로그인 중 오류가 발생했습니다.',
        type: 'error'
      });
    }
  };

  const handleSocialLogin = (provider) => {
    // TODO: 소셜 로그인 구현
    console.log(`${provider} 로그인 시도`);
  };

  return (
    <LoginWrapper>
      {notification.show && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}
      <LoginForm onSubmit={handleSubmit}>
        <Title>로그인</Title>

        <InputGroup>
          <Label>이메일</Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="이메일을 입력하세요"
          />
        </InputGroup>

        <InputGroup>
          <Label>비밀번호</Label>
          <PasswordWrapper>
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </PasswordWrapper>
        </InputGroup>

        <LoginButton type="submit">
          로그인
        </LoginButton>

        <Divider>
          <DividerLine />
          <DividerText>또는</DividerText>
          <DividerLine />
        </Divider>

        <SocialLoginSection>
          <SocialButton
            type="button"
            onClick={() => handleSocialLogin('google')}
            social="google"
          >
            <FcGoogle size={20} />
            Google로 계속하기
          </SocialButton>
        </SocialLoginSection>

        <LinksSection>
          <RecoveryLinks>
            <RecoveryLink onClick={() => navigate('/recovery')}>
              아이디/비밀번호 찾기
            </RecoveryLink>
          </RecoveryLinks>
          <SignupLink onClick={() => navigate('/signup')}>
            회원가입
          </SignupLink>
        </LinksSection>
      </LoginForm>
    </LoginWrapper>
  );
};

const LoginWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const LoginForm = styled.form`
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
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-input);

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;

  &:focus {
    outline: none;
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

const LoginButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--primary-dark-blue);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background-color: var(--border-color);
`;

const DividerText = styled.span`
  padding: 0 16px;
  color: var(--text-light);
  font-size: 14px;
`;

const SocialLoginSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const SocialButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  ${props => props.social === 'google' && `
    background-color: white;
    border: 1px solid var(--border-color);
    color: var(--text-primary);

    &:hover {
      background-color: #f8f9fa;
    }
  `}

  ${props => props.social === 'facebook' && `
    background-color: #1877f2;
    border: none;
    color: white;

    &:hover {
      background-color: #166fe5;
    }
  `}
`;

const LinksSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const RecoveryLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RecoveryLink = styled.span`
  font-size: 14px;
  color: var(--text-light);
  cursor: pointer;
  text-align: center;

  &:hover {
    color: var(--primary-blue);
  }
`;

const SignupLink = styled.span`
  font-size: 14px;
  color: var(--primary-blue);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export default Login;