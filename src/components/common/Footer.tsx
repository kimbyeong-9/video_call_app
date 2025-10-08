import styled from 'styled-components';

const Footer = () => {
  return (
    <FooterWrapper>
      <p>&copy; 2025 Video Call App. All rights reserved.</p>
    </FooterWrapper>
  );
};

const FooterWrapper = styled.footer`
  padding: 1rem;
  background-color: #f8f9fa;
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
`;

export default Footer;
