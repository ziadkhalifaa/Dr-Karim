/**
 * usePublicSettings.js
 * Fetches clinic info and social media settings from the backend once,
 * caches them in module-level state so all components share the same data
 * without duplicate requests.
 */
import { useState, useEffect } from "react";
import { publicApi } from "../api/client";

// Module-level cache so we only hit the API once per page load
let _cache = null;
let _promise = null;

function fetchSettings() {
  if (_promise) return _promise;
  _promise = publicApi.settings()
    .then((data) => { _cache = data; return data; })
    .catch(() => { _promise = null; return null; });
  return _promise;
}

export function usePublicSettings() {
  const [settings, setSettings] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setSettings(_cache); setLoading(false); return; }
    fetchSettings().then((data) => { setSettings(data); setLoading(false); });
  }, []);

  return { settings, loading };
}
