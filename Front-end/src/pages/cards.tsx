import Card from "react-bootstrap/Card";
import tarotImg from "../assets/tarot.png";

interface CardProps {
  onSelect?: () => void;
}

function CardsComponent({ onSelect }: CardProps) {
  return (
    <Card
      style={{
        width: "80px",
        cursor: "pointer",
        margin: "0 auto",
        background: "transparent",
        border: "none",
      }}
      onClick={onSelect}
    >
      <Card.Img
        variant="top"
        src={tarotImg}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 6,
        }}
      />
    </Card>
  );
}

export default CardsComponent;
