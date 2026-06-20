import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import "./select.css";

interface SelectInterface {
  text?: string;
  color?: string;
  icon?: React.ReactNode;
  to: string;
}

function SelectComponent({ text = "click", color = "primary", icon, to }: SelectInterface) {
  return (
    <Button className={`mystic-btn mystic-${color}`}>
      <Link className="icon-link" to={to}>
        {icon && <span className="icon">{icon}</span>}
        {text}
      </Link>
    </Button>
  );
}

export default SelectComponent;
