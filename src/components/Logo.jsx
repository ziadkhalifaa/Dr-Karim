export default function Logo({ size = 71 }) {
  return (
    <svg
      className="logo-svg"
      width={size}
      height={size}
      viewBox="0 0 71 71"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lgBrand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#123B4A" />
          <stop offset="1" stopColor="#092C38" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M63.2853 63.0276C56.3528 69.9601 44.7736 70.5847 35.5503 70.5847C26.3462 70.5847 14.7418 69.9548 7.81452 63.0276C0.88199 56.0954 0.257812 44.5154 0.257812 35.2922C0.257812 26.0884 0.887264 14.4844 7.81452 7.55676C14.7422 0.629501 26.3462 0.0000477 35.5503 0.0000477C44.7736 0.0000477 56.3532 0.624229 63.2853 7.55676C70.2126 14.484 70.8424 26.0884 70.842 35.2922C70.842 44.5154 70.2179 56.095 63.2853 63.0276Z"
        fill="url(#lgBrand)"
      />
      <path
        d="M35.5 54c0-12 0-21 0-30"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M35.5 29c-9-1-13.5-9-13.5-17 8 0 13.5 5.5 13.5 17Z"
        fill="#F27C6B"
      />
      <path
        d="M35.5 39.5c9-1 13.5-9 13.5-17-8 0-13.5 5.5-13.5 17Z"
        fill="#1C7180"
      />
      <circle cx="35.5" cy="13.5" r="4.6" fill="#F7D9A8" />
    </svg>
  );
}