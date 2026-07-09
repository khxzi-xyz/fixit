import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";

// Apply saved theme before first paint (default: light).
if (localStorage.getItem("FixIt Now_theme") === "dark") {
  document.documentElement.classList.add("dark");
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, backgroundColor: '#ff4444', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: 24, marginBottom: 10 }}>App Crashed!</h1>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 20 }}>
            {this.state.error?.stack}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 10 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
