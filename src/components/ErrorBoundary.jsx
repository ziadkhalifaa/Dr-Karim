import { Component } from "react";

// Route-level safety net: React unmounts the whole tree on an uncaught render
// error (blank white page). This boundary keeps the rest of the UI alive and
// surfaces the failure instead.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crash:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #f6fafc)", padding: 24, fontFamily: "var(--font-body, sans-serif)" }}>
          <div style={{ maxWidth: 480, textAlign: "center", background: "var(--card-bg, #fff)", border: "1px solid var(--line, rgba(16,31,46,.1))", borderRadius: 20, padding: "32px 28px", boxShadow: "var(--shadow, 0 8px 24px rgba(2,36,102,.08))" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text, #101f2e)", margin: "0 0 8px" }}>حصلت مشكلة في عرض الصفحة</h1>
            <p style={{ fontSize: 14.5, color: "var(--text-muted, #55677a)", lineHeight: 1.7, margin: "0 0 20px" }}>
              جرّب تحديث الصفحة. لو المشكلة اتكررت، صوّر الرسالة دي وابعتهالنا.
            </p>
            <pre style={{ direction: "ltr", textAlign: "left", fontSize: 12, background: "var(--bg-soft, #edf3f7)", borderRadius: 10, padding: 12, maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 20px" }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ padding: "12px 26px", borderRadius: 12, border: "none", background: "var(--primary, #6fd005)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
