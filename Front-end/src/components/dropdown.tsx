import Dropdown from 'react-bootstrap/Dropdown';

interface DPInterface {
  text: string;
  items: string[];
  actions?: string[];
}

function DropDownComp({ text, items, actions = [] }: DPInterface) {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="success" id="dropdown-basic">
        {text}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {items.map((item, index) => (
          <Dropdown.Item 
            key={index}
            href={actions[index] || '#'}
          >
            {item}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default DropDownComp;