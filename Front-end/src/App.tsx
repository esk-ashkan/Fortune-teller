import { Container, Row, Col } from "react-bootstrap";
import SelectComponent from "./components/Select";
import "./App.css";

function App() {
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
              <SelectComponent text="فال تاروت" color="primary" />
            </Col>
            <Col className="d-flex justify-content-center">
              <SelectComponent text="فال قهوه" color="danger" />
            </Col>
            <Col className="d-flex justify-content-center">
              <SelectComponent text="فال نجوم" color="success" />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default App;
