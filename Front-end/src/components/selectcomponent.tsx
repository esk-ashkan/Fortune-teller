import Button from "react-bootstrap/Button";
import "./select.css";

interface SelectInterface {
  text?: string;
  color?: string;
  icon?: React.ReactNode;
  to: string;
  onSelect:()=>void;
}

function SelectComponent({
  onSelect,
  text = "click",
  color = "primary",
  icon,
}: SelectInterface) {
  

  return (
    <Button
      className={`mystic-btn mystic-${color}`}
      onClick={onSelect}
    >
      {icon && <span className="icon">{icon}</span>}
      {text}
    </Button>
  );
}

export default SelectComponent;