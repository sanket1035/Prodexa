import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [api, setApi] = useState("checking…");
  useEffect(() => {
    fetch("/health").then((r) => r.json()).then((j) => setApi(j.status)).catch(() => setApi("unreachable"));
  }, []);
  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Prodexa</h1>
      <p>Engineering intelligence for GitHub repositories. Early development: nothing is implemented beyond this page.</p>
      <p>API status: {api}</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
