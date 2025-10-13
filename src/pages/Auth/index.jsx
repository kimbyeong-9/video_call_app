import React from 'react';
import styled from 'styled-components';

const Auth = () => {
  return (
    <AuthWrapper>
      <h2>Auth Page</h2>
    </AuthWrapper>
  );
};

const AuthWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;

  h2 {
    margin-bottom: 20px;
  }
`;

export default Auth;
