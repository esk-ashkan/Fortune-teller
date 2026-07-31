import { Container, Row, Col } from "react-bootstrap";
import SelectComponent from "../components/selectcomponent";
import { GiStarSattelites, GiCardPickup, GiSparkles } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { FaCoffee, FaMoon } from "react-icons/fa";
import { useEffect, useState } from "react";
import "./landing.css";
import axios from "axios";

interface MiniAppData {
    user: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code: string;
        is_premium?: boolean;
        photo_url?: string;
    };
}

interface UserInfo {
  username: string;
  credit: number;
  first_name?: string;
  last_name?: string;
}

function Landing() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MiniAppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thisUser, setThisUser] = useState<UserInfo | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
  setMounted(true);
  const tg = (window as any).Telegram?.WebApp;

  if (!tg) {
    setError("Telegram WebApp SDK not loaded.");
    return;
  }

  tg.ready();

  const user = tg.initDataUnsafe.user;

  if (!user) {
    setError("No Telegram user.");
    return;
  }

  setData({ user });
}, []);

useEffect(() => {
  if (!data) return;

  axios
    .get("https://fortune-teller-nhy4.onrender.com/", {
      params: {
        username: data.user.username,
        fname: data.user.first_name,
        lname: data.user.last_name,
      },
    })
    .then((response) => {
      console.log("SUCCESS");
      console.log(response.data);
      setThisUser(response.data);
    })
    .catch((err) => {
      setError(err)
      console.log(error);
    });
}, [data]);


  return (
    
    <div className="cosmic-wrapper">
      <div className="cosmic-bg-layer cosmic-bg-stars"></div>
      <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
      <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
      <div className="cosmic-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`cosmic-particle cosmic-particle-${i % 5}`} />
        ))}
      </div>
      <Container className="cosmic-content">
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
          
          {thisUser && (
            <p className="cosmic-subtitle">
              سلام {thisUser?.username} عزیز، خوش اومدی!
            </p>
          )}
          <p className="cosmic-subtitle">
            سفری میان ستارگان، اسطوره‌ها و رازهای کهن ایرانی
          </p>
          
          <div className="cosmic-tagline">
            <span className="cosmic-tag">✨ ستاره‌شناسی</span>
            <span className="cosmic-tag">🔮 تاروت</span>
            <span className="cosmic-tag">☕ قهوه</span>
          </div>
        </div>
        <Row className={`cosmic-cards-row ${mounted ? 'cosmic-slide-up' : ''}`}>
          <Col xs={12} className="mb-3">
            <SelectComponent
              text="فال تاروت"
              color="tarot"
              icon={<GiCardPickup />}
              to="/tarot"
              onSelect={() => (navigate("/tarot"))}
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
              onSelect={() => navigate("/coffee")}
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
              onSelect={() => navigate("/stars")} 
              description="ستارگان، سرنوشت شما"
              badge="به‌زودی"
              situation={false}
            />
          </Col>
        </Row>
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