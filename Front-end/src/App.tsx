import { Routes, Route } from "react-router-dom";
import Landingpage from "./pages/landing"
import Tarot  from "./pages/tarot";
import Coffee from "./pages/coffee";
import Stars from "./pages/stars";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landingpage/>} />
      <Route path="/tarot" element={<Tarot />} />
      <Route path="/coffee" element={<Coffee />} />
      <Route path="/stars" element={<Stars />} />
    </Routes>
  );
}

export default App;
