import React from 'react';
import Router from './routes/Router';
import styled from 'styled-components';

function App() {
  return (
    <AppContainer>
      <Router />
    </AppContainer>
  );
}

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  max-width: var(--mobile-width);
  margin: 0 auto;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  @media screen and (min-width: 768px) {
    max-width: var(--tablet-width);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  }
`;

export default App;