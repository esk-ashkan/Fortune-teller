import { Routes, Route } from "react-router-dom";
import { Payments } from "./payment";
import { ReceiptApp } from "./reciptapp";


function App() {
  return(
    <Routes>
      <Route index element={<ReceiptApp />} />
      <Route path="step-2" element={<Payments />} />
      <Route path="step-3" element='' />
    </Routes>
  );

}

export default App;