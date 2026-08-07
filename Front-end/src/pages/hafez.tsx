import axios from "axios";
import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import { FaBookOpen, FaStar, FaMoon, FaFeatherAlt } from "react-icons/fa";
import { FaFeatherPointed } from "react-icons/fa6";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import "./hafez.css";

// Create a wrapper component for the back arrow
function HafezWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <div className="hafez-wrapper">
      <div className="hafez-back-wrapper">
        <IoIosArrowRoundBack 
          className="hafez-back-icon" 
          onClick={() => navigate("/")}
        />
      </div>
      <div className="hafez-bg-stars"></div>
      <div className="hafez-bg-glow"></div>
      {children}
    </div>
  );
}

function Hafez() {
  const [poem, setPoem] = useState('');
  const [faal, setFaal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState<string|null>('');

  useEffect(() => {
    if (!goal) return;

    setLoading(true);
    axios
      .get("https://fortune-teller-nhy4.onrender.com/hafez",{
        params:{goal: goal}
      })
      .then((response) => {
        console.log("SUCCESS");
        console.log(response.data);
        setPoem(response.data.poem.poem);
        setFaal(response.data.ai_faal);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setError('خطا در دریافت فال. لطفاً دوباره تلاش کنید.');
        setLoading(false);
      });
  }, [goal]);

  const handleSelectKind = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setGoal(value && value !== 'سایر' ? value : null);
  };

  // Loading state with back arrow
  if (loading) {
    return (
      <HafezWrapper>
        <div className="hafez-loading">
          <div className="hafez-loading-content">
            <FaFeatherAlt className="hafez-loading-icon" />
            <Spinner animation="grow" variant="warning" />
            <p>در حال تفأل زدن...</p>
          </div>
        </div>
      </HafezWrapper>
    );
  }

  // Error state with back arrow
  if (error) {
    return (
      <HafezWrapper>
        <div className="hafez-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>تلاش مجدد</button>
        </div>
      </HafezWrapper>
    );
  }

  // Main content with back arrow
  return (
    <HafezWrapper>
      <Container className="hafez-container">
        <div className="hafez-header">
          <div className="hafez-header-decoration">
            <FaFeatherPointed className="hafez-header-icon" />
          </div>
          <h1 className="hafez-title">
            <FaBookOpen className="hafez-title-icon" />
            فال حافظ
            <FaStar className="hafez-title-star" />
          </h1>
          <div className="hafez-divider">
            <span></span>
            <FaMoon className="hafez-divider-icon" />
            <span></span>
          </div>
          <p className="hafez-subtitle">
            " ای حافظ شیرازی! تو محرم هر رازی!..."
          </p>
        </div>
        <Row>
          <div className="hafez-goal-select" >
            <Form.Select
                  className="hafez-select"
                  onChange={handleSelectKind}
                  defaultValue=""
                >
                  <option value="" className="hafez-select-option1">ابتدا نیت کنید و هدف اصلی این فال را انتخاب کنید</option>
                  <option value="عشقی">❤️عشقی</option>
                  <option value="کاری">📈کاری</option>
                  <option value="مالی">💰مالی</option>
                  <option value="سایر">🎯سایر</option>
            </Form.Select>
          </div>
        </Row>
        <Row className="hafez-poem-section">
          <Col xs={12}>
            <div className="hafez-poem-card">
              <div className="hafez-poem-header">
                <FaFeatherAlt className="hafez-poem-icon" />
                <h3>متن شعر</h3>
              </div>
              <div className="hafez-poem-content">
                {poem.split('\n').map((line, index) => (
                  <p key={index} className="hafez-poem-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <Row className="hafez-faal-section">
          <Col xs={12}>
            <div className="hafez-faal-card">
              <div className="hafez-faal-header">
                <FaStar className="hafez-faal-icon" />
                <h3>تعبیر و تفسیر</h3>
              </div>
              <div className="hafez-faal-content">
                {faal.split('\n').map((paragraph, index) => {
                  if (paragraph.trim() === '') return null;
                  
                  if (paragraph.startsWith('###')) {
                    return (
                      <h4 key={index} className="hafez-faal-subheader">
                        {paragraph.replace('###', '').trim()}
                      </h4>
                    );
                  }
                  
                  if (paragraph.startsWith('**')) {
                    return (
                      <p key={index} className="hafez-faal-bold">
                        {paragraph.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  
                  if (paragraph.includes('|') && paragraph.includes('---')) {
                    return null;
                  }
                  
                  if (paragraph.includes('|')) {
                    const cells = paragraph.split('|').filter(cell => cell.trim() !== '');
                    if (cells.length >= 3) {
                      return (
                        <div key={index} className="hafez-faal-table-row">
                          <span className="hafez-table-cell">{cells[0].trim()}</span>
                          <span className="hafez-table-cell">{cells[1].trim()}</span>
                          <span className="hafez-table-cell">{cells[2].trim()}</span>
                        </div>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <p key={index} className="hafez-faal-paragraph">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </Col>
        </Row>

        <div className="hafez-footer">
          <div className="hafez-footer-stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="hafez-footer-star">✦</span>
            ))}
          </div>
          <p className="hafez-footer-text">
            "زین میِ عشق، که حافظ راست، جرعه‌ای مارا بس ..."
          </p>
        </div>
      </Container>
    </HafezWrapper>
  );
}

export default Hafez;