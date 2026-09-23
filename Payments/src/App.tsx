import { Routes, Route } from "react-router-dom";
import { Payments } from "./payment";


function App() {
  return(
    <Routes>
      <Route index element={<Payments />} />
      <Route path="step-2" element='' />
      <Route path="step-3" element='' />
    </Routes>
  );

}

export default App;