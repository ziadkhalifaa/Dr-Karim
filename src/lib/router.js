import { useEffect, useState } from "react";

const listeners = new Set();
let currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

export function navigate(to) {
  if (to === currentPath) return;
  window.history.pushState({}, "", to);
  currentPath = to;
  listeners.forEach((fn) => fn(to));
}

export function useRoute() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onChange = (next) => setPath(next);
    const onPop = () => {
      currentPath = window.location.pathname;
      setPath(currentPath);
    };
    listeners.add(onChange);
    window.addEventListener("popstate", onPop);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return path;
}
