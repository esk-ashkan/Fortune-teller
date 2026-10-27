import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button} from 'react-bootstrap';
import { FaMoon, FaStar, FaGlobe, FaIdBadge, FaCrown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GiSparkles, GiAstronautHelmet, GiRingedPlanet,} from 'react-icons/gi';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { getStoredLang, setStoredLang } from "../lib/lang";
import { useNavigate } from 'react-router-dom';
import './user.css';
import axios from "axios";

const API = "https://fortune-teller-nhy4.onrender.com";

type Wallet = {
  credit: number;
  remained_hafez: number;
  remained_tarot: number;
  remained_coffee: number;
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [lang, setLang] = useState<"fa" | "en">(getStoredLang());
  const [langMsg, setLangMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!data?.user?.id) return;
    localStorage.setItem("tgid", String(data.user.id));
    loadWallet(false);
  }, [data?.user?.id]);

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

  const loadWallet = async (force = false) => {
    const tgid =
      localStorage.getItem("tgid") ||
      (data?.user?.id ? String(data.user.id) : null);
    if (!tgid) return;

    if (!force) {
      try {
        const raw = sessionStorage.getItem("profile_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            setWallet({
              credit: parsed.data.credit ?? 0,
              remained_hafez: parsed.data.remained_hafez ?? 0,
              remained_tarot: parsed.data.remained_tarot ?? 0,
              remained_coffee: parsed.data.remained_coffee ?? 0,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const res = await axios.get(`${API}/`, {
        params: { tgid },
        timeout: 60000,
      });
      setWallet({
        credit: res.data.credit ?? 0,
        remained_hafez: res.data.remained_hafez ?? 0,
        remained_tarot: res.data.remained_tarot ?? 0,
        remained_coffee: res.data.remained_coffee ?? 0,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveLanguage = async (next: "fa" | "en") => {
    const tgid =
      localStorage.getItem("tgid") ||
      (data?.user?.id ? String(data.user.id) : null);
    if (!tgid) {
      setLangMsg("ابتدا از ربات وارد شوید.");
      return;
    }

    setLang(next);
    setStoredLang(next);

    try {
      await axios.post(`${API}/profile/language`, {
        tgid: Number(tgid),
        language: next,
      });
      setLangMsg(next === "fa" ? "زبان ذخیره شد: فارسی" : "Language saved: English");
      sessionStorage.removeItem("profile_cache");
    } catch {
      setLangMsg(next === "fa" ? "خطا در ذخیره زبان" : "Failed to save language");
    }
  };

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
      <div className="mb-3">
        <div className="mb-2">زبان / Language</div>
        <div className="d-flex gap-2">
          <Button
            variant={lang === "fa" ? "warning" : "outline-light"}
            className="flex-fill"
            onClick={() => saveLanguage("fa")}
          >
            فارسی
          </Button>
          <Button
            variant={lang === "en" ? "warning" : "outline-light"}
            className="flex-fill"
            onClick={() => saveLanguage("en")}
          >
            English
          </Button>
        </div>
        {langMsg && <p className="mt-2 mb-0 text-muted">{langMsg}</p>}
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
          <Col xs={12}>
            <div className="user-expense-card">
              <div className="user-expense-header">
                <GiRingedPlanet className="user-expense-icon" />
                <h3>کیف پول و سهمیه</h3>
              </div>

              <div className="user-expense-content">
                <div className="mb-3 user-wallet">
                  <div className="d-flex justify-content-between mb-2">
                    <span>اعتبار</span>
                    <strong>
                      {(wallet?.credit ?? 0).toLocaleString("fa-IR")}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>فال حافظ باقی‌مانده</span>
                    <strong>{wallet?.remained_hafez ?? 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>فال تاروت باقی‌مانده</span>
                    <strong>{wallet?.remained_tarot ?? 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>فال قهوه باقی‌مانده</span>
                    <strong>{wallet?.remained_coffee ?? 0}</strong>
                  </div>
                </div>

                <Button
                  variant="warning"
                  className="user-credit-submit w-100 mb-2"
                  onClick={() =>
                    navigate("/payments", {
                      state: {
                        tgid:
                          localStorage.getItem("tgid") ||
                          String(user.id),
                      },
                    })
                  }
                >
                  خرید پکیج و افزایش اعتبار
                </Button>

                <Button
                  variant="outline-light"
                  className="w-100"
                  onClick={() => loadWallet(true)}
                >
                  بروزرسانی موجودی
                </Button>
              </div>
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