import Container from "react-bootstrap/Container";
import { tarotCards } from "./tarot_cards";
import CardsComponent from "./cards";
import { useEffect, useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import axios from "axios";
import "./tarot.css";
import RevealFortune from "./revealfortune";
import TarotLoading from "./TarotLoading"; 

function Tarot() {
  const [cardsList, setCardsList] = useState<string[]>([]);
  const [maxNumOfCards, setMaxNumOfCards] = useState<number>(0);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [revealFortune, setRevealFortune] = useState(false);
  const [fortuneText, setFortuneText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New loading state

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
      <Container className="py-4">
        <div className="return-wrapper">
          <a href="https://fortune-teller-front.onrender.com/" className="return-btn">
            بازگشت به صفحه اصلی
          </a>
        </div>
        <div className="return-wrapper">
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
            // For example, play a sound or show a notification
          }}
        />
      </Container>
    </div>
  );
}

export default Tarot;