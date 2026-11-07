import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button} from 'react-bootstrap';
import { FaMoon, FaStar, FaGlobe, FaIdBadge, FaCrown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GiSparkles, GiAstronautHelmet, GiRingedPlanet,} from 'react-icons/gi';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { getStoredLang, setStoredLang } from "../lib/lang";
import { useNavigate } from 'react-router-dom';
import './user.css';
import axios from "axios";
import { useTranslation } from "react-i18next";


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
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!data?.user?.id) return;
    localStorage.setItem("tgid", String(data.user.id));
    loadWallet(false);
  }, [data?.user?.id]);

  useEffect(() => {
    const cur = getStoredLang();
    setLang(cur);
    void i18n.changeLanguage(cur);
    document.documentElement.dir = cur === "fa" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;

    if (tgUser?.id) {
      tg.ready?.();
      setData({
        user: {
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          language_code: tgUser.language_code || "fa",
          is_premium: tgUser.is_premium,
          photo_url: tgUser.photo_url,
        },
        auth_date: tg.initDataUnsafe?.auth_date ?? 0,
      });
      localStorage.setItem("tgid", String(tgUser.id));
      if (tgUser.username) localStorage.setItem("tg_username", tgUser.username);
      if (tgUser.first_name) localStorage.setItem("tg_first_name", tgUser.first_name);
      if (tgUser.last_name != null) {
        localStorage.setItem("tg_last_name", tgUser.last_name || "");
      }
      setMounted(true);
      return;
    }

    const tgid = localStorage.getItem("tgid");
    if (tgid) {
      setData({
        user: {
          id: Number(tgid),
          first_name: localStorage.getItem("tg_first_name") || "کاربر",
          last_name: localStorage.getItem("tg_last_name") || "",
          username: localStorage.getItem("tg_username") || undefined,
          language_code: localStorage.getItem("app_lang") || "fa",
        },
        auth_date: 0,
      });
      setMounted(true);
      return;
    }

    setError(
      t("common.noTgid")
    );
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
      setLangMsg(t("common.serverError"));
      return;
    }

    setLang(next);
    setStoredLang(next);
    void i18n.changeLanguage(next);
    document.documentElement.dir = next === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = next;

    try {
      await axios.post(`${API}/profile/language`, {
        tgid: Number(tgid),
        language: next,
      });
      setLangMsg(next === "fa" ? t("user.langSavedFa") : t("user.langSavedEn"));
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
      <div className="user-top-bar">
        

        <div className="user-lang-toggle" role="group" aria-label="Language">
          <button
            type="button"
            className={`user-lang-chip ${lang === "fa" ? "is-active" : ""}`}
            onClick={() => saveLanguage("fa")}
          >
            FA
          </button>
          <button
            type="button"
            className={`user-lang-chip ${lang === "en" ? "is-active" : ""}`}
            onClick={() => saveLanguage("en")}
          >
            EN
          </button>
        </div>
      </div>
      {langMsg && <p className="user-lang-msg">{langMsg}</p>}
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
            <h1>{t("user.title")}</h1>
          </h1>

          <div className="cosmic-divider">
            <span className="cosmic-divider-line"></span>
            <GiSparkles className="cosmic-divider-icon" />
            <span className="cosmic-divider-line"></span>
          </div>

          <p className="cosmic-subtitle">{t("user.userPageTitle")}</p>
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
                <h3>{t("user.walletTitle")}</h3>
              </div>

              <div className="user-expense-content">
                <div className="mb-3 user-wallet">
                  <div className="d-flex justify-content-between mb-2">
                    <span>{t("user.credit")}</span>
                    <strong>
                      {(wallet?.credit ?? 0).toLocaleString("fa-IR")}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>{t("user.hafezLeft")}</span>
                    <strong>{wallet?.remained_hafez ?? 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>{t("user.tarotLeft")}</span>
                    <strong>{wallet?.remained_tarot ?? 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>{t("user.coffeeLeft")}</span>
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
                  {t("user.buyPackages")}
                </Button>

                <Button
                  variant="outline-light"
                  className="w-100"
                  onClick={() => loadWallet(true)}
                >
                  {t("user.refreshWallet")}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <div className={`cosmic-footer ${mounted ? 'cosmic-fade-in-delay' : ''}`}>
          <p className="cosmic-footer-text">
            {t("user.footer")}
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