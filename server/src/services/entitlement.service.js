// Entitlement service — subscription-aware service gating.
//
// The subscription clock and the package period are distinct:
//   - month / week packages: the patient is entitled while the subscription is
//     "active" AND the package period has not elapsed (ends_at in the future).
//     Remaining days are derived from starts_at/ends_at, separate from the
//     package's nominal duration (duration_value x unit).
//   - one_time packages: the period is open-ended and consumption is counted
//     through used_value/limit_value on the subscription entitlement.
//
// Legacy patients who have NO subscription rows are untouched by these gates
// (legacyAllow); enforcement applies to everyone who has entered the monetized
// flow so an expired subscription reliably closes the plan.

import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";

const { Subscription, Package, SubscriptionEntitlement } = models;

const UNIT_DAYS = { month: 30, week: 7, one_time: null };

export function durationProfile(pack) {
  if (!pack) return null;
  const unit = pack.duration_unit || "one_time";
  const daysPerUnit = UNIT_DAYS[unit];
  const periodDays = daysPerUnit == null ? null : (pack.duration_value || 1) * daysPerUnit;
  return { unit, value: pack.duration_value || 1, periodDays, timed: daysPerUnit != null };
}

function isPeriodActive(sub, profile) {
  if (!profile?.timed) return true;
  const now = Date.now();
  if (sub.ends_at && new Date(sub.ends_at).getTime() <= now) return false;
  if (sub.starts_at && new Date(sub.starts_at).getTime() > now) return false;
  return true;
}

function remainingDays(sub) {
  if (!sub?.ends_at) return null;
  return Math.max(0, Math.ceil((new Date(sub.ends_at).getTime() - Date.now()) / 86400000));
}

export async function subscriptionState({ tenantId, patientId, transaction } = {}) {
  const sub = await Subscription.findOne({
    where: { tenant_id: tenantId, patient_id: patientId, status: "active" },
    order: [["id", "DESC"]], transaction, raw: true,
  });
  if (!sub) {
    const ever = await Subscription.findOne({ where: { tenant_id: tenantId, patient_id: patientId }, attributes: ["id"], transaction, raw: true });
    return { subscribed: Boolean(ever), active: false, legacy: !ever, subscription: null, entitlements: [] };
  }
  const pack = await Package.findByPk(sub.package_id, { transaction, raw: true });
  const duration = durationProfile(pack);
  const periodActive = isPeriodActive(sub, duration);
  const entitlements = await SubscriptionEntitlement.findAll({ where: { subscription_id: sub.id, tenant_id: tenantId }, transaction, raw: true });
  const byCode = {};
  for (const ent of entitlements) byCode[ent.code] = ent;
  return {
    subscribed: true,
    active: sub.status === "active" && periodActive,
    legacy: false,
    subscription: {
      id: String(sub.id),
      status: sub.status,
      startsAt: sub.starts_at,
      endsAt: sub.ends_at,
      duration,
      remainingDays: remainingDays(sub),
      periodActive,
      package: pack ? { id: String(pack.id), name: pack.name, slug: pack.slug, durationValue: pack.duration_value, durationUnit: pack.duration_unit, price: String(pack.price), currency: pack.currency } : null,
    },
    entitlements,
    entitlementsByCode: byCode,
  };
}

// Throws unless the patient is inside an active subscription period (no specific
// entitlement required). Used where several package codes can back a feature.
export async function requireActivePeriod({ tenantId, patientId, transaction, legacyAllow = true } = {}) {
  const state = await subscriptionState({ tenantId, patientId, transaction });
  if (state.legacy && legacyAllow) return { legacy: true, state };
  if (!state.subscribed || !state.active) {
    if (state.subscribed) throw new AppError(403, "SUBSCRIPTION_EXPIRED", "Subscription period has ended — renew your package to keep the service");
    throw new AppError(403, "SUBSCRIPTION_REQUIRED", "An active subscription is required for this service");
  }
  return { legacy: false, state };
}

// Throws unless the patient may consume `code` under an active subscription.
// With legacyAllow (default) patients who never purchased a subscription keep
// running as before.
export async function requireEntitlement({ tenantId, patientId, code, transaction, legacyAllow = true } = {}) {
  const state = await subscriptionState({ tenantId, patientId, transaction });
  if (state.legacy && legacyAllow) return { legacy: true, state };
  if (!state.subscribed || !state.active) {
    if (state.subscribed) throw new AppError(403, "SUBSCRIPTION_EXPIRED", "Subscription period has ended — renew your package to keep the service");
    throw new AppError(403, "SUBSCRIPTION_REQUIRED", "An active subscription is required for this service");
  }
  const entitlement = state.entitlementsByCode[code];
  if (!entitlement || !entitlement.allowed) throw new AppError(403, "ENTITLEMENT_REQUIRED", "Your current package does not include this service");
  const oneTime = state.subscription.duration?.unit === "one_time";
  if (oneTime && entitlement.limit_value != null && (entitlement.used_value >= entitlement.limit_value)) throw new AppError(403, "ENTITLEMENT_LIMIT_REACHED", "This once-off service is already used");
  return { legacy: false, state, entitlement };
}

export async function useEntitlement({ tenantId, patientId, code, amount = 1, transaction } = {}) {
  const state = await subscriptionState({ tenantId, patientId, transaction });
  if (!state.subscribed || !state.active || state.subscription.duration?.unit !== "one_time") return null;
  const entitlement = await SubscriptionEntitlement.findOne({ where: { subscription_id: Number(state.subscription.id), tenant_id: tenantId, code }, transaction });
  if (entitlement) {
    entitlement.used_value = (entitlement.used_value || 0) + amount;
    await entitlement.save({ transaction });
  }
  return entitlement;
}

export const entitlementService = {
  UNIT_DAYS, durationProfile, isPeriodActive, remainingDays, subscriptionState, requireEntitlement, useEntitlement, requireActivePeriod,
};

export default entitlementService;