// Derived progress/adherence engine (docs/daily-progress-analytics.md).
//
// Analytics are ALWAYS derived from the immutable execution/event rows; no
// manually-editable adherence_percentage column is stored as the source of
// truth. Rules are documented in docs/daily-progress-analytics.md; formulas:
//
//   completionRate (documented "recorded completion rate"):
//     completed / (completed + partial + skipped) * 100    (only over recorded)
//   quantityRatio for measure in {quantity, duration}:
//     average(actual / planned) over executions that carry an actual value
//   streak: consecutive days ending TODAY, each with >=1 execution and ALL
//     recorded executions on that day completed. A recorded skip/partial or a
//     day with no execution resets the streak to 0. No past-today inference.
//
// "not_recorded" is never counted as failure, and a percentage is never shown
// when there is insufficient data ("Not enough data").

export function deriveInstanceStatus(instance, executions, today) {
  if (executions && executions.length) {
    return executions[0].status; // latest in the append-only chain
  }
  return instance.date < today ? "not_recorded" : "planned";
}

const STATUSES = ["planned", "completed", "partial", "skipped", "not_recorded"];
const TYPES = ["nutrition", "exercise", "medication"];
const ACTIONS = ["planned", "completed", "partial", "skipped", "not_recorded"];

function emptyRow() {
  return { planned: 0, completed: 0, partial: 0, skipped: 0, not_recorded: 0, total: 0 };
}

export function summarizeInstances(derived) {
  // derived: Array<{ status }> (status already derived from executions)
  const total = emptyRow();
  const byType = { nutrition: emptyRow(), exercise: emptyRow(), medication: emptyRow() };
  for (const item of derived) {
    const st = STATUSES.includes(item.status) ? item.status : "planned";
    total[st] += 1;
    total.total += 1;
    const row = byType[item.activityType] || emptyRow();
    row[st] += 1;
    row.total += 1;
    byType[item.activityType] = row;
  }
  return { total, byType };
}

// Documented adherence summary. Returns { available: false } when there is no
// recorded data at all (frontend renders "Not enough data" instead of a %).
export function adherenceSummary(summary, executionsByType = {}) {
  const recorded = summary.completed + summary.partial + summary.skipped;
  if (recorded === 0) return { available: false, reason: "not_enough_data" };
  const completionRate = Math.round((summary.completed / recorded) * 1000) / 10;
  const category = {};
  const byTypeMap = summary.byType || {};
  for (const type of TYPES) {
    const row = byTypeMap[type] || emptyRow();
    const rec = row.completed + row.partial + row.skipped;
    category[type] = rec === 0
      ? { available: false }
      : { available: true, completionRate: Math.round((row.completed / rec) * 1000) / 10 };
  }
  const quantityRatios = [];
  for (const list of Object.values(executionsByType)) {
    for (const exec of list || []) {
      const actual = exec.actual_value_json;
      const planned = exec.planned_snapshot_json;
      if (actual && planned && typeof actual.value === "number" && typeof planned.value === "number" && planned.value > 0) {
        quantityRatios.push(actual.value / planned.value);
      }
    }
  }
  const quantityAdherence = quantityRatios.length
    ? { available: true, ratio: Math.round((quantityRatios.reduce((a, b) => a + b, 0) / quantityRatios.length) * 1000) / 1000 }
    : { available: false };
  return { available: true, completionRate, recorded, category, quantityAdherence };
}

// Consecutive fully-completed days ending today (documented formula above).
export function computeStreak(days) {
  // days: ascending [{ date, executions }] where executions already derived-per-day
  const today = days.length ? days[days.length - 1].date : null;
  if (!today) return { streak: 0, lastDay: null };
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (day.date > today) continue;
    if (!day.executions || day.executions.length === 0) break;
    const allCompleted = day.executions.every((e) => e.status === "completed");
    if (!allCompleted) break;
    streak += 1;
  }
  return { streak, lastDay: today };
}

// Flattens a summary into the friendly display array
// ["7 completed · 1 partial · 1 skipped · 1 not recorded"] (per §15).
export function summaryPhrase(total) {
  const parts = [];
  for (const action of ACTIONS) {
    if (action === "planned") continue;
    if (total[action] > 0) parts.push(`${total[action]} ${action}`);
  }
  return parts.length ? parts.join(" · ") : "0 recorded";
}

export const CARE_SUMMARY_STATUSES = STATUSES;
export const CARE_ACTIVITY_TYPES = TYPES;