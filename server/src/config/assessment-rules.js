// Frozen, JSON-serializable interpretation of question visibility rules.
// The seed stores this in question_version_cfg so historical definitions stay stable.
const equals = (question, value) => ({ op: "equals", question, value });
const includes = (question, values) => ({ op: "includesAny", question, values });

export function conditionalForQuestion(code) {
  const rules = {
    Q01_02: equals("Q01_01", "someone_else"), Q01_04b: { op: "ageBelow", value: 2 },
    Q02_04: { op: "adultOrUnknown" }, Q02_07: { op: "minor" },
    Q04_02: includes("Q04_01", ["yes", "prefer_not_to_say"]), Q04_02o: includes("Q04_02", ["other"]),
    Q04_D1: includes("Q04_02", ["diabetes"]), Q04_D2: includes("Q04_02", ["diabetes"]), Q04_D3: includes("Q04_02", ["diabetes"]),
    Q04_T1: includes("Q04_02", ["thyroid"]), Q04_C1: includes("Q04_02", ["cancer"]),
    Q04_03: { op: "pregnancyRelevant" }, Q04_04b: includes("Q04_04", ["lost", "gained"]), Q05_02: equals("Q05_01", "yes"), Q05_04: includes("Q04_02", ["diabetes"]),
    Q06_05: { op: "adultOrUnknown" }, Q06_08: { op: "adultOrUnknown" }, Q06_09: { op: "adultOrUnknown" }, Q07_03b: equals("Q07_03", "yes"), Q08_02: equals("Q08_01", "yes"),
  };
  return rules[code] || null;
}

function age(state) { const raw = state.answers.Q01_04; return raw === undefined || raw === null || raw === "" ? null : Number(raw); }
export function evaluateConditional(rule, state) {
  if (!rule) return true;
  const value = state.answers[rule.question];
  switch (rule.op) {
    case "equals": return value === rule.value;
    case "includesAny": return Array.isArray(value) && value.some((v) => rule.values.includes(v));
    case "ageBelow": return age(state) !== null && age(state) < rule.value;
    case "minor": return age(state) !== null && age(state) < 18;
    case "adultOrUnknown": return age(state) === null || age(state) >= 18;
    case "pregnancyRelevant": return state.answers.Q01_05 === "female" && age(state) !== null && age(state) >= 12 && age(state) <= 55;
    default: return false;
  }
}
