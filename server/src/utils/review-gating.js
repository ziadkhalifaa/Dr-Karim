import { AppError } from "./errors.js";
import { sequelize } from "../config/database.js";

export async function assertApprovedReview({ reviewId, tenantId, transaction }) {
  if (!reviewId) throw new AppError(409, "PLAN_REVIEW_REQUIRED", "An approved doctor review is required");
  const review = await sequelize.models.doctor_review.findOne({ where: { id: reviewId, tenant_id: tenantId, status: "approved" }, transaction, raw: true });
  if (!review) throw new AppError(409, "PLAN_REVIEW_NOT_APPROVED", "The linked doctor review is not approved");
}

export async function assertPlanReviewGated(instance, options) {
  if (!["approved", "active"].includes(instance.status)) return;
  const reviewId = instance.doctor_review_id || instance.source_review_id;
  await assertApprovedReview({ reviewId, tenantId: instance.tenant_id, transaction: options?.transaction });
}
