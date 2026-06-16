import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("main.tsx loaded");

const rootElement = document.getElementById("root");
console.log(rootElement);

ReactDOM.createRoot(rootElement!).render(
  <App />
);