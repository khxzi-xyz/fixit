import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#ff4444", color: "white", minHeight: "100vh", wordBreak: "break-all" }}>
          <h1 style={{ fontSize: "24px" }}>App Crashed!</h1>
          <p style={{ fontWeight: "bold", fontSize: "16px", marginTop: "10px" }}>{this.state.error?.message}</p>
          <pre style={{ fontSize: "12px", whiteSpace: "pre-wrap", marginTop: "10px" }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
