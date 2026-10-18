import Dropdown from "react-bootstrap/Dropdown";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import "./dropdown.css";

interface DropDownItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

interface DPInterface {
  text: string | ReactNode;
  items: DropDownItem[];
  align?: "start" | "end";
}

function DropDownComp({ text, items, align = "end" }: DPInterface) {
  const navigate = useNavigate();

  const handleClick = (item: DropDownItem) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <Dropdown align={align} className="cosmic-dropdown">
      <Dropdown.Toggle variant="cosmic" id="cosmic-dropdown-toggle">
        {text}
      </Dropdown.Toggle>

      <Dropdown.Menu className="cosmic-dropdown-menu">
        {items.map((item, index) => (
          <Dropdown.Item
            key={index}
            as="button"
            className="cosmic-dropdown-item"
            onClick={handleClick(item)}
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default DropDownComp;