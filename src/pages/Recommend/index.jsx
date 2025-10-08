import React from 'react';
import styled from 'styled-components';

const Recommend = () => {
  return (
    <RecommendWrapper>
      <h2>친구 추천</h2>
      {/* 친구 추천 리스트가 들어갈 자리 */}
    </RecommendWrapper>
  );
};

const RecommendWrapper = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px 16px;
  padding-bottom: 70px; // Bottom Tabs 높이만큼 여백
`;

export default Recommend;
