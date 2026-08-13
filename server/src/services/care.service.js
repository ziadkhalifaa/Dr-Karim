// Phase 6B — Patient daily care + doctor analytics (docs/daily-care-workflow.md §31).
//
// The patient dashboard is built on the immutable execution rows:
//   - careProgramService.materializes days up to TODAY lazily in tenant tz,
//   - statuses are tip-derived per day, summaries are derived on the fly,
//   - adherence is ALWAYS derived (never a stored editable percentage).

import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { careProgramService } from "./care-program.service.js";
import { careExecutionService, tipExecutions } from "./care-execution.service.js";
import { adherenceSummary, computeStreak } from "./care-analytics.js";
import { tenantTimezone, todayInTimeZone, addDays } from "../utils/care-time.js";

const {
  Tenant, CareProgram, CareDay, CareActivityInstance, CareActivityExecution,
  CareDailyCheckin,
} = models;

function actor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  return {
    role: auth.membership.role,
    userId: String(auth.user.id),
    doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null,
    patientId: auth.user.patient_id ? String(auth.user.patient_id) : null,
  };
}

async function loadTenant(tenantId) {
  const tenant = await Tenant.findByPk(tenantId, { raw: true });
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant not found");
  return tenant;
}

async function loadProgram(programId, tenantId) {
  const program = await CareProgram.findOne({ where: { id: programId, tenant_id: tenantId, deleted_at: null }, raw: true });
  if (!program) throw new AppError(404, "CARE_PROGRAM_NOT_FOUND", "Care program not found");
  return program;
}

function canRead(program, current) {
  if (["doctor", "staff"].includes(current.role)) return;
  if (current.role === "patient" && String(program.patient_id) === String(current.patientId)) return;
  throw new AppError(403, "CARE_READ_FORBIDDEN", "Access denied to this care program");
}

// Load all care days + instances + executions + check-ins in one pass.
async function loadRangeData(programId, tenantId, from, to) {
  const days = await CareDay.findAll({
    where: { care_program_id: programId, tenant_id: tenantId, date: { [Op.between]: [from, to] } },
    order: [["date", "ASC"]], raw: true,
  });
  const instances = await CareActivityInstance.findAll({
    where: { care_day_id: { [Op.in]: days.map((d) => d.id) }, tenant_id: tenantId },
    order: [["sort_order", "ASC"], ["id", "ASC"]], raw: true,
  });
  const executions = await CareActivityExecution.findAll({
    where: { care_day_id: { [Op.in]: days.map((d) => d.id) }, tenant_id: tenantId },
    order: [["id", "ASC"]], raw: true,
  });
  const checkins = await CareDailyCheckin.findAll({
    where: { care_day_id: { [Op.in]: days.map((d) => d.id) }, tenant_id: tenantId }, raw: true,
  });
  return { days, instances, executions, checkins };
}

const EMPTY = () => ({ planned: 0, completed: 0, partial: 0, skipped: 0, not_recorded: 0, total: 0 });
const TYPES = ["nutrition", "exercise", "medication"];

function deriveDaily(program, days, instances, executions, today) {
  const execByInstance = new Map();
  for (const exec of executions) {
    const list = execByInstance.get(String(exec.activity_instance_id)) || [];
    list.push(exec);
    execByInstance.set(String(exec.activity_instance_id), list);
  }
  const instByDay = new Map();
  for (const inst of instances) {
    const list = instByDay.get(String(inst.care_day_id)) || [];
    list.push(inst);
    instByDay.set(String(inst.care_day_id), list);
  }
  const daily = [];
  for (const day of days) {
    const dayInstances = instByDay.get(String(day.id)) || [];
    const derived = dayInstances.map((inst) => {
      const tips = tipExecutions(execByInstance.get(String(inst.id)) || []);
      const effective = tips.length ? tips[tips.length - 1] : null;
      const status = effective ? effective.status : (day.date < today ? "not_recorded" : "planned");
      return { instance: inst, status, effective };
    });
    daily.push({ day, derived });
  }
  return daily;
}

// Diagnostic pass that also materializes missing future/current days lazily.
async function ensureMaterialized(program, tenant, upTo, transaction) {
  return careProgramService.ensureMaterializedUpTo(program, tenant, upTo, transaction);
}

