import { Container, Row, Col } from "react-bootstrap";
import SelectComponent from "../components/selectcomponent";
import { GiStarSattelites, GiCardPickup, GiSparkles } from "react-icons/gi";
import { FaCoffee, FaMoon } from "react-icons/fa";
import { useEffect, useState } from "react";
import "./landing.css";

function Landing() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="cosmic-wrapper">
      {/* Animated Background Layers */}
      <div className="cosmic-bg-layer cosmic-bg-stars"></div>
      <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
      <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
      
      {/* Floating Particles */}
      <div className="cosmic-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`cosmic-particle cosmic-particle-${i % 5}`} />
        ))}
      </div>

      {/* Main Content */}
      <Container className="cosmic-content">
        {/* Header Section */}
        <div className={`cosmic-header ${mounted ? 'cosmic-fade-in' : ''}`}>
          <div className="cosmic-moon-wrapper">
            <FaMoon className="cosmic-moon-icon" />
            <div className="cosmic-moon-glow"></div>
          </div>
          
          <h1 className="cosmic-title">
            <span className="cosmic-title-line">فال‌نامه</span>
            <span className="cosmic-title-accent">کیهانی</span>
          </h1>
          
          <div className="cosmic-divider">
            <span className="cosmic-divider-line"></span>
            <GiSparkles className="cosmic-divider-icon" />
            <span className="cosmic-divider-line"></span>
          </div>
          
          <p className="cosmic-subtitle">
            سفری میان ستارگان، اسطوره‌ها و رازهای کهن ایرانی
          </p>
          
          <div className="cosmic-tagline">
            <span className="cosmic-tag">✨ ستاره‌شناسی</span>
            <span className="cosmic-tag">🔮 تاروت</span>
            <span className="cosmic-tag">☕ قهوه</span>
          </div>
        </div>

        {/* Cards Grid */}
        <Row className={`cosmic-cards-row ${mounted ? 'cosmic-slide-up' : ''}`}>
          <Col xs={12} className="mb-3">
            <SelectComponent
              text="فال تاروت"
              color="tarot"
              icon={<GiCardPickup />}
              to="/tarot"
              onSelect={() => (window.location.href = "/tarot")}
              description="کارت‌های کهن، پیام‌های آینده"
              badge="محبوب‌ترین"
            />
          </Col>

          <Col xs={12} className="mb-3">
            <SelectComponent
              text="فال قهوه"
              color="coffee"
              icon={<FaCoffee />}
              to="/coffee"
              onSelect={() => (window.location.href = "/coffee")}
              description="رازهای درون فنجان"
              badge="جدید"
            />
          </Col>

          <Col xs={12}>
            <SelectComponent
              text="فال نجوم"
              color="stars-btn"
              icon={<GiStarSattelites />}
              to="/stars"
              onSelect={() => (window.location.href = "/stars")}
              description="ستارگان، سرنوشت شما"
              badge="به‌زودی"
            />
          </Col>
        </Row>

        {/* Footer */}
        <div className={`cosmic-footer ${mounted ? 'cosmic-fade-in-delay' : ''}`}>
          <p className="cosmic-footer-text">
            با اعتماد به کیهان، آینده‌تان را بخوانید
          </p>
          <div className="cosmic-footer-stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="cosmic-footer-star">✦</span>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Landing;