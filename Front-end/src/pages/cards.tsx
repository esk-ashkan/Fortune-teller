import Card from "react-bootstrap/Card";
import tarotImg from "../assets/tarot.png";

interface CardProps {
  onSelect?: () => void;
}

function CardsComponent({ onSelect }: CardProps) {
  return (
    <Card
      className="tarot-card"
      onClick={onSelect}
    >
      <Card.Img
        variant="top"
        src={tarotImg}
        className="tarot-card-img"
      />
    </Card>
  );
}

export default CardsComponent;