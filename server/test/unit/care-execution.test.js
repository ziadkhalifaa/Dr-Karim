import { test } from "node:test";
import assert from "node:assert/strict";
import { tipExecutions } from "../../src/services/care-execution.service.js";

test("tipExecutions returns the latest row of a single chain untouched", () => {
  const rows = [
    { id: "1", correction_of_id: null, status: "completed" },
    { id: "2", correction_of_id: "1", status: "partial" },
  ];
  const tips = tipExecutions(rows);
  assert.equal(tips.length, 1);
  assert.equal(tips[0].id, "2");
});

test("tipExecutions resolves a multi-level correction chain to the tip", () => {
  const rows = [
    { id: "1", correction_of_id: null, status: "completed" },
    { id: "2", correction_of_id: "1", status: "partial" },
    { id: "3", correction_of_id: "2", status: "skipped" },
  ];
  const tips = tipExecutions(rows);
  assert.equal(tips.length, 1);
  assert.equal(tips[0].id, "3");
});

test("tipExecutions keeps independent per-instance tips distinct", () => {
  const rows = [
    { id: "1", correction_of_id: null, status: "completed" },
    { id: "2", correction_of_id: null, status: "skipped" },
    { id: "3", correction_of_id: "1", status: "partial" },
  ];
  const tips = tipExecutions(rows);
  assert.equal(tips.length, 2);
  assert.deepEqual(tips.map((r) => r.id), ["2", "3"]);
});

test("tipExecutions handles empty input", () => {
  assert.deepEqual(tipExecutions(null), []);
  assert.deepEqual(tipExecutions([]), []);
});