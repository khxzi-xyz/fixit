import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply saved theme before first paint (default: light).
if (localStorage.getItem("FixIt Now_theme") === "dark") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
