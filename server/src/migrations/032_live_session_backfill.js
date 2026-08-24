// Corrective data backfill (forward-only §21):
//
// Packages created or edited via the admin panel can end up WITHOUT a
// `live_session` package_entitlement row even though they are care packages
// (they carry nutrition_plan / exercise_plan / weekly_checkin entitlements).
// Payment approval then copies the incomplete set into subscription_entitlement,
// so patients on those packages see "البث المباشر غير مشمول" and cannot book
// video follow-ups that their plan promises.
//
// This migration:
//   1) grants `live_session` (limit 1 per week) to every package that has at
//      least one care entitlement but no live_session row yet;
//   2) mirrors the new entitlement onto every ACTIVE subscription of those
//      packages (same copy semantics as payment.service.review()).
//
// Idempotent: both steps skip rows that already exist.

const CARE_CODES = ["nutrition_plan", "exercise_plan", "weekly_checkin"];
const codeList = CARE_CODES.map((c) => `'${c}'`).join(", ");

export async function up(queryInterface, sequelize) {
  await sequelize.query(`
    INSERT INTO package_entitlement
      (tenant_id, package_id, code, allowed, limit_value, period_unit, created_at, updated_at)
    SELECT DISTINCT pe.tenant_id, pe.package_id, 'live_session', 1, 1, 'week', NOW(), NOW()
    FROM package_entitlement pe
    WHERE pe.code IN (${codeList})
      AND NOT EXISTS (
        SELECT 1 FROM package_entitlement x
        WHERE x.package_id = pe.package_id AND x.code = 'live_session'
      )
  `);

  await sequelize.query(`
    INSERT INTO subscription_entitlement
      (tenant_id, subscription_id, package_entitlement_id, code, allowed,
       limit_value, used_value, period_unit)
    SELECT s.tenant_id, s.id, pe.id, pe.code, pe.allowed,
           pe.limit_value, 0, pe.period_unit
    FROM subscription s
    JOIN package_entitlement pe
      ON pe.package_id = s.package_id AND pe.code = 'live_session'
    WHERE s.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM subscription_entitlement se
        WHERE se.subscription_id = s.id AND se.code = 'live_session'
      )
  `);
}
