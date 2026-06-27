import Container from "react-bootstrap/Container";
import { tarotCards } from "./tarot_cards";
import CardsComponent from "./cards";
import { useEffect, useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import axios from "axios";


function Tarot() {
  const [cardsList, setCardsList] = useState<string[]>([]);
  const [maxNumOfCards, setMaxNumOfCards] = useState<number>(0);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);


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
  };

  const handleSelectedCard = (cardName: string) => {
    if (!maxNumOfCards) return;

    setSelectedCount((prev) => {
      if (prev >= maxNumOfCards) return prev;

      const next = prev + 1;
      console.log("----->one card is selected!", cardName, `(${next}/${maxNumOfCards})`);
      setSelectedCards(prev => [...prev, cardName])

      if (next === maxNumOfCards) {
        console.log("----->Now, It's time to tell you everything");

        axios
          .get("https://fortune-teller-production-d4ea.up.railway.app/tarot", {
            params: { cards_list: [...selectedCards, cardName] }
          })
          .then((response) => {
            console.log("Tarot interpretation:", response.data.interpretation);
          })
          .catch((error) => {
            console.error("Tarot API error:", error);
          });
      }
      return next;
    });
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        color: "#2b1b0f",
        background:
          "radial-gradient(circle at 15% 10%, rgba(255, 219, 153, 0.35), transparent 35%)," +
          "radial-gradient(circle at 90% 30%, rgba(186, 126, 62, 0.25), transparent 45%)," +
          "linear-gradient(180deg, #f3e7c9 0%, #f6f0dd 40%, #efe0c1 100%)",
      }}
    >
      <Container className="p-2">
        <div
          className="p-2 mb-4"
          style={{
            border: "1px solid rgba(110, 70, 25, 0.35)",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -80,
              background:
                "repeating-linear-gradient(45deg, rgba(160, 90, 30, 0.06), rgba(160, 90, 30, 0.06) 8px, transparent 8px, transparent 18px)",
              transform: "rotate(-6deg)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: "serif", letterSpacing: 0.5 }}>
                فال تاروت
              </h2>
              <span style={{ opacity: 0.75, fontFamily: "serif" }}>
                رویای کهنِ رنگ و رمز
              </span>
            </div>
            <p style={{ margin: "8px 0 0", opacity: 0.85, maxWidth: 760 }}>
              تعداد کارت را انتخاب کنید، سپس از بین کارت‌های نمایش داده شده روی هر کارت کلیک کنید. وقتی تعداد انتخاب‌ها به پایان رسید، زمان تفسیر فرا می‌رسد.
            </p>
          </div>

          <div
            style={{
              marginTop: 14,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(110, 70, 25, 0.35), transparent)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <Form.Select
              className="my-2"
              style={{
                width: 320,
                borderRadius: 14,
                border: "1px solid rgba(110, 70, 25, 0.35)",
                background: "rgba(255,255,255,0.6)",
              }}
              onChange={handleSelectValue}
              aria-label="انتخاب تعداد کارت"
              defaultValue=""
            >
              <option value="">
                لطفا ابتدا تعداد کارت‌ها را انتخاب کنید
              </option>
              <option value="1">فال تاروت 1 کارته</option>
              <option value="3">فال تاروت 3 کارته</option>
              <option value="5">فال تاروت 5 کارته</option>
              <option value="7">فال تاروت 7 کارته</option>
            </Form.Select>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(110, 70, 25, 0.35)",
                  background: "rgba(255,255,255,0.45)",
                  minWidth: 220,
                }}
              >
                <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 4 }}>
                  پیشرفت انتخاب
                </div>
                <div style={{ fontFamily: "serif", fontSize: 18 }}>
                  {maxNumOfCards ? `${selectedCount} / ${maxNumOfCards}` : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(110, 70, 25, 0.35)",
                  background: "rgba(255,255,255,0.45)",
                }}
              >
                <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 4 }}>
                  تعداد کارت‌های نمایشی
                </div>
                <div style={{ fontFamily: "serif", fontSize: 18 }}>
                  {cardsList.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              justifyItems: "center",
            }}
          >
          
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
        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            opacity: 0.75,
            fontFamily: "serif",
            paddingBottom: 18,
          }}
        >
          <div style={{ fontSize: 14 }}>✨ نقشِ کاغذِ کهن، پیامِ ستارگان</div>
        </div>
      </Container>
    </div>
  );
}

export default Tarot;

///////////////////////////