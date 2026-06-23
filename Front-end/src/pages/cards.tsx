import Card from 'react-bootstrap/Card';
import tarotImg from "../assets/tarot.png";

//interface CardInterface{
//    name: string;
//}

function CardsComponent() {
  return (
    <Card style={{ width: '100px' }}>
      <Card.Img variant="top" src={tarotImg} />
    </Card>
  );
}

export default CardsComponent;