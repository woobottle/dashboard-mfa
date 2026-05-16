import { useNavigate } from "react-router-dom";

const NoAuthroizedPage = () => {
  const navigate = useNavigate();

  const onClickButton = () => {
    navigate('/')
  }

  return (
    <div>
      <h1>403</h1>
      <p>권한이 없습니다.</p>
      <button onClick={onClickButton}>뒤로 돌아가기</button>
    </div>
  )
};

export default NoAuthroizedPage;