export const careService = {
  // Patient "Daily Care" dashboard (today + this week + streak).
  async dashboard({ tenantId, auth }) {
    const current = actor(auth);
    if (!["patient"].includes(current.role) || !current.patientId) {
      throw new AppError(403, "CARE_DASHBOARD_FORBIDDEN", "Only a patient sees their Daily Care dashboard");
    }
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));

    await sequelize.transaction(async (transaction) => {
      const program = await careProgramService.programForPatient(current.patientId, tenantId, transaction);
      if (program && ["active", "paused", "scheduled"].includes(program.status)) {
        const ref = await CareProgram.findByPk(program.id, { transaction, raw: true });
        if (ref) await ensureMaterialized(ref, tenant, today, transaction);
      }
    });

    const program = await careProgramService.programForPatient(current.patientId, tenantId);
    if (!program || !["active", "paused", "scheduled"].includes(program.status)) {
      return { available: false };
    }
    await loadProgram(program.id, tenantId);
    canRead(program, current);

    const from = addDays(today, -6);
    const { days, instances, executions, checkins } = await loadRangeData(program.id, tenantId, from, today);
    const daily = deriveDaily(program, days, instances, executions, today);
    const checkinsByDay = new Map(checkins.map((c) => [String(c.care_day_id), c]));

    const todaysDay = days.find((d) => d.date === today);
    const todayInstances = todaysDay ? daily.find((d) => String(d.day.id) === String(todaysDay.id)).derived : [];

    const weekSummary = EMPTY();
    const weekByType = { nutrition: EMPTY(), exercise: EMPTY(), medication: EMPTY() };
    for (const item of daily) {
      for (const d of item.derived) {
        weekSummary[d.status] += 1;
        weekSummary.total += 1;
        const t = d.instance.activity_type;
        weekByType[t][d.status] += 1;
        weekByType[t].total += 1;
      }
    }
    const allExec = {};
    for (const t of TYPES) allExec[t] = [];
    for (const exec of executions) {
      const inst = instances.find((i) => String(i.id) === String(exec.activity_instance_id));
      if (inst) allExec[inst.activity_type].push(exec);
    }
    const adherence = adherenceSummary(weekSummary, allExec);
    const streak = computeStreak(daily.map((d) => ({
      date: d.day.date,
      executions: d.derived.map((x) => ({ status: x.status })),
    })));
    const effectiveVersion = await careProgramService.effectiveVersion(program, today);

    return {
      available: true,
      program: {
        id: String(program.id),
        status: program.status,
        startDate: program.start_date,
        endDate: program.end_date,
        instructions: effectiveVersion?.program_instructions || program.program_instructions,
      },
      today: today,
      day: todaysDay ? { id: String(todaysDay.id), dayIndex: todaysDay.day_index } : null,
      todayInstances: todayInstances.map((d) => ({
        id: d.instance.id,
        code: d.instance.code,
        nameAr: d.instance.name_ar,
        nameEn: d.instance.name_en,
        activityType: d.instance.activity_type,
        measure: d.instance.measure,
        plannedTarget: d.instance.planned_target_json,
        status: d.status,
        effectiveExecution: d.effective ? { id: String(d.effective.id), status: d.effective.status, actualValue: d.effective.actual_value_json, recordedAt: d.effective.recorded_at } : null,
      })),
      checkin: todaysDay ? (checkinsByDay.get(String(todaysDay.id)) || null) : null,
      week: {
        from,
        to: today,
        summary: weekSummary,
        byType: weekByType,
        streak: streak.streak,
      },
      adherence,
    };
  },

  // A specific patient day (used by the patient and by the doctor).
  async day({ tenantId, dayId, auth }) {
    return careExecutionService.daySummary({ tenantId, dayId, auth });
  },

  // Patient or doctor period summary for a care program.
  async programSummary({ tenantId, programId, auth, from, to }) {
    const current = actor(auth);
    const program = await loadProgram(programId, tenantId);
    canRead(program, current);
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));
    if (from == null) from = program.start_date;
    if (to == null) to = today;
    if (to > program.end_date) to = program.end_date;
    if (from > to) throw new AppError(422, "CARE_RANGE_INVALID", "from must be on or before to");

    await sequelize.transaction(async (transaction) => {
      const ref = await CareProgram.findByPk(program.id, { transaction, raw: true });
      if (ref) await ensureMaterialized(ref, tenant, today, transaction);
    });

    const { days, instances, executions, checkins } = await loadRangeData(program.id, tenantId, from, to);
    const daily = deriveDaily(program, days, instances, executions, today);
    const totals = EMPTY();
    const byType = { nutrition: EMPTY(), exercise: EMPTY(), medication: EMPTY() };
    for (const item of daily) {
      for (const d of item.derived) {
        totals[d.status] += 1;
        totals.total += 1;
        byType[d.instance.activity_type][d.status] += 1;
        byType[d.instance.activity_type].total += 1;
      }
    }
    const allExec = {};
    for (const t of TYPES) allExec[t] = [];
    for (const exec of executions) {
      const inst = instances.find((i) => String(i.id) === String(exec.activity_instance_id));
      if (inst) allExec[inst.activity_type].push(exec);
    }
    const adherence = adherenceSummary(totals, allExec);

    const dailyList = daily.map(({ day, derived }) => {
      const row = EMPTY();
      for (const d of derived) row[d.status] += 1;
      return {
        date: day.date,
        dayIndex: day.day_index,
        dayId: String(day.id),
        summary: row,
        activities: derived.length,
        checkin: checkins.find((c) => String(c.care_day_id) === String(day.id)) || null,
      };
    });
    return {
      available: true,
      program: { id: String(program.id), status: program.status, startDate: program.start_date, endDate: program.end_date },
      range: { from, to, dates: days.map((d) => d.date) },
      summary: totals,
      byType,
      adherence,
      streak: computeStreak(daily.map((d) => ({ date: d.day.date, executions: d.derived.map((x) => ({ status: x.status })) }))).streak,
      daily: dailyList,
    };
  },
};

export default careService;