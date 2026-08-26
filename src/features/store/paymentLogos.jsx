// Real brand-style marks for Egyptian payment methods (dependency-free inline SVG).
// Uses official brand colors so they render consistently without external assets.

export function VodafoneCashLogo({ size = 34 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Vodafone Cash">
      <rect width="64" height="64" rx="14" fill="#E1000F" />
      <path
        d="M22 20h20c5 0 9 4 9 9v3c0 5-4 9-9 9h-9l-8 7v-7h-3c-5 0-9-4-9-9v-3c0-5 4-9 9-9z"
        fill="#fff"
      />
      <circle cx="27" cy="31" r="2.6" fill="#E1000F" />
      <circle cx="37" cy="31" r="2.6" fill="#E1000F" />
      <path d="M27 38c3 2.4 7 2.4 10 0" stroke="#E1000F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function InstaPayLogo({ size = 34 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="InstaPay">
      <rect width="64" height="64" rx="14" fill="#004BC3" />
      <rect x="22" y="25" width="4.6" height="15" rx="2.3" fill="#fff" />
      <circle cx="24.3" cy="21" r="3" fill="#fff" />
      <path d="M42 23 L30 38 h7 l-3 11 13 -17 h-7 z" fill="#F7941E" />
    </svg>
  );
}
