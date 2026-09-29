import { Routes, Route } from "react-router-dom";
import { ReceiptApp } from "./reciptapp";
import Reservation from "./reservation";
import Services from "./services";


function App() {
  return(
    <Routes>
      <Route index element={<Reservation />} />
      <Route path="/receipt" element={<ReceiptApp />} />
      <Route path="/services" element={<Services />} />
    </Routes>
  );

}

export default App;