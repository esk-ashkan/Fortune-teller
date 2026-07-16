import { Routes, Route } from "react-router-dom";
import Landingpage from "./pages/landing"
import Tarot  from "./pages/tarot";
import Coffee from "./pages/coffee";
//import Stars from "./pages/stars";
import TeleUserData from "./pages/user";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landingpage/>} />
      <Route path="/tarot" element={<Tarot />} />
      <Route path="/coffee" element={<Coffee />} />
      <Route path="/stars" element={<TeleUserData />} />
      <Route path="/user" element={<TeleUserData />} />

    </Routes>
  );
}

export default App;
