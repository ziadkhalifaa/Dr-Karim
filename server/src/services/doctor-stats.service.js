// Doctor overview statistics — real aggregates backing the professional
// dashboard overview page. Everything is computed from the live database so the
// numbers always reflect the current state of the clinic.

import { Op } from "sequelize";
import { sequelize, models } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";

const {
  Patient, DoctorReview, Appointment, AppointmentSlot, Payment,
  Subscription, Notification, PatientCheckin, CareProgram,
  Content, Service,
} = models;

function actor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  const actorRef = {
    role: auth.membership.role,
    userId: String(auth.user.id),
    doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null,
  };
  if (!["doctor", "staff"].includes(actorRef.role)) {
    throw new AppError(403, "OVERVIEW_FORBIDDEN", "Only doctor or staff may view overview statistics");
  }
  return actorRef;
}

const DAY_MS = 86400000;

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  return new Date(startOfDay().getTime() - n * DAY_MS);
}

// Bucket rows into a dense 14-day series so the client never has to fill gaps.
function dailySeries(rows, dayCount = 14) {
  const buckets = new Map();
  for (let i = dayCount - 1; i >= 0; i -= 1) buckets.set(daysAgo(i).toISOString().slice(0, 10), 0);
  for (const row of rows) {
    const d = String(row.date || "").slice(0, 10);
    if (buckets.has(d)) buckets.set(d, Number(row.count ?? row.value ?? 0));
  }
  return [...buckets.entries()].map(([date, value]) => ({ date, value }));
}

