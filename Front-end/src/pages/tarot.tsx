import Container from "react-bootstrap/Container";
import { tarotCards } from "./tarot_cards";
import CardsComponent from "./cards";
import { useEffect, useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import axios from "axios";
import "./tarot.css";
import RevealFortune from "./revealfortune";
import TarotLoading from "./TarotLoading";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate, useLocation } from "react-router-dom";
import { getStoredLang } from "../lib/lang";
import { useTranslation } from "react-i18next";

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

function Tarot() {
  const [cardsList, setCardsList] = useState<string[]>([]);
  const [maxNumOfCards, setMaxNumOfCards] = useState<number>(0);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [revealFortune, setRevealFortune] = useState(false);
  const [fortuneText, setFortuneText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kindOfHoroscopy, setKindOfHoroscopy] = useState("");
  const [banner, setBanner] = useState<{
    type: "info" | "warning" | "danger";
    text: string;
  } | null>(null);
  const dir = getStoredLang() === "fa" ? "rtl" : "ltr";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const tgid =
    location.state?.tgid || localStorage.getItem("tgid") || null;

  const hand = useMemo(() => {
    const picked = new Set<number>();
    while (picked.size < 21) {
      picked.add(Math.floor(Math.random() * tarotCards.length));
    }
    return Array.from(picked).map((i) => {
      const orientation =
        Math.random() >= 0.5 ? " (upright)" : " (reversed)";
      return tarotCards[i].name + orientation;
    });
  }, []);

  useEffect(() => {
    setCardsList(hand);
    setSelectedCount(0);
  }, [hand]);

  const handleSelectValue = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = parseInt(e.target.value, 10);
    setMaxNumOfCards(v);
    setSelectedCount(0);
    setSelectedCards([]);
    setIsLoading(false);
    setBanner(null);
  };

  const handleSelectKind = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setKindOfHoroscopy(e.target.value);
  };

  const handleSelectedCard = (cardName: string) => {
    if (!maxNumOfCards) return;
    if (selectedCount >= maxNumOfCards) return;
    if (isLoading) return;

    const newSelectedCards = [...selectedCards, cardName];
    const nextCount = selectedCount + 1;

    setSelectedCards(newSelectedCards);
    setSelectedCount(nextCount);

    if (nextCount !== maxNumOfCards) return;

    (async () => {
      setIsLoading(true);
      setBanner({ type: "info", text: t("tarot.checking") });

      if (!tgid) {
        setBanner({
          type: "danger",
          text: t("tarot.noTgid"),
        });
        setIsLoading(false);
        return;
      }

      const access = await checkAccess("tarot", tgid);

      if (access.status === "error") {
        setBanner({ type: "danger", text: t("common.serverError") });
        setIsLoading(false);
        return;
      }

      if (access.status === "denied") {
        setBanner({
          type: "warning",
          text: t("tarot.denied"),
        });
        setFortuneText("");
        setIsLoading(false);
        return;
      }

      setBanner(null);

      try {
        const response = await axios.get(`${API}/tarot`, {
          params: {
            cards_list: newSelectedCards,
            kindOfHoroscopy: kindOfHoroscopy,
            tgid,
            lang: getStoredLang(),
          },
          timeout: 120000,
        });
        setFortuneText(response.data.interpretation || "");
        setRevealFortune(true);
      } catch (err) {
        console.error(err);
        setBanner({
          type: "danger",
          text: t("tarot.fetchError"),
        });
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div dir={dir} className="tarot-bg">
      <Container className="py-3 py-md-4" fluid="sm">
        <div className="return-wrapper mb-2">
          <IoIosArrowRoundBack
            className="back-icon"
            onClick={() => navigate("/")}
          />
        </div>

        {banner && (
          <div
            className={`alert alert-${banner.type}`}
            style={{ textAlign: "center" }}
          >
            {banner.text}
            {banner.type === "warning" && (
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-warning"
                  onClick={() =>
                    navigate("/payments", { state: { tgid } })
                  }
                >
                  {t("common.buyPackage")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="tarot-header">
          <h2 className="tarot-title">{t("tarot.title")}</h2>
          <p className="tarot-subtitle">{t("tarot.subtitle")}</p>
          <p className="tarot-desc">
            {t("tarot.desc")}
          </p>

          <div className="tarot-divider"></div>

          <div className="tarot-controls">
            <Form.Select
              className="tarot-select"
              onChange={handleSelectValue}
              defaultValue=""
              disabled={isLoading}
            >
              <option value="">{t("tarot.selectCount")}</option>
              <option value="1">{t("tarot.cards1")}</option>
              <option value="3">{t("tarot.cards3")}</option>
              <option value="5">{t("tarot.cards5")}</option>
              <option value="7">{t("tarot.cards7")}</option>
            </Form.Select>

            <Form.Select
              className="tarot-select"
              onChange={handleSelectKind}
              defaultValue=""
              disabled={isLoading}
            >
              <option value="">{t("tarot.selectGoal")}</option>
              <option value="عشقی">{t("tarot.goalLove")}</option>
              <option value="کاری">{t("tarot.goalWork")}</option>
              <option value="مالی">{t("tarot.goalMoney")}</option>
              <option value="سایر">{t("tarot.goalOther")}</option>
            </Form.Select>

            <div className="tarot-info">
              <div className="tarot-info-box">
                <div className="tarot-info-label">{t("tarot.progress")}</div>
                <div className="tarot-info-value">
                  {maxNumOfCards
                    ? `${selectedCount} / ${maxNumOfCards}`
                    : "—"}
                </div>
              </div>
              <div className="tarot-info-box">
                <div className="tarot-info-label">{t("tarot.handSize")}</div>
                <div className="tarot-info-value">{cardsList.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="tarot-grid">
          {cardsList.map((name, idx) => (
            <CardsComponent
              key={`${name}-${idx}`}
              selected={selectedCards.includes(name)}
              onSelect={() => {
                if (!maxNumOfCards || selectedCount >= maxNumOfCards) return;
                if (isLoading) return;
                handleSelectedCard(name);
              }}
            />
          ))}
        </div>

        <div className="tarot-footer">{t("tarot.footer")}</div>

        <RevealFortune
          initiatedShow={revealFortune}
          text={fortuneText}
          handleClose_={() => setRevealFortune(false)}
        />
        <TarotLoading isVisible={isLoading} onComplete={() => {}} />
      </Container>
    </div>
  );
}

export default Tarot;