export const SunIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </svg>
);

export const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.2 13.6a8.2 8.2 0 0 1-9.8-9.8A8.6 8.6 0 0 0 4 11.8 8.4 8.4 0 0 0 12.4 20a8.4 8.4 0 0 0 7.8-6.4Z" />
  </svg>
);

export const BurgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 42 43" fill="none">
    <circle cx="21" cy="21.3" r="20" fill="rgba(255,255,255,0.14)" />
    <path d="M13 16.3h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M13 21.2h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M13 26.3h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
    <rect x="0.5" y="0.5" width="33" height="33" rx="12" fill="var(--tint)" />
    <path d="M12 12l10 10M22 12L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ArrowIcon = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 94 94" fill="none">
    <circle cx="47" cy="47" r="47" fill="var(--bg)" />
    <path d="M52 60 40 47l12-13" stroke="var(--primary)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-11 11M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const CrossIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const AccordionIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="19" fill="var(--highlight-bg)" />
    <path
      d="M20 12.5v15M12.5 20h15"
      stroke="var(--highlight-text)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

export const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 21v-7h2.4l.36-2.8H13.5V9.4c0-.81.22-1.36 1.39-1.36h1.48V5.55c-.26-.03-1.14-.11-2.16-.11-2.14 0-3.6 1.3-3.6 3.7v2.06H8.2V14h2.41v7h2.89Z" />
  </svg>
);

export const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" />
  </svg>
);

export const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.6 3c.3 2.1 1.5 3.6 3.4 3.9v3c-1.3 0-2.5-.4-3.4-1.1v5.4c0 4-2.8 6.3-6.1 6.3-3.3 0-6-2.7-6-6s2.7-6 6-6c.4 0 .7 0 1.1.1v3.1c-.4-.1-.7-.2-1.1-.2-1.8 0-3 1.3-3 3s1.2 3 3 3c1.8 0 3-1.2 3-3V3h3.1Z" />
  </svg>
);

export const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9Z" />
  </svg>
);

export const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

export const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.25.7-1.45 1.35-2 1.4-.5.06-1.15.1-1.8-.1-.4-.13-.9-.3-1.55-.6-2.6-1.1-4.3-3.8-4.43-4-.13-.2-1.06-1.4-1.06-2.68 0-1.27.66-1.9.9-2.16.23-.26.5-.32.67-.32h.48c.16 0 .36-.05.56.43.2.5.7 1.73.76 1.85.06.13.1.28.02.45-.08.17-.12.27-.24.42l-.36.42c-.12.13-.24.26-.1.5.14.25.61 1 1.3 1.62.9.8 1.64 1.05 1.88 1.17.24.12.38.1.52-.06l.8-.9c.17-.2.33-.17.56-.1.24.07 1.5.7 1.75.84.26.13.43.2.5.31.06.13.06.72-.2 1.43Z" />
  </svg>
);

export const AppleIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="14" fill="var(--secondary)" />
    <circle cx="24" cy="22" r="13" fill="#fff" fillOpacity="0.92" />
    <path d="M24 9c-1.4-2.6-4.4-2.8-4.4-2.8S20 8.6 24 9Z" fill="#fff" fillOpacity="0.92" />
    <path d="M18 16.5c2-2 4-2.6 6-1.7 2-.9 4-.3 6 1.7" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PlanIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="14" fill="var(--primary)" />
    <circle cx="17" cy="17" r="12" stroke="#fff" strokeWidth="3.2" />
    <path d="M24 24h14M24 24l5.5 5.5M24 24l12.5-5.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SupportIcon = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="14" fill="var(--gold)" />
    <path d="M18 30V20a6 6 0 1 1 12 0v10" stroke="#6b4a1d" strokeWidth="3.4" strokeLinecap="round" fill="transparent" />
    <rect x="14" y="25" width="6" height="9" rx="2.4" fill="#6b4a1d" />
    <rect x="28" y="25" width="6" height="9" rx="2.4" fill="#6b4a1d" />
  </svg>
);

export const PulseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h4l2.5-6 4 12 2.5-6h7" />
  </svg>
);

export const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.3 6.8L12 17.2 6 20.6l1.3-6.8L2.2 9.1l6.9-.8L12 2Z" />
  </svg>
);

// Service icons (stroke-based, inherit color)
export const LeafIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8a10 10 0 0 1-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
);

export const ScaleIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10M12 3v18M3 7h2c2 0 4 1.5 5 2.5M7 7h2c-2 0-4 1.5-5 2.5" strokeOpacity=".6" />
  </svg>
);

export const GrowthIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m7 15 4-5 3 3 5-7" />
  </svg>
);

export const DropletIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.7s6 6.4 6 10.3a6 6 0 0 1-12 0c0-3.9 6-10.3 6-10.3Z" />
    <path d="M9.5 14.5a2.5 2.5 0 0 0 2 2.5" />
  </svg>
);

export const ShieldIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
    <path d="m9 11.5 2 2 4-4.5" />
  </svg>
);

export const HeartIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.5-1.4 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.1 3 5.5l7 6.5 7-6.5Z" />
  </svg>
);

export const UserGroupIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
    <path d="M16 5.2a3.3 3.3 0 0 1 0 5.6M18.5 15.3c1.6.7 2.7 2 3 3.7" />
  </svg>
);

export const ChartsIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="4" height="11" rx="1.4" />
    <rect x="10" y="4" width="4" height="17" rx="1.4" />
    <rect x="17" y="7" width="4" height="14" rx="1.4" />
  </svg>
);