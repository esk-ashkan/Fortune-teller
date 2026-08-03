import Card from "react-bootstrap/Card";
import tarotImg from "../assets/tarot.png";

interface CardProps {
  onSelect?: () => void;
  selected?: boolean;
}

function CardsComponent({ onSelect, selected = false }: CardProps) {
  return (
    <Card
      className={`tarot-card ${selected ? 'selected' : ''}`} 
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