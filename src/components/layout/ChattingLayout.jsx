import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

const ChattingLayout = () => {
  return (
    <ChattingWrapper>
      <Outlet />
    </ChattingWrapper>
  );
};

const ChattingWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

export default ChattingLayout;
