import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
  });

  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    age: false,
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    // 최소 8자, 영문, 숫자, 특수문자 포함
    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return re.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 실시간 유효성 검사
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value) {
          error = '이메일을 입력해주세요.';
        } else if (!validateEmail(value)) {
          error = '올바른 이메일 형식이 아닙니다.';
        }
        break;
      case 'nickname':
        if (!value) {
          error = '닉네임을 입력해주세요.';
        } else if (value.length < 2 || value.length > 10) {
          error = '닉네임은 2-10자 사이여야 합니다.';
        }
        break;
      case 'password':
        if (!value) {
          error = '비밀번호를 입력해주세요.';
        } else if (!validatePassword(value)) {
          error = '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = '비밀번호 확인을 입력해주세요.';
        } else if (value !== formData.password) {
          error = '비밀번호가 일치하지 않습니다.';
        }
        break;
      default:
        break;
    }
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return !error;
  };

  const handleNicknameCheck = async () => {
    if (!formData.nickname) {
      setErrors(prev => ({
        ...prev,
        nickname: '닉네임을 입력해주세요.'
      }));
      return;
    }
    // TODO: 닉네임 중복 확인 API 호출
    alert('사용 가능한 닉네임입니다.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 모든 필드 유효성 검사
    const isEmailValid = validateField('email', formData.email);
    const isNicknameValid = validateField('nickname', formData.nickname);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    // 약관 동의 확인
    if (!terms.service || !terms.privacy || !terms.age) {
      alert('모든 필수 약관에 동의해주세요.');
      return;
    }

    if (isEmailValid && isNicknameValid && isPasswordValid && isConfirmPasswordValid) {
      try {
        // TODO: 회원가입 API 호출
        console.log('회원가입 데이터:', formData);
        navigate('/login');
      } catch (error) {
        console.error('회원가입 실패:', error);
        alert('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <SignupWrapper>
      <SignupForm onSubmit={handleSubmit}>
        <Title>회원가입</Title>

        <InputGroup>
          <Label>이메일</Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="이메일을 입력하세요"
          />
          {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
        </InputGroup>

        <InputGroup>
          <Label>닉네임</Label>
          <NicknameWrapper>
            <Input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="닉네임을 입력하세요"
            />
            <CheckButton type="button" onClick={handleNicknameCheck}>
              중복확인
            </CheckButton>
          </NicknameWrapper>
          {errors.nickname && <ErrorMessage>{errors.nickname}</ErrorMessage>}
        </InputGroup>

        <InputGroup>
          <Label>비밀번호</Label>
          <PasswordWrapper>
            <Input
              type={showPassword.password ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(prev => ({
                ...prev,
                password: !prev.password
              }))}
            >
              {showPassword.password ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </PasswordWrapper>
          {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
        </InputGroup>

        <InputGroup>
          <Label>비밀번호 확인</Label>
          <PasswordWrapper>
            <Input
              type={showPassword.confirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="비밀번호를 다시 입력하세요"
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(prev => ({
                ...prev,
                confirmPassword: !prev.confirmPassword
              }))}
            >
              {showPassword.confirmPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </PasswordWrapper>
          {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
        </InputGroup>

        <TermsSection>
          <TermsTitle>약관 동의</TermsTitle>
          <TermsGroup>
            <TermsItem>
              <CheckboxWrapper>
                <Checkbox
                  type="checkbox"
                  id="service"
                  checked={terms.service}
                  onChange={(e) => setTerms(prev => ({
                    ...prev,
                    service: e.target.checked
                  }))}
                />
                <CheckboxCustom checked={terms.service} />
              </CheckboxWrapper>
              <TermsLabel htmlFor="service">
                서비스 이용약관 동의 (필수)
              </TermsLabel>
            </TermsItem>
            <TermsItem>
              <CheckboxWrapper>
                <Checkbox
                  type="checkbox"
                  id="privacy"
                  checked={terms.privacy}
                  onChange={(e) => setTerms(prev => ({
                    ...prev,
                    privacy: e.target.checked
                  }))}
                />
                <CheckboxCustom checked={terms.privacy} />
              </CheckboxWrapper>
              <TermsLabel htmlFor="privacy">
                개인정보 처리방침 동의 (필수)
              </TermsLabel>
            </TermsItem>
            <TermsItem>
              <CheckboxWrapper>
                <Checkbox
                  type="checkbox"
                  id="age"
                  checked={terms.age}
                  onChange={(e) => setTerms(prev => ({
                    ...prev,
                    age: e.target.checked
                  }))}
                />
                <CheckboxCustom checked={terms.age} />
              </CheckboxWrapper>
              <TermsLabel htmlFor="age">
                만 14세 이상입니다 (필수)
              </TermsLabel>
            </TermsItem>
          </TermsGroup>
        </TermsSection>

        <SignupButton type="submit">
          회원가입
        </SignupButton>

        <LoginLink onClick={() => navigate('/login')}>
          이미 계정이 있으신가요? 로그인하기
        </LoginLink>
      </SignupForm>
    </SignupWrapper>
  );
};

const SignupWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
`;

const SignupForm = styled.form`
  width: 100%;
  max-width: 480px;
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
  margin-bottom: 24px;
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

const NicknameWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const CheckButton = styled.button`
  padding: 0 20px;
  background-color: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: var(--primary-dark-blue);
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

const ErrorMessage = styled.span`
  display: block;
  color: var(--error-color);
  font-size: 12px;
  margin-top: 4px;
`;

const TermsSection = styled.div`
  margin-bottom: 24px;
`;

const TermsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

const TermsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TermsItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckboxWrapper = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
`;

const Checkbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
  z-index: 2;
`;

const CheckboxCustom = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.checked ? 'var(--primary-blue)' : '#d1d5db'};
  border-radius: 4px;
  background-color: ${props => props.checked ? 'var(--primary-blue)' : 'white'};
  pointer-events: none;
  transition: all 0.2s;

  &::after {
    content: '';
    position: absolute;
    display: ${props => props.checked ? 'block' : 'none'};
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const TermsLabel = styled.label`
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
`;

const SignupButton = styled.button`
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

const LoginLink = styled.p`
  text-align: center;
  font-size: 14px;
  color: var(--text-light);
  cursor: pointer;

  &:hover {
    color: var(--primary-blue);
  }
`;

export default Signup;