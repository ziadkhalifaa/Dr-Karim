// Standard package entitlement codes shared between the doctor package editor
// and the public package display. Codes map to `package_entitlement` rows and,
// once a subscription is approved, to `subscription_entitlement` rows that the
// entitlement service enforces (live sessions, plans, check-ins, follow-ups).

export const ENTITLEMENTS = [
  { code: "doctor_followup", label: "متابعة مباشرة مع الدكتور", hint: "متابعة شخصية مستمرة طوال فترة الباقة", icon: "Stethoscope" },
  { code: "live_session", label: "لايف سيشن مباشر", hint: "جلسة فيديو مباشرة مع الدكتور", icon: "Video" },
  { code: "weekly_checkin", label: "تتبع أسبوعي", hint: "تسجيل القياسات والالتزام أسبوعياً", icon: "ClipboardCheck" },
  { code: "nutrition_plan", label: "خطة تغذية مخصصة", hint: "خطة وجبات حسب حالتك وأهدافك", icon: "Salad" },
  { code: "exercise_plan", label: "برنامج تمارين", hint: "برنامج تمارين رياضية مخصص", icon: "Dumbbell" },
  { code: "consultation", label: "استشارة طبية", hint: "استشارة واحدة مع الدكتور", icon: "HeartPulse" },
];

export const ENTITLEMENT_LABELS = Object.fromEntries(ENTITLEMENTS.map((e) => [e.code, e.label]));
export const ENTITLEMENT_HINTS = Object.fromEntries(ENTITLEMENTS.map((e) => [e.code, e.hint]));

export function entitlementLabel(code) {
  if (ENTITLEMENT_LABELS[code]) return ENTITLEMENT_LABELS[code];
  const str = String(code || "").replace(/[_-]+/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1);
}