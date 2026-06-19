import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css';


console.log("main.tsx loaded");

const rootElement = document.getElementById("root");
console.log(rootElement);

ReactDOM.createRoot(rootElement!).render(
  <App />
);