import { Container, Row, Col } from "react-bootstrap";
import SelectComponent from "../components/selectcomponent";
import { GiStarSattelites, GiCardPickup, GiSparkles, GiOpenBook } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { FaCoffee, FaMoon, FaCoins } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import "./landing.css";
import axios from "axios";
import DropDownComp from "../components/dropdown";

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
        timeout: 60000, // cold start on Render
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
      localStorage.setItem("tgid", String(user.id));
      if (response.data?.username) {
        localStorage.setItem("username", response.data.username);
      }
    } catch (err) {
      console.error(err);
      setUserError("اتصال به سرور برقرار نشد. دوباره تلاش کنید.");
      // still keep telegram id for navigation
      localStorage.setItem("tgid", String(user.id));
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    const tg = (window as any).Telegram?.WebApp;
    let user: TgUser | null = null;

    if (tg?.initDataUnsafe?.user) {
      tg.ready();
      user = tg.initDataUnsafe.user as TgUser;
    } else {
      // local browser testing fallback (optional)
      const saved = localStorage.getItem("tgid");
      if (saved) {
        user = {
          id: Number(saved),
          first_name: "User",
          username: localStorage.getItem("username") || undefined,
        };
      }
    }

    if (!user?.id) {
      setLoadingUser(false);
      setUserError("کاربر تلگرام یافت نشد. از داخل ربات باز کنید.");
      return;
    }

    setTgUser(user);
    fetchUser(user);
  }, [fetchUser]);

  const displayName =
    thisUser?.username ||
    tgUser?.username ||
    thisUser?.first_name ||
    tgUser?.first_name ||
    "کاربر";

  return (
    <div className="cosmic-wrapper">
      {/* User header — never blocks the rest of the page */}
      <div className="p-2" style={{ position: "relative", zIndex: 1000 }}>
        {loadingUser && (
          <p className="cosmic-subtitle p-2 mb-0">در حال اتصال به سرور...</p>
        )}

        {!loadingUser && userError && (
          <div className="p-2">
            <p className="cosmic-subtitle mb-2">{userError}</p>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => tgUser && fetchUser(tgUser)}
            >
              تلاش مجدد
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
                      <FaCoins /> اعتبار: {(thisUser.credit ?? 0).toLocaleString("fa-IR")}
                    </span>
                  ),
                  onClick: () => go("/user"),
                },
                {
                  label: <span>💳 خرید پکیج</span>,
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
            <span className="cosmic-title-line">فال‌نامه</span>
            <span className="cosmic-title-accent">کیهانی</span>
          </h1>

          <div className="cosmic-divider">
            <span className="cosmic-divider-line"></span>
            <GiSparkles className="cosmic-divider-icon" />
            <span className="cosmic-divider-line"></span>
          </div>

          <p className="cosmic-subtitle">
            سفری میان ستارگان، اسطوره‌ها و رازهای کهن ایرانی
          </p>

          <div className="cosmic-tagline">
            <span className="cosmic-tag">✨ ستاره‌شناسی</span>
            <span className="cosmic-tag">🔮 تاروت</span>
            <span className="cosmic-tag">☕ قهوه</span>
          </div>
        </div>

        <Row className={`cosmic-cards-row ${mounted ? "cosmic-slide-up" : ""}`}>
          <Col xs={12} className="mb-3">
            <SelectComponent
              text="فال تاروت"
              color="tarot"
              icon={<GiCardPickup />}
              to="/tarot"
              onSelect={() => go("/tarot")}
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
              onSelect={() => go("/coffee")}
              description="رازهای درون فنجان"
              badge="به زودی"
              disabled={true}
            />
          </Col>

          <Col xs={12} className="mb-3">
            <SelectComponent
              text="فال حافظ"
              color="stars-btn"
              icon={<GiOpenBook />}
              to="/hafez"
              onSelect={() => go("/hafez")}
              description="فال حافظ شیراز"
              badge="نیت کنید"
            />
          </Col>

          <Col xs={12}>
            <SelectComponent
              text="فال نجوم"
              color="stars-btn"
              icon={<GiStarSattelites />}
              to="/stars"
              onSelect={() => go("/stars")}
              description="ستارگان، سرنوشت شما"
              badge="به زودی"
              disabled={true}
            />
          </Col>
        </Row>

        <div className={`cosmic-footer ${mounted ? "cosmic-fade-in-delay" : ""}`}>
          <p className="cosmic-footer-text">
            با اعتماد به کیهان، آینده‌تان را بخوانید
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