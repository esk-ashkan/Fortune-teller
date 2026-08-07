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
import { useNavigate } from "react-router-dom";

function Tarot() {
  const [cardsList, setCardsList] = useState<string[]>([]);
  const [maxNumOfCards, setMaxNumOfCards] = useState<number>(0);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [revealFortune, setRevealFortune] = useState(false);
  const [fortuneText, setFortuneText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kindOfHoroscopy, setKindOfHoroscopy] = useState('');

  const navigate = useNavigate();

  const hand = useMemo(() => {
    const picked = new Set<number>();
    while (picked.size < 21) {
      picked.add(Math.floor(Math.random() * tarotCards.length));
    }
    return Array.from(picked).map((i) => {
      const orientation = Math.random() >= 0.5 ? " (upright)" : " (reversed)";
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
  };
  const handleSelectKind = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setKindOfHoroscopy(v)
  };

  const handleSelectedCard = (cardName: string) => {
    if (!maxNumOfCards) return;
    if (selectedCount >= maxNumOfCards) return;

    const newSelectedCards = [...selectedCards, cardName];
    const nextCount = selectedCount + 1;

    setSelectedCards(newSelectedCards);
    setSelectedCount(nextCount);
    console.log(`----->Counting Cards`);
    if (nextCount === maxNumOfCards) {
      setIsLoading(true);
      console.log(`----->Start Requesting`);
      axios
        .get("https://fortune-teller-nhy4.onrender.com/tarot", {
          params: {
            cards_list: newSelectedCards,
            kindOfHoroscopy:kindOfHoroscopy,
          },
        })
        .then((response) => {
          console.log("SUCCESS");
          console.log(response.data);
          setFortuneText(response.data.interpretation);
          setIsLoading(false);
          setRevealFortune(true);
        })
        .catch((err) => {
          console.error(err);
          setFortuneText("خطا");
          setIsLoading(false);
          setRevealFortune(true);
        });
    }
  };

  return (
    <div dir="rtl" className="tarot-bg">
      <Container className="py-3 py-md-4" fluid="sm">
        <div className="return-wrapper mb-2">
          <IoIosArrowRoundBack 
            className="back-icon" 
            onClick={() => navigate("/")}
          />
        </div>
        <div className="return-wrapper mb-3">
          <a href="https://fortune-teller-front.onrender.com/user" className="return-btn">
            user
          </a>
        </div>

        <div className="tarot-header">
          <h2 className="tarot-title">فال تاروت</h2>
          <p className="tarot-subtitle">رویای کهنِ رنگ و رمز</p>
          <p className="tarot-desc">
              تعداد کارت را انتخاب کنید، سپس از بین کارت‌های نمایش داده شده روی هر کارت کلیک کنید.
              وقتی تعداد انتخاب‌ها به پایان رسید، زمان تفسیر فرا می‌رسد.
          </p>

          <div className="tarot-divider"></div>

          <div className="tarot-controls">
          <Form.Select
              className="tarot-select"
              onChange={handleSelectValue}
              defaultValue=""
            >
              <option value="">لطفا ابتدا تعداد کارت‌ها را انتخاب کنید</option>
              <option value="1">فال تاروت ۱ کارته</option>
              <option value="3">فال تاروت ۳ کارته</option>
              <option value="5">فال تاروت ۵ کارته</option>
              <option value="7">فال تاروت ۷ کارته</option>
          </Form.Select>
          <Form.Select
              className="tarot-select"
              onChange={handleSelectKind}
              defaultValue=""
            >
              <option value="">هدف اصلی این فال</option>
              <option value="عشقی">عشقی</option>
              <option value="کاری">کاری</option>
              <option value="مالی">مالی</option>
              <option value="سایر">سایر</option>
          </Form.Select>

          <div className="tarot-info">
            <div className="tarot-info-box">
              <div className="tarot-info-label">پیشرفت انتخاب</div>
              <div className="tarot-info-value">
                {maxNumOfCards ? `${selectedCount} / ${maxNumOfCards}` : "—"}
              </div>
            </div>
            <div className="tarot-info-box">
              <div className="tarot-info-label">تعداد کارت‌های نمایشی</div>
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
                handleSelectedCard(name);
              }}
            />
          ))}
        </div>

        <div className="tarot-footer">
          ✨ نقشِ کاغذِ کهن، پیامِ ستارگان
        </div>

        <RevealFortune
          initiatedShow={revealFortune}
          text={fortuneText}
          handleClose_={() => setRevealFortune(false)}
        />
        <TarotLoading 
          isVisible={isLoading}
          onComplete={() => {
            // Optional: Do something when loading completes naturally
          }}
        />
      </Container>
    </div>
  );
}

export default Tarot;