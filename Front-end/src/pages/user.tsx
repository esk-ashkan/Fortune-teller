import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Stack, Badge, Form, Button, Tabs, Tab, Card } from 'react-bootstrap';
import { FaMoon, FaStar, FaGlobe, FaIdBadge, FaCrown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GiSparkles, GiAstronautHelmet, GiRingedPlanet, GiFeather } from 'react-icons/gi';
import { MdOutlineCalendarMonth } from 'react-icons/md';
import { SiCoffeescript } from 'react-icons/si';
import { TbPlayCardStar } from 'react-icons/tb';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import './user.css';

/* ============================================================
   Cosmic Package Card (react-bootstrap, no HeroUI)
   ============================================================ */
interface CosmicPackageCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  maindescription: string;
  link: string;
  buttonText: string;
}

const CosmicPackageCard: React.FC<CosmicPackageCardProps> = ({
  icon,
  title,
  description,
  maindescription,
  link,
  buttonText,
}) => {
  const navigate = useNavigate();

  return (
    <div className="user-pkg-wrapper">
      <div className="user-pkg-glow" aria-hidden="true" />
      <Card className="user-pkg-card">
        <div className="user-pkg-top-line" aria-hidden="true" />

        <Card.Body className="user-pkg-body">
          <div className="user-pkg-header">
            <div className="user-pkg-icon-box">
              <div className="user-pkg-icon-pulse" aria-hidden="true" />
              <div className="user-pkg-icon">{icon}</div>
            </div>
            <div className="user-pkg-title-group">
              <h3 className="user-pkg-title">{title}</h3>
              <p className="user-pkg-subtitle">{description}</p>
            </div>
          </div>

          <div className="user-pkg-divider" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <p className="user-pkg-desc">{maindescription}</p>

          <Button
            className="user-pkg-btn w-100"
            onClick={() =>
              navigate(link, {
                state: { package: { title, description, maindescription } },
              })
            }
          >
            <span className="user-pkg-btn-shine" aria-hidden="true" />
            <span className="user-pkg-btn-text">
              {buttonText}
              <svg
                className="user-pkg-btn-arrow"
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
    </div>
  );
};

/* ============================================================
   Package data
   ============================================================ */
const PACKAGES = {
  intervallic: [
    {
      icon: <MdOutlineCalendarMonth />,
      title: '۱ ماهه',
      description: '۴۹۹,۹۹۹ تومان',
      maindescription: 'روزانه ۱ فال حافظ و ۱ فال تاروت',
      link: '/pay/1month',
      buttonText: 'پرداخت',
    },
    {
      icon: <MdOutlineCalendarMonth />,
      title: '۳ ماهه',
      description: '۹۹۹,۰۰۰ تومان',
      maindescription: 'روزانه ۱ فال حافظ، ۱ فال تاروت و هفته‌ای ۱ فال قهوه',
      link: '/pay/3month',
      buttonText: 'پرداخت',
    },
    {
      icon: <MdOutlineCalendarMonth />,
      title: '۱ ساله',
      description: '۱,۷۹۹,۰۰۰ تومان',
      maindescription: 'روزانه ۱ فال حافظ، ۱ فال تاروت و ۱ فال قهوه',
      link: '/pay/1year',
      buttonText: 'پرداخت',
    },
  ],
  aimful: [
    {
      icon: <GiFeather />,
      title: '۲۰ درخواست حافظ',
      description: '۴۹۹,۰۰۰ تومان',
      maindescription: 'پکیج ۲۰ تایی فال حافظ، فعال تا ۴۰ روز پس از فعال‌سازی',
      link: '/pay/hafez20',
      buttonText: 'پرداخت',
    },
    {
      icon: <SiCoffeescript />,
      title: '۲۰ درخواست قهوه',
      description: '۱,۷۹۹,۰۰۰ تومان',
      maindescription: 'پکیج ۲۰ تایی فال قهوه، فعال تا ۴۰ روز پس از فعال‌سازی',
      link: '/pay/coffee20',
      buttonText: 'پرداخت',
    },
    {
      icon: <TbPlayCardStar />,
      title: '۲۰ درخواست تاروت',
      description: '۹۹۹,۰۰۰ تومان',
      maindescription: 'پکیج ۲۰ تایی فال تاروت، فعال تا ۴۰ روز پس از فعال‌سازی',
      link: '/pay/tarot20',
      buttonText: 'پرداخت',
    },
  ],
};

/* ============================================================
   Telegram user data
   ============================================================ */
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
  auth_date: number;
}

