import Button from "react-bootstrap/Button";
import "./select.css";

interface SelectInterface {
  text?: string;
  color?: string;
  icon?: React.ReactNode;
  to: string;
  onSelect: () => void;
  description?: string;
  badge?: string;
}

function SelectComponent({
  onSelect,
  text = "click",
  color = "primary",
  icon,
  description = "",
  badge = "",
}: SelectInterface) {
  return (
    <div className="cosmic-card-wrapper">
      {badge && (
        <div className={`cosmic-badge cosmic-badge-${color}`}>
          {badge}
        </div>
      )}
      
      <Button 
        className={`cosmic-btn cosmic-${color}`} 
        onClick={onSelect}
      >
        <div className="cosmic-btn-shine"></div>
        
        <div className="cosmic-btn-content">
          <div className="cosmic-btn-icon-wrapper">
            <div className="cosmic-btn-icon-glow"></div>
            {icon && <span className="cosmic-btn-icon">{icon}</span>}
          </div>
          
          <div className="cosmic-btn-text-wrapper">
            <span className="cosmic-btn-text">{text}</span>
            {description && (
              <span className="cosmic-btn-description">{description}</span>
            )}
          </div>
        </div>
        
        <div className="cosmic-btn-arrow">→</div>
        
        <div className="cosmic-btn-ripple"></div>
      </Button>
    </div>
  );
}

export default SelectComponent;