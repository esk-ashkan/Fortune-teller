import Button from "react-bootstrap/Button";
import "./select.css";

interface SelectInterface {
  text?: string;
  color?: string;
}

function SelectComponent({
  text = "click",
  color = "primary"
}: SelectInterface) {
  return (
    <Button className={`mystic-btn mystic-${color}`}>
      {text}
    </Button>
  );
}

export default SelectComponent;
