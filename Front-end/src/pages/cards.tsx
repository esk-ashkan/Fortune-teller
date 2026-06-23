import Card from 'react-bootstrap/Card';
import card1 from "../assets/card1.png";

//interface CardInterface{
//    name: string;
//}

function CardsComponent() {
  return (
    <Card style={{ width: '100px' }}>
      <Card.Img variant="top" src={card1} />
    </Card>
  );
}

export default CardsComponent;