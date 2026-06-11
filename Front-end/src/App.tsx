import { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log("🚀 App component mounted successfully!");
    document.body.style.background = "purple";
  }, []);

  return (
    <div>
      <h1 style={{ color: "white", textAlign: "center", paddingTop: "100px", fontSize: "3rem" }}>
        HELLO WORLD
      </h1>
      <p style={{ color: "white", textAlign: "center" }}>
        If you see this text, React is working.
      </p>
    </div>
  );
}

export default App;