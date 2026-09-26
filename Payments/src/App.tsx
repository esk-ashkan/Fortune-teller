import { Routes, Route } from "react-router-dom";
import { ReceiptApp } from "./reciptapp";
import Reservation from "./reservation";


function App() {
  return(
    <Routes>
      <Route index element={<Reservation />} />
      <Route path="/receipt" element={<ReceiptApp />} />
      <Route path="step-3" element='' />
    </Routes>
  );

}

export default App;