const TeleUserData: React.FC = () => {
  const [data, setData] = useState<MiniAppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [expense, setExpense] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;

    if (!tg) {
      setError('Telegram WebApp SDK not loaded.');
      return;
    }

    tg.ready();

    const user = tg.initDataUnsafe.user;

    if (!user) {
      setError('No Telegram user.');
      return;
    }

    setData({
      user,
      auth_date: tg.initDataUnsafe.auth_date,
    });

    setMounted(true);
  }, []);

  if (error) {
    return (
      <div className="cosmic-wrapper">
        <div className="cosmic-bg-layer cosmic-bg-stars"></div>
        <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
        <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
        <Container className="cosmic-content">
          <div className="user-error-card">
            <GiRingedPlanet className="user-error-icon" />
            <h2>خطا در دریافت اطلاعات</h2>
            <p>{error}</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cosmic-wrapper">
        <div className="cosmic-bg-layer cosmic-bg-stars"></div>
        <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
        <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
        <Container className="cosmic-content">
          <div className="user-loading">
            <GiAstronautHelmet className="user-loading-icon" />
            <p>در حال دریافت اطلاعات...</p>
          </div>
        </Container>
      </div>
    );
  }

  const { user } = data;

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

      <div className="user-back-wrapper" onClick={() => navigate(-1)}>
        <IoIosArrowRoundBack className="user-back-icon" />
      </div>

      <Container className="cosmic-content">
        <div className={`cosmic-header ${mounted ? 'cosmic-fade-in' : ''}`}>
          <div className="cosmic-moon-wrapper">
            <FaMoon className="cosmic-moon-icon" />
            <div className="cosmic-moon-glow"></div>
          </div>

          <h1 className="cosmic-title">
            <span className="cosmic-title-line">پروفایل</span>
            <span className="cosmic-title-accent">کاربری</span>
          </h1>

          <div className="cosmic-divider">
            <span className="cosmic-divider-line"></span>
            <GiSparkles className="cosmic-divider-icon" />
            <span className="cosmic-divider-line"></span>
          </div>

          <p className="cosmic-subtitle">اطلاعات حساب کاربری شما</p>
        </div>

        <Row className={`cosmic-cards-row user-cards-row ${mounted ? 'cosmic-slide-up' : ''}`}>
          <Col xs={12}>
            <div className="user-profile-card">
              <div className="user-avatar-section">
                <div className="user-avatar-wrapper">
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={`${user.first_name}'s avatar`}
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <FaStar />
                    </div>
                  )}
                  <div className="user-avatar-glow"></div>
                </div>

                {user.is_premium && (
                  <div className="user-premium-badge">
                    <FaCrown /> Premium
                  </div>
                )}
              </div>
              <h2 className="user-name">
                {user.first_name} {user.last_name || ''}
              </h2>

              {user.username && <p className="user-username">@{user.username}</p>}
              <div className="user-badges">
                <div className="user-badge">
                  <FaIdBadge className="user-badge-icon" />
                  <span className="user-badge-value">
                    {isVisible ? user.id : '*********'}
                  </span>
                  <button
                    type="button"
                    className="user-badge-toggle"
                    onClick={() => setIsVisible(!isVisible)}
                    aria-label={isVisible ? 'مخفی کردن شناسه' : 'نمایش شناسه'}
                  >
                    {isVisible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                <div className="user-badge">
                  <FaGlobe className="user-badge-icon" />
                  <span>{user.language_code.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </Col>

          {/* ===== Existing expense card (unchanged) ===== */}
          <Col xs={12}>
            <div className="user-expense-card">
              <div className="user-expense-header">
                <GiRingedPlanet className="user-expense-icon" />
                <h3>افزایش اعتبار</h3>
              </div>

              <div className="user-expense-content">
                <Stack direction="horizontal" gap={2} className="user-credit-badges">
                  {[
                    { value: 1000000, label: '۱,۰۰۰,۰۰۰' },
                    { value: 1500000, label: '۱,۵۰۰,۰۰۰' },
                    { value: 2000000, label: '۲,۰۰۰,۰۰۰' },
                    { value: 3000000, label: '۳,۰۰۰,۰۰۰' },
                  ].map(({ value, label }) => (
                    <Badge
                      key={value}
                      bg={expense === value ? 'warning' : 'secondary'}
                      className="user-credit-badge"
                      onClick={() => setExpense(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </Stack>

                <Form.Control
                  type="text"
                  inputMode="numeric"
                  className="user-credit-input"
                  placeholder="مبلغ به ریال"
                  value={expense === 0 ? '' : expense}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setExpense(raw ? Number(raw) : 0);
                  }}
                />

                <Button
                  variant="warning"
                  className="user-credit-submit w-100"
                  disabled={!expense || expense < 100000}
                  onClick={() => {
                    console.log('Charging:', expense);
                  }}
                >
                  {expense > 0
                    ? `پرداخت ${expense.toLocaleString('fa-IR')} ریال`
                    : 'پرداخت'}
                </Button>
              </div>
            </div>
          </Col>

          {/* ===== Packages section (integrated from Payments) ===== */}
          <Col xs={12}>
            <div className="user-packages-section">
              <div className="user-packages-header">
                <GiSparkles className="user-packages-icon" />
                <h3>انتخاب پکیج</h3>
              </div>
              <p className="user-packages-subtitle">
                بهترین تجربه فال را با پکیج‌های ویژه تجربه کنید
              </p>

              <Tabs
                defaultActiveKey="intervallic"
                className="user-packages-tabs"
                justify
              >
                <Tab eventKey="intervallic" title="پکیج دوره‌ای">
                  <div className="user-packages-grid">
                    {PACKAGES.intervallic.map((pkg) => (
                      <CosmicPackageCard key={pkg.link} {...pkg} />
                    ))}
                  </div>
                </Tab>

                <Tab eventKey="aimful" title="پکیج خاص">
                  <div className="user-packages-grid">
                    {PACKAGES.aimful.map((pkg) => (
                      <CosmicPackageCard key={pkg.link} {...pkg} />
                    ))}
                  </div>
                </Tab>
              </Tabs>
            </div>
          </Col>
        </Row>

        <div className={`cosmic-footer ${mounted ? 'cosmic-fade-in-delay' : ''}`}>
          <p className="cosmic-footer-text">
            اطلاعات این صفحه از حساب تلگرام شما دریافت شده است
          </p>
          <div className="cosmic-footer-stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="cosmic-footer-star">
                ✦
              </span>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TeleUserData;