import axios from "axios";
import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { FaBookOpen, FaStar, FaMoon, FaFeatherAlt } from "react-icons/fa";
import { FaFeatherPointed } from "react-icons/fa6";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate, useLocation } from "react-router-dom";
import { getStoredLang } from "../lib/lang";
import { useTranslation } from "react-i18next";
import "./hafez.css";

const API = "https://fortune-teller-nhy4.onrender.com";

async function checkAccess(model: string, tgid: string | number, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await axios.get(`${API}/check`, {
        params: { model, tgid },
        timeout: 60000,
      });
      if (res.data?.can_use) return { status: "allowed" as const };
      return { status: "denied" as const };
    } catch {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return {
    status: "error" as const,
    message: "سرور پاسخ نداد. لطفاً دوباره تلاش کنید.",
  };
}

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
  const [poem, setPoem] = useState("");
  const [faal, setFaal] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [goal, setGoal] = useState<string | null>("");
  const dir = getStoredLang() === "fa" ? "rtl" : "ltr";
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const tgid =
    location.state?.tgid || localStorage.getItem("tgid") || null;

  useEffect(() => {
    if (!goal) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setChecking(true);
      setError("");
      setDenied(false);
      setPoem("");
      setFaal("");

      if (!tgid) {
        if (!cancelled) {
          setError(t("common.noTgid"));
          setChecking(false);
          setLoading(false);
        }
        return;
       }

      const access = await checkAccess("hafez", tgid);
      if (cancelled) return;

      setChecking(false);

      if (access.status === "error") {
        setError(access.message);
        setLoading(false);
        return;
      }

      if (access.status === "denied") {
        setDenied(true);
        setError(t("hafez.denied"));
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/hafez`, {
          params: { goal, tgid, lang: getStoredLang(), },
          timeout: 120000,
        });
        setPoem(response.data.poem?.poem ?? response.data.poem ?? "");
        setFaal(response.data.ai_faal ?? "");
      } catch (err) {
        console.log(err);
        setError(t("hafez.fetchError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [goal, tgid]);

  const handleSelectKind = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGoal(e.target.value);
  };

  const resetAndRetry = () => {
    setError("");
    setDenied(false);
    setPoem("");
    setFaal("");
    setGoal("");
  };

  if (loading || checking) {
    return (
      <HafezWrapper>
        <div className="hafez-loading">
          <div className="hafez-loading-content">
            <FaFeatherAlt className="hafez-loading-icon" />
            <Spinner animation="grow" variant="warning" />
            <p>{checking ? t("hafez.checking") : t("hafez.loading")}</p>
          </div>
        </div>
      </HafezWrapper>
    );
  }

  if (error) {
    return (
      <HafezWrapper>
        <div className="hafez-error">
          <p>{error}</p>
          {denied ? (
            <button
              type="button"
              onClick={() =>
                navigate("/payments", { state: { tgid } })
              }
            >
              {t("common.buyPackage")}
            </button>
          ) : (
            <button type="button" onClick={resetAndRetry}>
              {t("common.retry")}
            </button>
          )}
        </div>
      </HafezWrapper>
    );
  }

  return (
    <HafezWrapper>
      <Container className="hafez-container"  dir={dir}>
        <div className="hafez-header">
          <div className="hafez-header-decoration">
            <FaFeatherPointed className="hafez-header-icon" />
          </div>
          <h1 className="hafez-title">
            <FaBookOpen className="hafez-title-icon" />
              {t("hafez.title")}
            <FaStar className="hafez-title-star" />
          </h1>
          <div className="hafez-divider">
            <span></span>
            <FaMoon className="hafez-divider-icon" />
            <span></span>
          </div>
          <p className="hafez-subtitle">
            &quot;{t("hafez.title")}&quot;
          </p>
        </div>

        <Row>
          <div className="hafez-goal-select">
            <Form.Select
              className="hafez-select"
              onChange={handleSelectKind}
              value={goal || ""}
            >
              <option value="" className="hafez-select-option1">
                {t("hafez.selectGoal")}
              </option>
              <option value="عشقی">❤️{t("hafez.goalLove")}</option>
              <option value="کاری">📈{t("hafez.goalWork")}</option>
              <option value="مالی">💰{t("hafez.goalMoney")}</option>
              <option value="روزانه">🎯{t("hafez.goalDaily")}</option>
            </Form.Select>
          </div>
        </Row>

        <Row className="hafez-poem-section">
          <Col xs={12}>
            <div className="hafez-poem-card">
              <div className="hafez-poem-header">
                <FaFeatherAlt className="hafez-poem-icon" />
                <h3>{t("hafez.poemHeading")}</h3>
              </div>
              <div className="hafez-poem-content">
                {poem.split("\n").map((line, index) => (
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
                <h3>{t("hafez.faalHeading")}</h3>
              </div>
              <div className="hafez-faal-content">
                {faal.split("\n").map((paragraph, index) => {
                  if (paragraph.trim() === "") return null;

                  if (paragraph.startsWith("###")) {
                    return (
                      <h4 key={index} className="hafez-faal-subheader">
                        {paragraph.replace("###", "").trim()}
                      </h4>
                    );
                  }

                  if (paragraph.startsWith("**")) {
                    return (
                      <p key={index} className="hafez-faal-bold">
                        {paragraph.replace(/\*\*/g, "")}
                      </p>
                    );
                  }

                  if (paragraph.includes("|") && paragraph.includes("---")) {
                    return null;
                  }

                  if (paragraph.includes("|")) {
                    const cells = paragraph
                      .split("|")
                      .filter((cell) => cell.trim() !== "");
                    if (cells.length >= 3) {
                      return (
                        <div key={index} className="hafez-faal-table-row">
                          <span className="hafez-table-cell">
                            {cells[0].trim()}
                          </span>
                          <span className="hafez-table-cell">
                            {cells[1].trim()}
                          </span>
                          <span className="hafez-table-cell">
                            {cells[2].trim()}
                          </span>
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
              <span key={i} className="hafez-footer-star">
                ✦
              </span>
            ))}
          </div>
          <p className="hafez-footer-text">
            &quot{t("hafez.footer")}&quot;
          </p>
        </div>
      </Container>
    </HafezWrapper>
  );
}

export default Hafez;