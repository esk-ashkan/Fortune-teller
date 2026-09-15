import Dropdown from 'react-bootstrap/Dropdown';
import type { ReactNode } from 'react';
import './dropdown.css';

interface DropDownItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

interface DPInterface {
  text: string | ReactNode;
  items: DropDownItem[];
  align?: 'start' | 'end';
}

function DropDownComp({ 
  text, 
  items, 
  align = 'end'
}: DPInterface) {
  return (
    <Dropdown align={align} className="cosmic-dropdown">
      <Dropdown.Toggle variant="cosmic" id="cosmic-dropdown-toggle">
        {text}
      </Dropdown.Toggle>

      <Dropdown.Menu className="cosmic-dropdown-menu">
        {items.map((item, index) => (
          <Dropdown.Item
            key={index}
            href={item.href}
            onClick={item.onClick}
            className="cosmic-dropdown-item"
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default DropDownComp;