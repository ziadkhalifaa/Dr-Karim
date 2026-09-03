import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, "success", duration),
    error: (msg, duration) => addToast(msg, "error", duration),
    info: (msg, duration) => addToast(msg, "info", duration),
    warning: (msg, duration) => addToast(msg, "warning", duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if rendered outside provider to avoid runtime crashes
    return {
      success: (msg) => console.log("[Toast Success]", msg),
      error: (msg) => console.error("[Toast Error]", msg),
      info: (msg) => console.log("[Toast Info]", msg),
      warning: (msg) => console.warn("[Toast Warning]", msg),
    };
  }
  return ctx;
}

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: "rgba(16, 185, 129, 0.95)",
    border: "#059669",
    color: "#ffffff",
  },
  error: {
    icon: AlertCircle,
    bg: "rgba(239, 68, 68, 0.95)",
    border: "#dc2626",
    color: "#ffffff",
  },
  warning: {
    icon: AlertTriangle,
    bg: "rgba(245, 158, 11, 0.95)",
    border: "#d97706",
    color: "#ffffff",
  },
  info: {
    icon: Info,
    bg: "rgba(2, 79, 171, 0.95)",
    border: "#022466",
    color: "#ffffff",
  },
};

function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 380,
        width: "calc(100vw - 48px)",
        pointerEvents: "none",
        direction: "rtl",
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
                backdropFilter: "blur(10px)",
                fontSize: 14,
                fontWeight: 600,
                pointerEvents: "auto",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => onRemove(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  opacity: 0.8,
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
