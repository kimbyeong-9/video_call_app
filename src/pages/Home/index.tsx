import styled from 'styled-components';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';

const Home = () => {
  return (
    <HomeWrapper>
      <Header />
      <MainContent>
        <h2>Welcome to Video Call App</h2>
        <p>Start your video call journey here!</p>
      </MainContent>
      <Footer />
    </HomeWrapper>
  );
};

const HomeWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  text-align: center;
`;

export default Home;