export const doctorStatsService = {
  async overview({ tenantId, auth }) {
    const current = actor(auth);
    const today = startOfDay();
    const upcomingThrough = new Date(today.getTime() + 30 * DAY_MS);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [patientTotal, newThisWeek, newThisMonth, pendingPayment] = await Promise.all([
      Patient.count({ where: { tenant_id: tenantId } }),
      Patient.count({ where: { tenant_id: tenantId, created_at: { [Op.gte]: daysAgo(7) } } }),
      Patient.count({ where: { tenant_id: tenantId, created_at: { [Op.gte]: monthStart } } }),
      Payment.count({ where: { tenant_id: tenantId, status: "pending" } }),
    ]);

    const [subscriptionsActive, subscriptionsPending, expiringSoon] = await Promise.all([
      Subscription.count({ where: { tenant_id: tenantId, status: "active" } }),
      Subscription.count({ where: { tenant_id: tenantId, status: "pending" } }),
      Subscription.count({
        where: {
          tenant_id: tenantId, status: "active",
          ends_at: { [Op.gte]: today, [Op.lte]: new Date(today.getTime() + 7 * DAY_MS) },
        },
      }),
    ]);

    const reviewWhere = { tenant_id: tenantId };
    const [queued, assigned, inReview, needsClarification, approved, rejected, urgent] = await Promise.all([
      DoctorReview.count({ where: { ...reviewWhere, status: "queued" } }),
      DoctorReview.count({ where: { ...reviewWhere, status: "assigned" } }),
      DoctorReview.count({ where: { ...reviewWhere, status: "in_review" } }),
      DoctorReview.count({ where: { ...reviewWhere, status: "needs_clarification" } }),
      DoctorReview.count({ where: { ...reviewWhere, status: "approved" } }),
      DoctorReview.count({ where: { ...reviewWhere, status: "rejected" } }),
      sequelize
        .query(
          "SELECT COUNT(*) AS count FROM doctor_review d JOIN assessment_session s ON s.id = d.assessment_session_id WHERE d.tenant_id = :tenantId AND d.status NOT IN ('approved','rejected') AND s.overall_tier = 'urgent'",
          { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT },
        )
        .then((rows) => Number(rows[0]?.count || 0)),
    ]);

    const doctorScope = { tenant_id: tenantId, deleted_at: null };
    const [appointmentsToday, appointmentsUpcoming, appointmentsDone, slotsOpen, slotsBooked] = await Promise.all([
      Appointment.count({ where: { ...doctorScope, scheduled_start_at: { [Op.gte]: today, [Op.lt]: new Date(today.getTime() + DAY_MS) }, status: { [Op.in]: ["pending", "confirmed"] } } }),
      Appointment.count({ where: { ...doctorScope, scheduled_start_at: { [Op.gte]: today, [Op.lte]: upcomingThrough }, status: { [Op.in]: ["pending", "confirmed"] } } }),
      Appointment.count({ where: { ...doctorScope, status: { [Op.in]: ["completed", "no_show"] } } }),
      AppointmentSlot.count({ where: { tenant_id: tenantId, status: "open" } }),
      AppointmentSlot.count({ where: { tenant_id: tenantId, status: "booked" } }),
    ]);

    const [paymentsPending, paymentsApproved, revenueThisMonth, revenueTotal] = await Promise.all([
      Payment.count({ where: { tenant_id: tenantId, status: "pending" } }),
      Payment.count({ where: { tenant_id: tenantId, status: "approved" } }),
      Payment.sum("amount", { where: { tenant_id: tenantId, status: "approved", reviewed_at: { [Op.gte]: monthStart } } }),
      Payment.sum("amount", { where: { tenant_id: tenantId, status: "approved" } }),
    ]);

    const [careActive, careCompleted, checkinsPending, unread, articlesPublished, servicesActive] = await Promise.all([
      CareProgram.count({ where: { tenant_id: tenantId, status: "active", deleted_at: null } }),
      CareProgram.count({ where: { tenant_id: tenantId, status: "completed", deleted_at: null } }),
      PatientCheckin.count({ where: { tenant_id: tenantId, status: "submitted" } }),
      Notification.count({ where: { tenant_id: tenantId, recipient_role: "doctor", read_at: null } }),
      Content.count({ where: { tenant_id: tenantId, status: "published" } }),
      Service.count({ where: { tenant_id: tenantId, status: "active" } }),
    ]);

    const contactMessageCount = await sequelize
      .query(
        "SELECT COUNT(*) AS count FROM contact_message WHERE is_read = 0",
        { type: sequelize.QueryTypes.SELECT },
      )
      .then((rows) => Number(rows[0]?.count || 0))
      .catch(() => 0);

    const [patientTrend, paymentTrend, appointmentTrend] = await Promise.all([
      sequelize.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count
         FROM patient WHERE tenant_id = :tenantId AND created_at >= :from
         GROUP BY DATE(created_at) ORDER BY date ASC`,
        { replacements: { tenantId, from: daysAgo(13).toISOString() }, type: sequelize.QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT DATE(reviewed_at) AS date, SUM(amount) AS value
         FROM payment WHERE tenant_id = :tenantId AND status = 'approved' AND reviewed_at IS NOT NULL AND reviewed_at >= :from
         GROUP BY DATE(reviewed_at) ORDER BY date ASC`,
        { replacements: { tenantId, from: daysAgo(13).toISOString() }, type: sequelize.QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT DATE(scheduled_start_at) AS date, COUNT(*) AS count
         FROM appointment WHERE tenant_id = :tenantId AND deleted_at IS NULL AND scheduled_start_at >= :from
         GROUP BY DATE(scheduled_start_at) ORDER BY date ASC`,
        { replacements: { tenantId, from: daysAgo(13).toISOString() }, type: sequelize.QueryTypes.SELECT },
      ),
    ]);

    const [recentPatients, recentPayments, recentAppointments] = await Promise.all([
      Patient.findAll({ where: { tenant_id: tenantId }, order: [["id", "DESC"]], limit: 6, raw: true }),
      Payment.findAll({ where: { tenant_id: tenantId }, order: [["id", "DESC"]], limit: 6, raw: true }),
      Appointment.findAll({
        where: { ...doctorScope, scheduled_start_at: { [Op.gte]: today } },
        order: [["scheduled_start_at", "ASC"]], limit: 5, raw: true,
      }),
    ]);

    const patientIds = [...new Set([...recentPatients.map((row) => row.id), ...recentPayments.map((row) => row.patient_id), ...recentAppointments.map((row) => row.patient_id)])];
    const [patientNames, packageNamePairs] = await Promise.all([
      patientIds.length ? Patient.findAll({ where: { id: { [Op.in]: patientIds } }, attributes: ["id", "full_name"], raw: true }) : [],
      recentPayments.length
        ? sequelize.query(
            "SELECT p.id AS payment_id, pk.name AS package_name FROM payment p LEFT JOIN package pk ON pk.id = p.package_id WHERE p.id IN (:ids)",
            { replacements: { ids: recentPayments.map((row) => row.id) }, type: sequelize.QueryTypes.SELECT },
          )
        : [],
    ]);
    const nameById = Object.fromEntries(patientNames.map((row) => [String(row.id), row.full_name]));
    const paymentPackage = Object.fromEntries(packageNamePairs.map((row) => [String(row.payment_id), row.package_name]));

    await auditService.record({
      tenantId, action: "doctor.overview", entity: "dashboard", entityRef: "overview",
      metadata: { patients: patientTotal }, actorType: current.role, actorId: current.userId,
    });

    return {
      patients: { total: patientTotal, newThisWeek: newThisWeek, newThisMonth, pendingPayment },
      subscriptions: { active: subscriptionsActive, pending: subscriptionsPending, expiringSoon },
      reviews: { queued, assigned, inReview, needsClarification, approved, rejected, urgent, pending: queued + assigned + inReview + needsClarification },
      appointments: { today: appointmentsToday, upcoming: appointmentsUpcoming, completed: appointmentsDone, slots: { open: slotsOpen, booked: slotsBooked } },
      payments: { pending: paymentsPending, approved: paymentsApproved, revenueThisMonth: Number(revenueThisMonth || 0), revenueTotal: Number(revenueTotal || 0) },
      operations: { careActive, careCompleted, checkinsPending, unread, articlesPublished, servicesActive, unreadMessages: contactMessageCount },
      trends: { patients: dailySeries(patientTrend), payments: dailySeries(paymentTrend), appointments: dailySeries(appointmentTrend) },
      recent: {
        patients: recentPatients.map((row) => ({ id: String(row.id), fullName: row.full_name, createdAt: row.created_at, status: row.status })),
        payments: recentPayments.map((row) => ({ id: String(row.id), patientName: nameById[String(row.patient_id)] || null, amount: Number(row.amount), method: row.method, status: row.status, createdAt: row.created_at, packageName: paymentPackage[String(row.id)] || null })),
        appointments: recentAppointments.map((row) => ({ id: String(row.id), patientName: nameById[String(row.patient_id)] || null, type: row.type, status: row.status, scheduledStartAt: row.scheduled_start_at })),
      },
    };
  },
};

export default doctorStatsService;