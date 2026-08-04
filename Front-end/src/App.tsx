import { Routes, Route } from "react-router-dom";
import Landingpage from "./pages/landing"
import Tarot  from "./pages/tarot";
import Coffee from "./pages/coffee";
import Stars from "./pages/stars";
import TeleUserData from "./pages/user";
import Hafez from "./pages/hafez";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landingpage/>} />
      <Route path="/tarot" element={<Tarot />} />
      <Route path="/coffee" element={<Coffee />} />
      <Route path="/stars" element={<Stars />} />
      <Route path="/hafez" element={<Hafez />} />
      <Route path="/user" element={<TeleUserData />} />

    </Routes>
  );
}

export default App;
