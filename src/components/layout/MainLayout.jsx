import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';
import styled from 'styled-components';

const MainLayout = () => {
  return (
    <LayoutWrapper>
      <Header />
      <MainContent>
        <Outlet />
      </MainContent>
      <Footer />
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px 0;
  padding-bottom: 70px;

  @media screen and (min-width: 768px) {
    padding: 40px 0;
    padding-bottom: 80px;
  }
`;

export default MainLayout;
