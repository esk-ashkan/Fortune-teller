import Card from 'react-bootstrap/Card';

interface CardInterface{
    name: string;
}

function CardsComponent({name}: CardInterface) {
  return (
    <Card style={{ width: '100px' }}>
      <Card.Img variant="top" src="../../assets/tarot.png" />
      
    </Card>
  );
}

export default CardsComponent;