import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { BsCalendarCheck, BsClockHistory, BsShieldCheck, BsStars } from "react-icons/bs";
import { FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logarithmImg from "./assets/logarithm.png";
import trendImg from "./assets/trend.png";
import "./reservation.css";

interface Consultant {
  id: string;
  icon: React.ReactNode;
  name: string;
  specialty: string;
  description: string;
  duration: string;
  link: string;
}

const CONSULTANTS: Consultant[] = [
  {
    id: "math",
    icon: <img src={logarithmImg} alt="Mathematics" className="rc-icon-img" />,
    name: "دکتر شاه‌پرویزی",
    specialty: "مشاوره ریاضی",
    description:
      "رفع اشکال، آماده‌سازی آزمون، تقویت پایه و برنامه‌ریزی مطالعه ریاضی در تمام مقاطع.",
    duration: "۴۵ دقیقه",
    link: "/receipt",
  },
  {
    id: "finance",
    icon: <img src={trendImg} alt="Finance" className="rc-icon-img" />,
    name: "مهندس اسکندری",
    specialty: "مشاوره مالی و سرمایه‌گذاری",
    description:
      "تحلیل بازار، مدیریت ریسک، برنامه‌ریزی مالی شخصی و راهنمایی سرمایه‌گذاری.",
    duration: "۳۰ دقیقه",
    link: "/receipt",
  },
];

const ConsultantCard: React.FC<Consultant> = ({
  icon,
  name,
  specialty,
  description,
  duration,
  link,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="rc-card">
      <Card.Body className="rc-card-body">
        {/* Centered icon */}
        <div className="rc-icon-box">
          <div className="rc-icon">{icon}</div>
        </div>

        {/* Centered title group */}
        <div className="rc-title-group">
          <span className="rc-specialty">{specialty}</span>
          <h3 className="rc-name">{name}</h3>
        </div>

        <div className="rc-divider" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <p className="rc-desc">{description}</p>

        <div className="rc-meta">
          <span className="rc-meta-item">
            <BsClockHistory className="rc-meta-icon" />
            {duration}
          </span>
          <span className="rc-meta-item">
            <BsCalendarCheck className="rc-meta-icon" />
            نزدیک‌ترین زمان ممکن
          </span>
        </div>

        <Button
          className="rc-btn w-100"
          onClick={() =>
            navigate(link, {
              state: {
                consultant: { name, specialty, description, duration },
              },
            })
          }
        >
          <span className="rc-btn-text">
            رزرو وقت مشاوره
            <svg
              className="rc-btn-arrow"
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
      </Card.Body>
    </Card>
  );
};

const Reservation: React.FC = () => {
  return (
    <div className="reservation-wrapper">
      <div className="reservation-bg-grid" aria-hidden="true" />
      <div className="reservation-bg-orb reservation-bg-orb--1" aria-hidden="true" />
      <div className="reservation-bg-orb reservation-bg-orb--2" aria-hidden="true" />

      <Container className="reservation-content">
        <header className="reservation-header">
          <span className="reservation-badge">
            <BsStars /> مشاوره تخصصی
          </span>
          <h1 className="reservation-title">رزرو وقت مشاوره</h1>
          <p className="reservation-subtitle">
            یک جلسه اختصاصی با متخصصان ریاضی و مالی رزرو کنید
          </p>
        </header>

        <Row className="g-4 justify-content-center reservation-cards-row">
          {CONSULTANTS.map((c) => (
            <Col xs={12} md={6} lg={5} key={c.id} className="d-flex justify-content-center">
              <ConsultantCard {...c} />
            </Col>
          ))}
        </Row>

        <section className="reservation-features">
          <div className="reservation-feature">
            <BsClockHistory className="reservation-feature-icon" />
            <h4>زمان‌بندی سریع</h4>
            <p>رزرو در چند ثانیه، بدون تماس تلفنی.</p>
          </div>
          <div className="reservation-feature">
            <FaChalkboardTeacher className="reservation-feature-icon" />
            <h4>متخصصان مجرب</h4>
            <p>مشاوره با اساتید و تحلیل‌گران حرفه‌ای.</p>
          </div>
          <div className="reservation-feature">
            <BsShieldCheck className="reservation-feature-icon" />
            <h4>پرداخت امن</h4>
            <p>پرداخت آنلاین با درگاه معتبر.</p>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default Reservation;