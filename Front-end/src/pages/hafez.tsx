import axios from "axios";
import { useEffect, useState } from "react";

function Hafez() {
  const [poem, setPoem] = useState('');
  const [faal, setFaal] = useState('');

  useEffect(() => {
    axios
      .get("https://fortune-teller-nhy4.onrender.com/hafez")
      .then((response) => {
        console.log("SUCCESS");
        console.log(response.data);
        setPoem(response.data.poem.poem);       // متن شعر
        setFaal(response.data.ai_faal);         // فال هوش مصنوعی
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div dir="rtl" style={{ padding: "20px" }}>
      <h2>فال حافظ</h2>

      <h3>متن شعر</h3>
      <p>{poem}</p>

      <h3>فال</h3>
      <p>{faal}</p>
    </div>
  );
}

export default Hafez;
