import { Card, Button } from "@heroui/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import "./card.css";

interface PackageCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  maindescription: string;
  link: string;
  buttonText: string;
}

export function PackageCard({
  icon,
  title,
  description,
  maindescription,
  link,
  buttonText,
}: PackageCardProps) {
  const navigate = useNavigate();

  return (
    <div className="pkg-card-wrapper">
      <div className="pkg-card-glow" aria-hidden="true" />
      
      <Card className="pkg-card">
        <div className="pkg-card-top-line" aria-hidden="true" />
        
        <Card.Header className="pkg-card-header">
          <div className="pkg-icon-box">
            <div className="pkg-icon-pulse" aria-hidden="true" />
            <div className="pkg-icon">{icon}</div>
          </div>

          <div className="pkg-title-group">
            <Card.Title className="pkg-title">{title}</Card.Title>
            <Card.Description className="pkg-subtitle">
              {description}
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Content className="pkg-content">
          <div className="pkg-divider" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="pkg-desc">{maindescription}</p>
        </Card.Content>

        <Card.Footer className="pkg-footer">
          <Button 
            fullWidth
            size="lg"
            className="pkg-btn"
            onPress={() => {
              navigate(link, {
                state: {
                  package: {
                    title,
                    description,
                    maindescription,
                  },
                },
              });
            }}
          >
            <span className="pkg-btn-shine" aria-hidden="true" />
            <span className="pkg-btn-text">
              {buttonText}
              <svg 
                className="pkg-btn-arrow" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </span>
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}