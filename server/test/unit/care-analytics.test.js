import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveInstanceStatus, summarizeInstances, adherenceSummary, computeStreak, summaryPhrase,
} from "../../src/services/care-analytics.js";

test("deriveInstanceStatus reflects the latest append-only execution", () => {
  const instance = { date: "2026-08-10" };
  assert.equal(deriveInstanceStatus(instance, [{ status: "completed" }], "2026-08-10"), "completed");
  assert.equal(deriveInstanceStatus(instance, [{ status: "partial" }], "2026-08-10"), "partial");
});

test("deriveInstanceStatus is planned for the future and not_recorded in the past", () => {
  const future = { date: "2026-08-12" };
  const past = { date: "2026-08-08" };
  assert.equal(deriveInstanceStatus(future, null, "2026-08-10"), "planned");
  assert.equal(deriveInstanceStatus(past, null, "2026-08-10"), "not_recorded");
});

test("summarizeInstances buckets by status and activity type", () => {
  const derived = [
    { status: "completed", activityType: "nutrition" },
    { status: "completed", activityType: "exercise" },
    { status: "skipped", activityType: "nutrition" },
    { status: "not_recorded", activityType: "medication" },
    { status: "partial", activityType: "nutrition" },
  ];
  const out = summarizeInstances(derived);
  assert.equal(out.total.total, 5);
  assert.equal(out.total.completed, 2);
  assert.equal(out.total.skipped, 1);
  assert.equal(out.total.not_recorded, 1);
  assert.equal(out.total.partial, 1);
  assert.equal(out.byType.nutrition.completed, 1);
  assert.equal(out.byType.medication.not_recorded, 1);
});

test("adherenceSummary is unavailable without recorded data (not enough data)", () => {
  const summary = { completed: 0, partial: 0, skipped: 0, byType: {} };
  const out = adherenceSummary(summary, {});
  assert.deepEqual(out, { available: false, reason: "not_enough_data" });
});

test("adherenceSummary computes recorded completion rate over recorded items only", () => {
  const summary = {
    completed: 7, partial: 1, skipped: 1, not_recorded: 41,
    byType: {
      nutrition: { completed: 4, partial: 1, skipped: 0 },
      exercise: { completed: 3, partial: 0, skipped: 1 },
      medication: { completed: 0, partial: 0, skipped: 0 },
    },
  };
  const out = adherenceSummary(summary, {});
  assert.equal(out.available, true);
  assert.equal(out.recorded, 9);
  assert.equal(out.completionRate, 77.8); // 7 / 9 recorded
  assert.equal(out.category.medication.available, false);
});

test("adherenceSummary derives quantity adherence from actual vs planned values", () => {
  const summary = { completed: 1, partial: 1, skipped: 0, byType: { nutrition: { completed: 1, partial: 1, skipped: 0 }, exercise: { completed: 0, partial: 0, skipped: 0 }, medication: { completed: 0, partial: 0, skipped: 0 } } };
  const executions = {
    nutrition: [{ actual_value_json: { value: 100 }, planned_snapshot_json: { value: 100 } }],
    exercise: [{ actual_value_json: { value: 15 }, planned_snapshot_json: { value: 30 } }],
  };
  const out = adherenceSummary(summary, executions);
  assert.equal(out.quantityAdherence.available, true);
  assert.equal(out.quantityAdherence.ratio, (100 / 100 + 15 / 30) / 2);
});

test("computeStreak counts consecutive fully-completed days ending today", () => {
  const days = [
    { date: "2026-08-08", executions: [{ status: "completed" }, { status: "completed" }] },
    { date: "2026-08-09", executions: [{ status: "completed" }, { status: "completed" }] },
    { date: "2026-08-10", executions: [{ status: "completed" }, { status: "completed" }] },
  ];
  assert.equal(computeStreak(days).streak, 3);
});

test("computeStreak resets on a partial/skipped/no-record day", () => {
  const days = [
    { date: "2026-08-08", executions: [{ status: "completed" }] },
    { date: "2026-08-09", executions: [] },
    { date: "2026-08-10", executions: [{ status: "completed" }] },
  ];
  assert.equal(computeStreak(days).streak, 1); // today only
});

test("computeStreak resets on a skipped day", () => {
  const days = [
    { date: "2026-08-08", executions: [{ status: "skipped" }] },
    { date: "2026-08-09", executions: [{ status: "completed" }] },
  ];
  assert.equal(computeStreak(days).streak, 1);
});

test("summaryPhrase renders recorded actions only", () => {
  assert.equal(summaryPhrase({ planned: 5, completed: 7, partial: 1, skipped: 1, not_recorded: 41, total: 55 }), "7 completed · 1 partial · 1 skipped · 41 not_recorded");
  assert.equal(summaryPhrase({ planned: 3, completed: 0, partial: 0, skipped: 0, not_recorded: 0, total: 3 }), "0 recorded");
});