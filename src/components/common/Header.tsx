import styled from 'styled-components';

const Header = () => {
  return (
    <HeaderWrapper>
      <h1>Video Call App</h1>
    </HeaderWrapper>
  );
};

const HeaderWrapper = styled.header`
  padding: 1rem;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export default Header;
