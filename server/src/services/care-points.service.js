// Care points ledger: award, balance, leaderboard, redemption.

import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";

const { CarePoints, CareReward, CareActivityDefinition, Product } = models;

const REASON_POINTS = {
  program_join: 50, exercise_completed: 10, nutrition_completed: 5, checkin: 5,
};

function actor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  return {
    role: auth.membership.role,
    userId: String(auth.user.id),
    patientId: auth.user.patient_id ? String(auth.user.patient_id) : null,
  };
}

export const carePointsService = {
  async award({ tenantId, programId, patientId, reason, activityInstanceId, careDayId, referenceId, transaction }) {
    const pts = REASON_POINTS[reason];
    if (!pts && reason !== "custom" && reason !== "streak_bonus" && reason !== "redeemed") {
      throw new AppError(422, "POINTS_INVALID_REASON", `Unknown reason: ${reason}`);
    }
    const points = reason === "custom" ? (referenceId ? Number(referenceId) : 0) : pts;
    if (!points || points < 0) return null;
    const row = await CarePoints.create({
      tenant_id: tenantId, patient_id: patientId, care_program_id: programId,
      care_day_id: careDayId || null, activity_instance_id: activityInstanceId || null,
      points, reason, reference_id: referenceId || null,
    }, { transaction });
    return row.toJSON();
  },

  async getBalance(patientId, tenantId, programId = null) {
    const where = { patient_id: patientId, tenant_id: tenantId };
    if (programId) where.care_program_id = programId;
    const balance = await CarePoints.sum("points", { where, default: 0 });
    return Number(balance);
  },

  async getLeaderboard(tenantId, programId, limit = 20) {
    const rows = await CarePoints.findAll({
      where: { tenant_id: tenantId, care_program_id: programId },
      attributes: ["patient_id", [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("points")), 0), "balance"], [sequelize.fn("COUNT", sequelize.col("id")), "activities_completed"]],
      group: ["patient_id"],
      order: [[sequelize.literal("balance"), "DESC"]],
      limit, raw: true,
    });
    return rows;
  },

  async redeem({ tenantId, patientId, programId, productId, pointsToSpend, transaction }) {
    const product = await Product.findByPk(productId, { transaction, raw: true });
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
    if (!product.points_price) throw new AppError(422, "PRODUCT_NO_POINTS_PRICE", "This product is not redeemable with points");
    const ptsPrice = Number(product.points_price);
    if (pointsToSpend < ptsPrice) throw new AppError(422, "POINTS_INSUFFICIENT", `Need ${ptsPrice} points`);
    const balance = await this.getBalance(patientId, tenantId, programId);
    if (balance < ptsPrice) throw new AppError(422, "POINTS_INSUFFICIENT", `Need ${ptsPrice} points, have ${balance}`);

    await CarePoints.create({
      tenant_id: tenantId, patient_id: patientId, care_program_id: programId,
      points: -ptsPrice, reason: "redeemed", reference_id: String(productId),
    }, { transaction });

    const reward = await CareReward.create({
      tenant_id: tenantId, patient_id: patientId, product_id: productId,
      points_spent: ptsPrice, status: "approved",
    }, { transaction });
    return reward.toJSON();
  },
};

export async function awardProgramJoinPoints(tenantId, programId, patientId, transaction) {
  return carePointsService.award({ tenantId, programId, patientId, reason: "program_join", transaction });
}

export async function awardCompletionPoints({ tenantId, programId, patientId, activityType, careDayId, activityInstanceId, transaction }) {
  const reason = activityType === "exercise" ? "exercise_completed"
    : activityType === "nutrition" ? "nutrition_completed"
    : activityType === "checkin" ? "checkin" : null;
  if (!reason) return null;
  return carePointsService.award({ tenantId, programId, patientId, reason, careDayId, activityInstanceId, transaction });
}
