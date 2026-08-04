import axios from "axios";
import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { FaBookOpen, FaStar, FaMoon, FaFeatherAlt } from "react-icons/fa";
import { GiPersianDagger } from "react-icons/gi";
import "./hafez.css";

function Hafez() {
  const [poem, setPoem] = useState('');
  const [faal, setFaal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get("https://fortune-teller-nhy4.onrender.com/hafez")
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
  }, []);

  if (loading) {
    return (
      <div className="hafez-loading">
        <div className="hafez-loading-content">
          <FaFeatherAlt className="hafez-loading-icon" />
          <Spinner animation="grow" variant="warning" />
          <p>در حال گشودن رازهای حافظ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hafez-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>تلاش مجدد</button>
      </div>
    );
  }

  return (
    <div className="hafez-wrapper">
      <div className="hafez-bg-stars"></div>
      <div className="hafez-bg-glow"></div>
      
      <Container className="hafez-container">
        {/* Header */}
        <div className="hafez-header">
          <div className="hafez-header-decoration">
            <GiPersianDagger className="hafez-header-icon" />
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
            "از نسیمِ بادِ صبحی، رازِ دل بر من فشان..."
          </p>
        </div>

        {/* Poem Section */}
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

        {/* Interpretation Section */}
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
                  
                  // Check if it's a header (starts with ###)
                  if (paragraph.startsWith('###')) {
                    return (
                      <h4 key={index} className="hafez-faal-subheader">
                        {paragraph.replace('###', '').trim()}
                      </h4>
                    );
                  }
                  
                  // Check if it's a bold line (starts with **)
                  if (paragraph.startsWith('**')) {
                    return (
                      <p key={index} className="hafez-faal-bold">
                        {paragraph.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  
                  // Check if it's a table row (contains |)
                  if (paragraph.includes('|') && paragraph.includes('---')) {
                    return null; // Skip table separators
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
                  
                  // Regular paragraph
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

        {/* Footer */}
        <div className="hafez-footer">
          <div className="hafez-footer-stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="hafez-footer-star">✦</span>
            ))}
          </div>
          <p className="hafez-footer-text">
            "زین میِ عشق، که حافظ راست، یک جرعه کافیست..."
          </p>
        </div>
      </Container>
    </div>
  );
}

export default Hafez;