export default function PlateArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* soft back ring */}
      <circle cx="260" cy="220" r="188" stroke="rgba(28,113,128,0.35)" strokeWidth="26" />
      <circle cx="98" cy="96" r="26" fill="rgba(242,124,107,0.35)" />
      <circle cx="448" cy="64" r="14" fill="rgba(247,217,168,0.9)" />
      <circle cx="60" cy="330" r="12" fill="rgba(28,113,128,0.8)" />
      <circle cx="470" cy="360" r="30" fill="rgba(242,124,107,0.2)" />

      {/* plate */}
      <path
        d="M120 340c-14-14-21-34-21-56v-8c28 0 56-4 78-13l9 9c8 8 38 18 68 18v-6c24 2 48 0 64-8l6 6c-12 30-30 52-62 66-26 11-60 12-92 8-24-2-42-8-50-16Z"
        fill="#fff"
        stroke="rgba(18,59,74,0.14)"
      />
      <path d="M170 318c-30-6-58-18-78-34 34 40 88 60 154 58-26-6-48-14-76-24Z" fill="rgba(18,59,74,0.1)" />

      {/* pie sectors */}
      <g transform="translate(262 262)">
        <circle cx="0" cy="-13" r="103" fill="#fff" fillOpacity="0.95" />
        <path d="M0 -13 L0 -108 A103 103 0 0 1 100 -36 Z" fill="#1C7180" />
        <path d="M0 -13 L100 -36 A103 103 0 0 1 73 74 Z" fill="#F27C6B" />
        <path d="M0 -13 L73 74 A103 103 0 0 1 -73 74 Z" fill="#F7D9A8" />
        <path d="M0 -13 L-73 74 A103 103 0 0 1 -100 -36 Z" fill="#123B4A" />
        <circle cx="0" cy="-13" r="30" fill="#fff" />
        <path
          d="M-9 -17c4-5 9-7 13-6 3-2 7-1 10 1 6 3 8 10 4 15-3 4-10 8-14 10-4-2-11-6-14-10-4-5-2-12 1-10Z"
          fill="#F27C6B"
        />
      </g>

      {/* fork */}
      <g transform="translate(88 292)">
        <rect x="0" y="0" width="7" height="58" rx="3.5" fill="#123B4A" />
        <path d="M-6 26c0-14 2-26 5-26s5 5 7 11c1-6 3-11 6-11s5 12 5 26c0 12-5 30-11 30s-12-18-12-30Z" fill="#123B4A" />
        <rect x="-1.5" y="58" width="10" height="14" rx="3.5" fill="rgba(18,59,74,0.35)" />
      </g>

      {/* knife */}
      <g transform="translate(421 258)">
        <path d="M0 0 52 0c6 0 10 7 10 18s-4 18-10 18H0L0 26l38-2-38-6V0Z" fill="#123B4A" />
        <rect x="0" y="38" width="10" height="16" rx="3.5" fill="rgba(18,59,74,0.35)" />
      </g>

      {/* floating leaf dots */}
      <path d="M330 90c14-6 28-8 44-8-1 16-5 29-12 39-18-3-28-9-32-31Z" fill="#1C7180" />
      <circle cx="266" cy="52" r="8" fill="#F27C6B" />
      <circle cx="368" cy="146" r="6" fill="#F7D9A8" />
    </svg>
  );
}

export function ResultsArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 540 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="30" y="120" width="150" height="220" rx="26" fill="rgba(28,113,128,0.3)" />
      <rect x="205" y="70" width="130" height="270" rx="26" fill="rgba(18,59,74,0.85)" />
      <rect x="360" y="150" width="150" height="190" rx="26" fill="rgba(242,124,107,0.85)" />

      <path d="M60 330h60c8-24 8-44 0-60 22-4 40-2 54 6" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="105" cy="256" r="26" fill="#fff" />
      <path d="M93 258c4-5 9-8 13-6 1 2 1 4 0 6-2 3-5 5-8 7-1 1-2 1-3 0-2-2-4-4-2-7Z" fill="#F27C6B" />

      <path d="m246 268 10 10 16-18" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M246 252V228M266 252V244" stroke="#fff" strokeWidth="7" strokeLinecap="round" />

      <path d="M360 196v110h-2c0 8 3 12 9 12 5-5 8-11 9-18 6-4 13-6 23-6" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="transparent" />

      <circle cx="196" cy="350" r="16" fill="#F7D9A8" />
      <path d="M196 341c-6-3-5-7-9-9 9-1 13-6 9-12 4 1 7 3 9 6 3-1 6-1 8 1-5 4-5 8-10 10-2 1-4 2-7 4Z" fill="#1C7180" />
    </svg>
  );
}

export function AssessmentArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="210" cy="210" r="140" stroke="rgba(28,113,128,0.18)" strokeWidth="26" />
      <circle
        cx="210"
        cy="210"
        r="140"
        stroke="#1C7180"
        strokeWidth="26"
        strokeDasharray="300 580"
        strokeLinecap="round"
        transform="rotate(-90 210 210)"
      />
      <circle cx="210" cy="210" r="92" fill="#123B4A" />
      <circle cx="210" cy="210" r="46" fill="#F27C6B" />
      <path d="M210 210 254 176" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
      <circle cx="210" cy="40" r="14" fill="#F7D9A8" />
      <rect x="60" y="250" width="16" height="120" rx="8" fill="rgba(18,59,74,0.6)" />
      <rect x="90" y="286" width="16" height="84" rx="8" fill="rgba(28,113,128,0.9)" />
      <rect x="120" y="262" width="16" height="108" rx="8" fill="rgba(242,124,107,0.9)" />
      <path d="M52 320c30 16 62 24 96 26" stroke="#F27C6B" strokeWidth="6" strokeLinecap="round" />
      <circle cx="148" cy="318" r="9" fill="#F7D9A8" />
    </svg>
  );
}

export function ChartArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 500 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="250" cy="190" r="150" stroke="rgba(28,113,128,0.3)" strokeWidth="20" />
      <path d="M250 220c-8 8-8 20 0 28-18 0-28 10-28 26 6-8 12-12 22-14-6 10-6 20 1 29 12 3 20 11 31 14 9-11 15-24 15-39 0-35-26-49-41-44Z" fill="#123B4A" />
      <path d="M214 222c-6-26 6-42 38-50-2 16-14 26-38 50Z" fill="#1C7180" />
      <path d="M238 178c2-20-6-30-24-30 3 12 13 22 24 30Z" fill="#F27C6B" />
      <path d="M272 194c8-10 7-20-2-30-4 10-3 20 2 30Z" fill="#F7D9A8" />

      <rect x="52" y="250" width="18" height="46" rx="9" fill="rgba(18,59,74,0.5)" />
      <rect x="86" y="218" width="18" height="78" rx="9" fill="rgba(18,59,74,0.7)" />
      <rect x="120" y="288" width="18" height="8" rx="9" fill="rgba(18,59,74,0.35)" />
      <path d="M48 314c28 14 58 22 92 24" stroke="#F27C6B" strokeWidth="6" strokeLinecap="round" />
      <circle cx="140" cy="312" r="8" fill="#F7D9A8" />
    </svg>
  );
}