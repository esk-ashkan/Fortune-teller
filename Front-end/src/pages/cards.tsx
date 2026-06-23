import Card from "react-bootstrap/Card";
import tarotImg from "../assets/tarot.png";

interface CardProps {
  onSelect?: () => void;
}

function CardsComponent({ onSelect }: CardProps) {
  return (
    <Card
      style={{ width: "30x"}}
      onClick={onSelect}
    >
      <Card.Img variant="top" src={tarotImg} />
    </Card>
  );
}

export default CardsComponent;
