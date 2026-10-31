import { Container, Row, Col } from "react-bootstrap";
import SelectComponent from "../components/selectcomponent";
import { GiStarSattelites, GiCardPickup, GiSparkles, GiOpenBook } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { FaCoffee, FaMoon, FaCoins } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import "./landing.css";
import axios from "axios";
import DropDownComp from "../components/dropdown";
import { setStoredLang } from "../lib/lang";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";


const API = "https://fortune-teller-nhy4.onrender.com";

interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface UserInfo {
  tgid: number;
  username?: string;
  credit: number;
  first_name?: string;
  last_name?: string;
  remained_hafez?: number;
  remained_tarot?: number;
  remained_coffee?: number;
}

async function loadProfile(
  params: {
    tgid: number;
    username?: string;
    fname?: string;
    lname?: string;
  },
  tries = 3
) {
  let lastError: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await axios.get(`${API}/`, {
        params,
        timeout: 60000, 
      });
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastError;
}

function Landing() {
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [thisUser, setThisUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");

  const { t } = useTranslation();


  const go = (path: string) => {
    const tgid = tgUser?.id || Number(localStorage.getItem("tgid")) || null;
    if (tgid) localStorage.setItem("tgid", String(tgid));
    navigate(path, { state: { tgid } });
  };

  const fetchUser = useCallback(async (user: TgUser) => {
    setLoadingUser(true);
    setUserError("");
    try {
      const response = await loadProfile({
        tgid: user.id,
        username: user.username,
        fname: user.first_name,
        lname: user.last_name,
      });
      setThisUser(response.data);
      setTgUser(user);

      if (response.data.language === "fa" || response.data.language === "en") {
        setStoredLang(response.data.language);
        void i18n.changeLanguage(response.data.language);
      }

      localStorage.setItem("tgid", String(user.id));
      if (response.data?.username) {
        localStorage.setItem("tg_username", response.data.username);
      }
    } catch (err) {
      console.error(err);
      setUserError(
        t("landing.serverError")
      );
      localStorage.setItem("tgid", String(user.id));
    } finally {
      setLoadingUser(false);
    }
  }, [t]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user as TgUser | undefined;

    if (user?.id) {
      tg?.ready?.();
      setTgUser(user);
      setMounted(true);

      localStorage.setItem("tgid", String(user.id));
      if (user.username) localStorage.setItem("tg_username", user.username);
      if (user.first_name) localStorage.setItem("tg_first_name", user.first_name);
      if (user.last_name != null) {
        localStorage.setItem("tg_last_name", user.last_name || "");
      }

      fetchUser(user);
      return;
    }

    const tgid = localStorage.getItem("tgid");
    if (tgid) {
      const fallback: TgUser = {
        id: Number(tgid),
        first_name: localStorage.getItem("tg_first_name") || `user-${Number(tgid)}`,
        last_name: localStorage.getItem("tg_last_name") || undefined,
        username: localStorage.getItem("tg_username") || undefined,
      };
      setTgUser(fallback);
      setMounted(true);
      fetchUser(fallback); 
      return;
    }

    setMounted(true);
    setLoadingUser(false);
    setUserError(
      t("landing.connecting")
    );
  }, [fetchUser, t]);

    const displayName =
    thisUser?.username ||
    tgUser?.username ||
    thisUser?.first_name ||
    tgUser?.first_name ||
    t("landing.userFallback");

  return (
    <div className="cosmic-wrapper">
      <div className="p-2" style={{ position: "relative", zIndex: 1000 }}>
        {loadingUser && tgUser && (
          <p className="cosmic-subtitle p-2 mb-0">{t("landing.connecting")}</p>
        )}

        {!loadingUser && userError && (
          <div className="p-2">
            <p className="cosmic-subtitle mb-2">{userError}</p>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => tgUser && fetchUser(tgUser)}
            >
              {t("landing.retry")}
            </button>
          </div>
        )}

        {!loadingUser && !userError && thisUser && (
          <p className="cosmic-subtitle p-2">
            <DropDownComp
              text={displayName}
              items={[
                {
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FaCoins /> {t("landing.credit")}: {(thisUser.credit ?? 0).toLocaleString("fa-IR")}
                    </span>
                  ),
                  onClick: () => go("/user"),
                },
                {
                  label: <span>💳 {t("landing.buyPackage")}</span>,
                  onClick: () => go("/payments"),
                },
              ]}
            />
          </p>
        )}
      </div>

      <div className="cosmic-bg-layer cosmic-bg-stars"></div>
      <div className="cosmic-bg-layer cosmic-bg-nebula"></div>
      <div className="cosmic-bg-layer cosmic-bg-aurora"></div>
      <div className="cosmic-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`cosmic-particle cosmic-particle-${i % 5}`} />
        ))}
      </div>

      <Container className="cosmic-content">
        <div className={`cosmic-header ${mounted ? "cosmic-fade-in" : ""}`}>
          <div className="cosmic-moon-wrapper">
            <FaMoon className="cosmic-moon-icon" />
            <div className="cosmic-moon-glow"></div>
          </div>

          <h1 className="cosmic-title">
            <span className="cosmic-title-line">{t("landing.titleLine")}</span>
            <span className="cosmic-title-accent">{t("landing.titleAccent")}</span>
          </h1>

          <div className="cosmic-divider">
            <span className="cosmic-divider-line"></span>
            <GiSparkles className="cosmic-divider-icon" />
            <span className="cosmic-divider-line"></span>
          </div>

          <p className="cosmic-subtitle">
            {t("landing.subtitle")}
          </p>

          <div className="cosmic-tagline">
            <span className="cosmic-tag">✨ {t("landing.tagStars")}</span>
            <span className="cosmic-tag">🔮 {t("landing.tagTarot")}</span>
            <span className="cosmic-tag">☕ {t("landing.tagCoffee")}</span>
          </div>
        </div>

        <Row className={`cosmic-cards-row ${mounted ? "cosmic-slide-up" : ""}`}>
          <Col xs={12} className="mb-3">
            <SelectComponent
              text={t("landing.tarot")}
              color="tarot"
              icon={<GiCardPickup />}
              to="/tarot"
              onSelect={() => go("/tarot")}
              description={t("landing.tarotDesc")}
              badge={t("landing.tarotBadge")}
            />
          </Col>

          <Col xs={12} className="mb-3">
            <SelectComponent
              text={t("landing.coffee")}
              color="coffee"
              icon={<FaCoffee />}
              to="/coffee"
              onSelect={() => go("/coffee")}
              description={t("landing.coffeeDesc")}
              badge={t("landing.coffeeBadge")}
              disabled={true}
            />
          </Col>

          <Col xs={12} className="mb-3">
            <SelectComponent
              text={t("landing.hafez")}
              color="stars-btn"
              icon={<GiOpenBook />}
              to="/hafez"
              onSelect={() => go("/hafez")}
              description={t("landing.hafezDesc")}
              badge={t("landing.hafezBadge")}
            />
          </Col>

          <Col xs={12}>
            <SelectComponent
              text={t("landing.stars")}
              color="stars-btn"
              icon={<GiStarSattelites />}
              to="/stars"
              onSelect={() => go("/stars")}
              description={t("landing.starsDesc")}
              badge={t("landing.starsBadge")}
              disabled={true}
            />
          </Col>
        </Row>

        <div className={`cosmic-footer ${mounted ? "cosmic-fade-in-delay" : ""}`}>
          <p className="cosmic-footer-text">
            {t("landing.footer")}
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
}

export default Landing;