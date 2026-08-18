import { useTranslation } from "react-i18next";
import { SECTIONS } from "../data/sections";

// Circular "plate" progress — 5 segments, one per intake step (site palette).
const SEG_COLORS = ["#3ca503", "#6fd005", "#c2f753", "#024fab", "#48d6f9"];
const UNFILLED = "rgba(16, 31, 46, 0.14)";

const RADIUS = 80;
const CIRC = 2 * Math.PI * RADIUS;
const SEG = CIRC / 5;
const DASH = SEG - 9;
const REST = CIRC - DASH;
const OFFSETS = Array.from({ length: 5 }, (_, i) => -i * SEG);

function toArNum(n) {
  const digits = "٠١٢٣٤٥٦٧٨٩";
  return String(n)
    .split("")
    .map((d) => (/[0-9]/.test(d) ? digits[Number(d)] : d))
    .join("");
}

export default function ProgressBar({ sectionNo, progress, tier, lang, ariaLive }) {
  const { t } = useTranslation("assessment");
  const stepIndex = Math.max(0, sectionNo - 1);
  const filled = Math.min(stepIndex, 5);
  const section = SECTIONS[stepIndex];
  const title = lang === "ar" ? section.titleAr : section.titleEn;

  const counter = t("ui.step", { n: sectionNo, total: 5 });
  const display = lang === "ar" ? toArNum(sectionNo) : sectionNo;

  return (
    <div className="aq-plate" role="group" aria-label={t("progress.label")}>
      <svg className="aq-plate__svg" viewBox="0 0 200 200" aria-hidden="true">
        <g transform="rotate(-90 100 100)">
          <circle
            cx="100" cy="100" r={RADIUS}
            stroke={UNFILLED} strokeWidth="16" fill="none"
          />
          {OFFSETS.map((offset, i) => (
            <circle
              key={i}
              className="aq-plate__seg"
              cx="100" cy="100" r={RADIUS}
              stroke={i < filled ? SEG_COLORS[i] : UNFILLED}
              strokeWidth="16" fill="none"
              strokeDasharray={`${DASH} ${REST}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
      <div className="aq-plate__labels">
        <div className="aq-plate__name">{title}</div>
        <div className="aq-plate__counter">
          {lang === "ar" ? `الخطوة ${display} من ٥` : counter}
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {ariaLive} · {t("progress.label")} {progress}%
      </div>
      {tier === "urgent" && (
        <p className="aq-plate__urgent" role="status">
          {t("progress.urgentNotice")}
        </p>
      )}
    </div>
  );
}
