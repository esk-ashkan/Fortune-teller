import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router";
import "./select.css";

interface SelectInterface {
  text?: string;
  color?: string;
  icon?: React.ReactNode;
  to: string;
}

function SelectComponent({
  text = "click",
  color = "primary",
  icon,
  to,
}: SelectInterface) {
  const navigate = useNavigate();

  return (
    <Button
      className={`mystic-btn mystic-${color}`}
      onClick={() => navigate(to)}
    >
      {icon && <span className="icon">{icon}</span>}
      {text}
    </Button>
  );
}

export default SelectComponent;