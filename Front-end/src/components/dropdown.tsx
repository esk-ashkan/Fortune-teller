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

  return (
    <Dropdown align={align} className="cosmic-dropdown">
      <Dropdown.Toggle variant="cosmic" id="cosmic-dropdown-toggle">
        {text}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="cosmic-dropdown-menu"
        popperConfig={{ strategy: "fixed" }}
        style={{ zIndex: 3000 }}
      >
        {items.map((item, index) => (
          <Dropdown.Item
            key={index}
            as="button"
            type="button"
            className="cosmic-dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.onClick) item.onClick();
              else if (item.href) navigate(item.href);
            }}
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default DropDownComp;