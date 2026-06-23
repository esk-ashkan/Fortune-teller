import { Container, Row, Col } from "react-bootstrap";
import SelectComponent from "../components/selectcomponent";
import { GiStarSattelites , GiCardPickup } from "react-icons/gi";
import { FaCoffee } from "react-icons/fa";
import "../components/landing.css";
import { useNavigate } from "react-router";

function landing() {
  const navigate = useNavigate();
  return (
    <div className="cosmic-bg">
      <div className="hero-overlay">
        <Container className="text-center pt-5">
          <h1 className="hero-title">فال‌نامه کیهانی</h1>
          <p className="hero-subtitle">
            سفری میان ستارگان، اسطوره‌ها و رازهای کهن ایرانی
          </p>

          <Row className="mt-5">
            <Col className="d-flex justify-content-center">
              <SelectComponent 
                text="فال تاروت"
                color="primary"
                icon={<GiCardPickup />}
                to='/tarot'
                onSelect={() => navigate('/tarot')}
              />
            </Col>
            <Col className="d-flex justify-content-center">
              <SelectComponent
                text="فال قهوه"
                color="danger"
                icon={<FaCoffee />}
                to="/coffee"
                onSelect={() => navigate("/coffee")}
              />
            </Col>
            <Col className="d-flex justify-content-center">
              <SelectComponent
                text="فال نجوم"
                color="success"
                icon={<GiStarSattelites />}
                to="/stars"
                onSelect={() => navigate("/stars")}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default landing;
