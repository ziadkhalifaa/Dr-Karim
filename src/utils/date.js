/**
 * date.js
 * Utility functions for date formatting.
 */

/**
 * Format a date string or timestamp into a relative "time ago" string.
 * @param {string|number|Date} dateParam 
 * @returns {string} e.g. "Just now", "5m ago", "2h ago", "Yesterday"
 */
export function formatTimeAgo(dateParam) {
  if (!dateParam) return "";

  const date = new Date(dateParam);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
}
