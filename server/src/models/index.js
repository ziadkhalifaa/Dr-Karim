// Model registry + associations.
// All Phase 1 models are defined here and all associations are declared once,
// centrally, so relationship behavior is reviewable in a single file.
// Cross-tenant reference protection is NOT enforceable via FK (architecture §7)
// — it is an application-layer guarantee implemented in the future API phase.

import { sequelize } from "../config/database.js";
import { GROUP_01 } from "./01_tenancy_people.js";
import { GROUP_02 } from "./02_assessment_catalog.js";
import { GROUP_03 } from "./03_assessment_sessions.js";
import { GROUP_04 } from "./04_flags.js";
import { GROUP_05 } from "./05_review_profile.js";
import { GROUP_06 } from "./06_reference_codes.js";
import { GROUP_07 } from "./07_content_services_settings.js";
import { GROUP_08 } from "./08_appointments.js";
import { GROUP_09 } from "./09_live_notes.js";
import { GROUP_10 } from "./10_nutrition.js";
import { GROUP_11 } from "./11_exercise.js";
import { GROUP_12 } from "./12_checkins.js";
import { GROUP_13 } from "./13_audit.js";
import { GROUP_14 } from "./14_authentication.js";
import { GROUP_15 } from "./15_doctor_review_notes.js";
import { GROUP_16 } from "./16_monetization.js";
import { GROUP_17 } from "./17_notifications.js";
import { GROUP_18 } from "./18_care_program.js";
import { GROUP_19 } from "./19_progress.js";
import { GROUP_20 } from "./20_store.js";

const {
  Tenant, Doctor, Patient, ContactPerson, PatientContact, PatientSession,
} = GROUP_01;
const { QuestionCatalog, AssessmentDefinition, QuestionVersionCfg } = GROUP_02;
const { AssessmentSession, AssessmentAnswer, AssessmentSnapshot } = GROUP_03;
const { FlagRule, FlagRuleVersion, AssessmentFlag } = GROUP_04;
const {
  DoctorReview, DoctorReviewEvent, PatientCondition, PatientAllergy,
  PatientMedication, PatientMeasurement, PatientLabValue,
  PatientPregnancyRecord, PatientGoalHistory,
} = GROUP_05;
const {
  RelationshipCode, GoalCode, _DietPatternCode, ReactionCode, SeverityCode,
  ConditionCode, _AppointmentStatus, _ServiceStatus,
} = GROUP_06;
const {
  ServiceCategory, ServiceCategoryTranslation, Service, ServiceTranslation,
  ContentCategory, ContentCategoryTranslation, Content, ContentTranslation,
  ClinicInfo, WorkingHour, PlatformSetting, _FeatureFlag, Testimonial,
} = GROUP_07;
const { Appointment, AppointmentSlot } = GROUP_08;
const { VideoMeetingProvider, VideoMeeting, LiveSession, SessionNote, SessionNoteClarification } = GROUP_09;
const {
  NutritionPlan, NutritionPlanVersion, FoodItem, MealTemplate, MealItem,
  FoodSubstitution, NutritionPlanNote,
} = GROUP_10;
const {
  ExercisePlan, ExercisePlanVersion, ExerciseItem, ExerciseSubstitution, ExercisePlanNote,
} = GROUP_11;
const { PatientCheckin, PatientCheckinMeasurement, PatientCheckinAdherence } = GROUP_12;
const _AuditLog = GROUP_13.AuditLog;
const { AuthUser, AuthUserTenant, AuthRefreshToken, AuthPasswordReset } = GROUP_14;
const { DoctorReviewNote } = GROUP_15;
const { Package, PackageEntitlement, Subscription, SubscriptionEntitlement, Payment, PaymentReceipt, PaymentReview, Coupon } = GROUP_16;
const { Notification, NotificationPreference } = GROUP_17;
const {
  CareProgram, CareProgramVersion, CareDay, CareActivityDefinition,
  CareActivityInstance, CareActivityExecution, CareDailyCheckin,
  CarePoints, CareReward,
} = GROUP_18;
const {
  PatientProgress, ProgressMeasurement, PatientProgressGoal, PatientProgressGoalVersion,
} = GROUP_19;
const {
  ProductCategory, Product, StoreOrder, StoreOrderItem, StorePayment, ProductReview,
} = GROUP_20;

// ---- Tenant scope (§7) ----
const TENANT_SCOPED = [
  Doctor, Patient, ContactPerson, PatientContact, PatientSession,
  AssessmentSession, DoctorReview, DoctorReviewEvent,
  PatientCondition, PatientAllergy, PatientMedication, PatientMeasurement,
  PatientLabValue, PatientPregnancyRecord, PatientGoalHistory,
  ServiceCategory, Service, ContentCategory, Content, ClinicInfo, WorkingHour, PlatformSetting,
  Appointment, AppointmentSlot, VideoMeeting, LiveSession, SessionNote, SessionNoteClarification,
  NutritionPlan, NutritionPlanVersion, MealTemplate, MealItem, FoodSubstitution, NutritionPlanNote,
  ExercisePlan, ExercisePlanVersion, ExerciseSubstitution, ExercisePlanNote,
  PatientCheckin, PatientCheckinMeasurement, PatientCheckinAdherence,
  Package, PackageEntitlement, Subscription, SubscriptionEntitlement, Payment, PaymentReceipt, PaymentReview,
  Coupon, Testimonial,
  Notification, NotificationPreference,
  CareProgram, CareProgramVersion, CareDay, CareActivityDefinition,
  CareActivityInstance, CareActivityExecution, CareDailyCheckin,
  CarePoints, CareReward,
  PatientProgress, ProgressMeasurement, PatientProgressGoal, PatientProgressGoalVersion,
  ProductCategory, Product, StoreOrder, StoreOrderItem, StorePayment,
];
for (const m of TENANT_SCOPED) {
  m.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });
  Tenant.hasMany(m, { foreignKey: "tenant_id" });
}

// ---- People ----
Doctor.hasMany(Patient, { foreignKey: "confirmed_by" }); // not used directly; provenance audit
Patient.belongsTo(Doctor, { foreignKey: "confirmed_by", as: "confirmedBy" });
Patient.belongsTo(AssessmentSession, { foreignKey: "source_session_id", as: "sourceSession" });

ContactPerson.hasMany(PatientContact, { foreignKey: "contact_person_id" });
Patient.hasMany(PatientContact, { foreignKey: "patient_id" });
PatientContact.belongsTo(Patient, { foreignKey: "patient_id" });
PatientContact.belongsTo(ContactPerson, { foreignKey: "contact_person_id" });
PatientContact.belongsTo(AssessmentSession, { foreignKey: "source_session_id", as: "sourceSession" });
PatientContact.belongsTo(RelationshipCode, { foreignKey: "relationship_code", targetKey: "code", as: "relationship" });

Patient.hasMany(PatientSession, { foreignKey: "patient_id" });
AssessmentSession.hasMany(PatientSession, { foreignKey: "assessment_session_id" });
PatientSession.belongsTo(Patient, { foreignKey: "patient_id" });
PatientSession.belongsTo(AssessmentSession, { foreignKey: "assessment_session_id" });

// ---- Assessment catalog ----
AssessmentDefinition.hasMany(QuestionVersionCfg, { foreignKey: "definition_id" });
QuestionCatalog.hasMany(QuestionVersionCfg, { foreignKey: "question_catalog_id" });
QuestionVersionCfg.belongsTo(AssessmentDefinition, { foreignKey: "definition_id" });
QuestionVersionCfg.belongsTo(QuestionCatalog, { foreignKey: "question_catalog_id" });

// ---- Sessions / answers / snapshot ----
AssessmentSession.belongsTo(AssessmentDefinition, { foreignKey: "assessment_definition_id" });
AssessmentSession.belongsTo(FlagRuleVersion, { foreignKey: "flag_rule_version_id", as: "flagRuleVersion" });
AssessmentSession.hasMany(AssessmentAnswer, { foreignKey: "session_id" });
AssessmentSession.hasOne(AssessmentSnapshot, { foreignKey: "session_id" });
AssessmentSession.hasMany(AssessmentFlag, { foreignKey: "session_id" });
AssessmentAnswer.belongsTo(AssessmentSession, { foreignKey: "session_id" });
AssessmentSnapshot.belongsTo(AssessmentSession, { foreignKey: "session_id" });

// ---- Flags ----
FlagRule.hasMany(FlagRuleVersion, { foreignKey: "flag_rule_id" });
FlagRuleVersion.belongsTo(FlagRule, { foreignKey: "flag_rule_id" });
AssessmentFlag.belongsTo(AssessmentSession, { foreignKey: "session_id" });
AssessmentFlag.belongsTo(FlagRule, { foreignKey: "flag_rule_id" });
AssessmentFlag.belongsTo(FlagRuleVersion, { foreignKey: "flag_rule_version_id" });
AssessmentFlag.belongsTo(Doctor, { foreignKey: "reviewed_by", as: "reviewer" });

// ---- Doctor review ----
Doctor.hasMany(DoctorReview, { foreignKey: "doctor_id", as: "reviews" });
AssessmentSession.hasMany(DoctorReview, { foreignKey: "assessment_session_id" });
Patient.hasMany(DoctorReview, { foreignKey: "patient_id" });
DoctorReview.belongsTo(Doctor, { foreignKey: "doctor_id", as: "assignedDoctor" });
DoctorReview.belongsTo(AssessmentSession, { foreignKey: "assessment_session_id" });
DoctorReview.belongsTo(Patient, { foreignKey: "patient_id" });
DoctorReview.hasMany(DoctorReviewEvent, { foreignKey: "review_id" });
DoctorReviewEvent.belongsTo(DoctorReview, { foreignKey: "review_id" });
DoctorReview.hasMany(DoctorReviewNote, { foreignKey: "review_id", as: "reviewNotes" });
DoctorReviewNote.belongsTo(DoctorReview, { foreignKey: "review_id" });
DoctorReviewNote.belongsTo(DoctorReviewNote, { foreignKey: "parent_note_id", as: "parentNote" });
DoctorReviewNote.hasMany(DoctorReviewNote, { foreignKey: "parent_note_id", as: "corrections" });

// ---- Patient confirmed profile / history ----
const CLINICAL_ROWS = [
  { model: PatientCondition, fk: "condition_code", ref: ConditionCode, as: "condition" },
  { model: PatientAllergy, fk: "reaction_code", ref: ReactionCode, as: "reaction" },
  { model: PatientMedication, fk: null, ref: null, as: null },
  { model: PatientMeasurement, fk: null, ref: null, as: null },
  { model: PatientLabValue, fk: null, ref: null, as: null },
  { model: PatientPregnancyRecord, fk: null, ref: null, as: null },
  { model: PatientGoalHistory, fk: "goal_code", ref: GoalCode, as: "goal" },
];
for (const { model, fk, ref, as } of CLINICAL_ROWS) {
  Patient.hasMany(model, { foreignKey: "patient_id" });
  model.belongsTo(Patient, { foreignKey: "patient_id" });
  model.belongsTo(Doctor, { foreignKey: "confirmed_by", as: "confirmedBy" });
  model.belongsTo(AssessmentSession, { foreignKey: "source_session_id", as: "sourceSession" });
  if (fk && ref) model.belongsTo(ref, { foreignKey: fk, targetKey: "code", as });
}
PatientAllergy.belongsTo(SeverityCode, { foreignKey: "severity_code", targetKey: "code", as: "severity" });

// ---- Services / content / clinic ----
ServiceCategory.hasMany(ServiceCategoryTranslation, { foreignKey: "service_category_id", as: "translations" });
ServiceCategoryTranslation.belongsTo(ServiceCategory, { foreignKey: "service_category_id" });
ServiceCategory.hasMany(Service, { foreignKey: "service_category_id", as: "services" });
Service.belongsTo(ServiceCategory, { foreignKey: "service_category_id", as: "category" });
Service.hasMany(ServiceTranslation, { foreignKey: "service_id", as: "translations" });
ServiceTranslation.belongsTo(Service, { foreignKey: "service_id" });

ContentCategory.hasMany(ContentCategoryTranslation, { foreignKey: "content_category_id", as: "translations" });
ContentCategoryTranslation.belongsTo(ContentCategory, { foreignKey: "content_category_id" });
ContentCategory.hasMany(Content, { foreignKey: "content_category_id" });
Content.belongsTo(ContentCategory, { foreignKey: "content_category_id" });
Content.hasMany(ContentTranslation, { foreignKey: "content_id", as: "translations" });
ContentTranslation.belongsTo(Content, { foreignKey: "content_id" });

ClinicInfo.hasMany(WorkingHour, { foreignKey: "clinic_info_id" });
WorkingHour.belongsTo(ClinicInfo, { foreignKey: "clinic_info_id" });

// ---- Appointments ----
Appointment.belongsTo(Patient, { foreignKey: "patient_id" });
Appointment.belongsTo(Doctor, { foreignKey: "doctor_id" });
Appointment.belongsTo(Service, { foreignKey: "service_id" });
Doctor.hasMany(Appointment, { foreignKey: "doctor_id" });
Patient.hasMany(Appointment, { foreignKey: "patient_id" });

AppointmentSlot.belongsTo(Doctor, { foreignKey: "doctor_id" });
AppointmentSlot.belongsTo(Appointment, { foreignKey: "appointment_id" });
Doctor.hasMany(AppointmentSlot, { foreignKey: "doctor_id" });
Appointment.hasOne(AppointmentSlot, { foreignKey: "appointment_id" });

// ---- Live sessions / video / notes ----
LiveSession.belongsTo(Appointment, { foreignKey: "appointment_id" });
LiveSession.belongsTo(Patient, { foreignKey: "patient_id" });
LiveSession.belongsTo(Doctor, { foreignKey: "doctor_id" });
Appointment.hasMany(LiveSession, { foreignKey: "appointment_id" });

VideoMeetingProvider.hasMany(VideoMeeting, { foreignKey: "provider_id" });
VideoMeeting.belongsTo(VideoMeetingProvider, { foreignKey: "provider_id" });
VideoMeeting.belongsTo(LiveSession, { foreignKey: "live_session_id" });
LiveSession.hasMany(VideoMeeting, { foreignKey: "live_session_id" });

SessionNote.belongsTo(Patient, { foreignKey: "patient_id" });
SessionNote.belongsTo(Doctor, { foreignKey: "doctor_id" });
SessionNote.belongsTo(Appointment, { foreignKey: "appointment_id" });
SessionNote.belongsTo(LiveSession, { foreignKey: "live_session_id" });
SessionNote.belongsTo(SessionNote, { foreignKey: "parent_note_id", as: "correctedBy" });
SessionNote.hasMany(SessionNote, { foreignKey: "parent_note_id", as: "corrections" });
SessionNoteClarification.belongsTo(SessionNote, { foreignKey: "note_id", as: "note" });
SessionNoteClarification.belongsTo(SessionNote, { foreignKey: "original_note_id", as: "originalNote" });

// ---- Nutrition ----
NutritionPlan.belongsTo(Patient, { foreignKey: "patient_id" });
NutritionPlan.belongsTo(Doctor, { foreignKey: "doctor_id" });
NutritionPlan.belongsTo(DoctorReview, { foreignKey: "doctor_review_id" });
NutritionPlan.belongsTo(GoalCode, { foreignKey: "primary_goal_code", targetKey: "code", as: "primaryGoal" });
NutritionPlan.hasMany(NutritionPlanVersion, { foreignKey: "plan_id" });
NutritionPlan.hasMany(NutritionPlanNote, { foreignKey: "plan_id" });
NutritionPlanVersion.belongsTo(NutritionPlan, { foreignKey: "plan_id" });
NutritionPlanVersion.belongsTo(DoctorReview, { foreignKey: "source_review_id", as: "sourceReview" });
NutritionPlanVersion.belongsTo(AssessmentSession, { foreignKey: "source_session_id", as: "sourceSession" });
NutritionPlanVersion.belongsTo(Doctor, { foreignKey: "reviewer_id", as: "reviewer" });
NutritionPlanNote.belongsTo(NutritionPlan, { foreignKey: "plan_id" });

MealTemplate.belongsTo(NutritionPlanVersion, { foreignKey: "plan_version_id" });
NutritionPlanVersion.hasMany(MealTemplate, { foreignKey: "plan_version_id" });
MealTemplate.hasMany(MealItem, { foreignKey: "meal_template_id" });
MealItem.belongsTo(MealTemplate, { foreignKey: "meal_template_id" });
MealItem.belongsTo(FoodItem, { foreignKey: "food_item_id" });
FoodItem.hasMany(MealItem, { foreignKey: "food_item_id" });
FoodSubstitution.belongsTo(FoodItem, { foreignKey: "source_food_item_id", as: "sourceFoodItem" });
FoodSubstitution.belongsTo(FoodItem, { foreignKey: "substitute_food_item_id", as: "substituteFoodItem" });

// ---- Exercise ----
ExercisePlan.belongsTo(Patient, { foreignKey: "patient_id" });
ExercisePlan.belongsTo(Doctor, { foreignKey: "doctor_id" });
ExercisePlan.belongsTo(DoctorReview, { foreignKey: "doctor_review_id" });
ExercisePlan.belongsTo(GoalCode, { foreignKey: "primary_goal_code", targetKey: "code", as: "primaryGoal" });
ExercisePlan.hasMany(ExercisePlanVersion, { foreignKey: "plan_id" });
ExercisePlan.hasMany(ExercisePlanNote, { foreignKey: "plan_id" });
ExercisePlanVersion.belongsTo(ExercisePlan, { foreignKey: "plan_id" });
ExercisePlanVersion.belongsTo(DoctorReview, { foreignKey: "source_review_id", as: "sourceReview" });
ExercisePlanVersion.belongsTo(AssessmentSession, { foreignKey: "source_session_id", as: "sourceSession" });
ExercisePlanVersion.belongsTo(Doctor, { foreignKey: "reviewer_id", as: "reviewer" });
ExercisePlanNote.belongsTo(ExercisePlan, { foreignKey: "plan_id" });
ExerciseSubstitution.belongsTo(ExerciseItem, { foreignKey: "source_item_id", as: "sourceItem" });
ExerciseSubstitution.belongsTo(ExerciseItem, { foreignKey: "substitute_item_id", as: "substituteItem" });

// ---- Check-ins ----
PatientCheckin.belongsTo(Patient, { foreignKey: "patient_id" });
PatientCheckin.belongsTo(Doctor, { foreignKey: "reviewed_by", as: "reviewer" });
PatientCheckin.belongsTo(AssessmentSession, { foreignKey: "context_assessment_session_id", as: "contextAssessment" });
PatientCheckin.belongsTo(NutritionPlanVersion, { foreignKey: "context_nutrition_plan_version_id", as: "contextNutritionPlanVersion" });
PatientCheckin.belongsTo(ExercisePlanVersion, { foreignKey: "context_exercise_plan_version_id", as: "contextExercisePlanVersion" });
Patient.hasMany(PatientCheckin, { foreignKey: "patient_id" });
PatientCheckin.hasMany(PatientCheckinMeasurement, { foreignKey: "checkin_id" });
PatientCheckin.hasMany(PatientCheckinAdherence, { foreignKey: "checkin_id" });
PatientCheckinMeasurement.belongsTo(PatientCheckin, { foreignKey: "checkin_id" });
PatientCheckinAdherence.belongsTo(PatientCheckin, { foreignKey: "checkin_id" });

// ---- Care program / daily care (Phase 6B) ----
Patient.hasMany(CareProgram, { foreignKey: "patient_id" });
CareProgram.belongsTo(Patient, { foreignKey: "patient_id" });
Doctor.hasMany(CareProgram, { foreignKey: "doctor_id" });
CareProgram.belongsTo(Doctor, { foreignKey: "doctor_id" });
CareProgram.belongsTo(Package, { foreignKey: "package_id" });
CareProgram.belongsTo(Subscription, { foreignKey: "subscription_id" });
CareProgram.belongsTo(NutritionPlanVersion, { foreignKey: "nutrition_plan_version_id", as: "nutritionPlanVersion" });
CareProgram.belongsTo(ExercisePlanVersion, { foreignKey: "exercise_plan_version_id", as: "exercisePlanVersion" });
CareProgram.hasMany(CareProgramVersion, { foreignKey: "care_program_id" });
CareProgram.hasMany(CareDay, { foreignKey: "care_program_id" });

CareProgramVersion.belongsTo(CareProgram, { foreignKey: "care_program_id" });
CareProgramVersion.belongsTo(CareProgramVersion, { foreignKey: "previous_version_id", as: "previousVersion" });
CareProgramVersion.belongsTo(NutritionPlanVersion, { foreignKey: "nutrition_plan_version_id", as: "nutritionPlanVersion" });
CareProgramVersion.belongsTo(ExercisePlanVersion, { foreignKey: "exercise_plan_version_id", as: "exercisePlanVersion" });
CareProgramVersion.hasMany(CareActivityDefinition, { foreignKey: "care_program_version_id" });

CareDay.belongsTo(CareProgram, { foreignKey: "care_program_id" });
CareDay.belongsTo(CareProgramVersion, { foreignKey: "care_program_version_id" });
CareDay.hasMany(CareActivityInstance, { foreignKey: "care_day_id" });

CareActivityDefinition.belongsTo(CareProgramVersion, { foreignKey: "care_program_version_id" });
CareActivityDefinition.hasMany(CareActivityInstance, { foreignKey: "care_activity_definition_id" });

CareActivityInstance.belongsTo(CareDay, { foreignKey: "care_day_id" });
CareActivityInstance.belongsTo(CareActivityDefinition, { foreignKey: "care_activity_definition_id" });
CareActivityInstance.hasMany(CareActivityExecution, { foreignKey: "activity_instance_id" });

CareActivityExecution.belongsTo(CareActivityInstance, { foreignKey: "activity_instance_id" });
CareActivityExecution.belongsTo(CareDay, { foreignKey: "care_day_id" });
CareActivityExecution.belongsTo(Patient, { foreignKey: "patient_id" });
CareActivityExecution.belongsTo(CareActivityExecution, { foreignKey: "correction_of_id", as: "correctedBy" });

CareDailyCheckin.belongsTo(CareProgram, { foreignKey: "care_program_id" });
CareDailyCheckin.belongsTo(CareDay, { foreignKey: "care_day_id" });
CareDailyCheckin.belongsTo(Patient, { foreignKey: "patient_id" });

CarePoints.belongsTo(CareProgram, { foreignKey: "care_program_id" });
CarePoints.belongsTo(CareDay, { foreignKey: "care_day_id" });
CarePoints.belongsTo(CareActivityInstance, { foreignKey: "activity_instance_id" });
CarePoints.belongsTo(Patient, { foreignKey: "patient_id" });
CareReward.belongsTo(CareProgram, { foreignKey: "care_program_id" });
CareReward.belongsTo(Patient, { foreignKey: "patient_id" });
CareReward.belongsTo(Product, { foreignKey: "product_id" });

// ---- Progress & measurements (Phase 6C) ----
Patient.hasOne(PatientProgress, { foreignKey: "patient_id" });
PatientProgress.belongsTo(Patient, { foreignKey: "patient_id" });

Patient.hasMany(ProgressMeasurement, { foreignKey: "patient_id" });
ProgressMeasurement.belongsTo(Patient, { foreignKey: "patient_id" });
ProgressMeasurement.belongsTo(CareProgram, { foreignKey: "care_program_id", as: "careProgram" });
ProgressMeasurement.belongsTo(PatientCheckin, { foreignKey: "checkin_id", as: "checkin" });
ProgressMeasurement.belongsTo(Appointment, { foreignKey: "appointment_id", as: "appointment" });
ProgressMeasurement.belongsTo(ProgressMeasurement, { foreignKey: "correction_of_id", as: "correctedBy" });

Patient.hasMany(PatientProgressGoal, { foreignKey: "patient_id" });
PatientProgressGoal.belongsTo(Patient, { foreignKey: "patient_id" });
PatientProgressGoal.belongsTo(Doctor, { foreignKey: "doctor_id", as: "doctor" });
PatientProgressGoal.hasMany(PatientProgressGoalVersion, { foreignKey: "goal_id" });
PatientProgressGoalVersion.belongsTo(PatientProgressGoal, { foreignKey: "goal_id" });
PatientProgressGoalVersion.belongsTo(PatientProgressGoalVersion, { foreignKey: "previous_version_id", as: "previousVersion" });

// ---- Reference code catalogs (read-only label tables) ----
ConditionCode.hasMany(PatientCondition, { foreignKey: "condition_code", sourceKey: "code" });
ReactionCode.hasMany(PatientAllergy, { foreignKey: "reaction_code", sourceKey: "code" });
SeverityCode.hasMany(PatientAllergy, { foreignKey: "severity_code", sourceKey: "code" });
GoalCode.hasMany(PatientGoalHistory, { foreignKey: "goal_code", sourceKey: "code" });
RelationshipCode.hasMany(PatientContact, { foreignKey: "relationship_code", sourceKey: "code" });

// ---- Authentication / authorization ----
AuthUser.hasMany(AuthUserTenant, { foreignKey: "user_id" });
AuthUserTenant.belongsTo(AuthUser, { foreignKey: "user_id" });
AuthUserTenant.belongsTo(Tenant, { foreignKey: "tenant_id" });
AuthUser.belongsTo(Doctor, { foreignKey: "doctor_id", as: "doctorProfile" });
AuthUser.belongsTo(Patient, { foreignKey: "patient_id", as: "patientProfile" });
AuthUser.hasMany(AuthRefreshToken, { foreignKey: "user_id" });
AuthRefreshToken.belongsTo(AuthUser, { foreignKey: "user_id" });
AuthRefreshToken.belongsTo(Tenant, { foreignKey: "tenant_id" });
AuthUser.hasMany(AuthPasswordReset, { foreignKey: "user_id" });
AuthPasswordReset.belongsTo(AuthUser, { foreignKey: "user_id" });

Package.hasMany(PackageEntitlement, { foreignKey: "package_id" }); PackageEntitlement.belongsTo(Package, { foreignKey: "package_id" });
Package.hasMany(Subscription, { foreignKey: "package_id" }); Subscription.belongsTo(Package, { foreignKey: "package_id" });
Patient.hasMany(Subscription, { foreignKey: "patient_id" }); Subscription.belongsTo(Patient, { foreignKey: "patient_id" });
Subscription.hasMany(SubscriptionEntitlement, { foreignKey: "subscription_id" }); SubscriptionEntitlement.belongsTo(Subscription, { foreignKey: "subscription_id" });
Subscription.hasMany(Payment, { foreignKey: "subscription_id" }); Payment.belongsTo(Subscription, { foreignKey: "subscription_id" });
Patient.hasMany(Payment, { foreignKey: "patient_id" }); Payment.belongsTo(Patient, { foreignKey: "patient_id" }); Package.hasMany(Payment, { foreignKey: "package_id" }); Payment.belongsTo(Package, { foreignKey: "package_id" });
Payment.hasMany(PaymentReceipt, { foreignKey: "payment_id" }); PaymentReceipt.belongsTo(Payment, { foreignKey: "payment_id" }); Payment.hasMany(PaymentReview, { foreignKey: "payment_id" }); PaymentReview.belongsTo(Payment, { foreignKey: "payment_id" });

// Audit has no associations (generic, §23).

// ---- Store / e-commerce (Phase 7) ----
ProductCategory.hasMany(Product, { foreignKey: "category_id", as: "products" });
Product.belongsTo(ProductCategory, { foreignKey: "category_id", as: "category" });
StoreOrder.hasMany(StoreOrderItem, { foreignKey: "order_id", as: "items" });
StoreOrderItem.belongsTo(StoreOrder, { foreignKey: "order_id" });
StoreOrder.hasMany(StorePayment, { foreignKey: "order_id", as: "payments" });
StorePayment.belongsTo(StoreOrder, { foreignKey: "order_id" });
Product.hasMany(StoreOrderItem, { foreignKey: "product_id", as: "orderItems" });
StoreOrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// Reviews (purchase-verified, buyers only)
Product.hasMany(ProductReview, { foreignKey: "product_id", as: "reviews" });
ProductReview.belongsTo(Product, { foreignKey: "product_id" });
ProductReview.belongsTo(StoreOrder, { foreignKey: "order_id", as: "order" });
ProductReview.belongsTo(Patient, { foreignKey: "patient_id", as: "author" });
StoreOrder.hasMany(ProductReview, { foreignKey: "order_id", as: "reviews" });

import { GROUP_21 } from "./21_plan_templates.js";
import { GROUP_22 } from "./22_messaging.js";

const { ChatSession, ChatMessage } = GROUP_22;

// ---- Chat (tenant-scoped) ----
ChatSession.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });
Tenant.hasMany(ChatSession, { foreignKey: "tenant_id" });
ChatMessage.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });
Tenant.hasMany(ChatMessage, { foreignKey: "tenant_id" });

// ---- Chat associations ----
Patient.hasOne(ChatSession, { foreignKey: "patient_id", as: "chatSession" });
ChatSession.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });
ChatSession.hasMany(ChatMessage, { foreignKey: "session_id", as: "messages" });
ChatMessage.belongsTo(ChatSession, { foreignKey: "session_id", as: "session" });

// ---- Testimonial association ----
Testimonial.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });
Patient.hasMany(Testimonial, { foreignKey: "patient_id", as: "testimonials" });

export const models = {
  ...sequelize.models,
  ...GROUP_01,
  ...GROUP_02,
  ...GROUP_03,
  ...GROUP_04,
  ...GROUP_05,
  ...GROUP_06,
  ...GROUP_07,
  ...GROUP_08,
  ...GROUP_09,
  ...GROUP_10,
  ...GROUP_11,
  ...GROUP_12,
  ...GROUP_13,
  ...GROUP_14,
  ...GROUP_15,
  ...GROUP_16,
  ...GROUP_17,
  ...GROUP_18,
  ...GROUP_19,
  ...GROUP_20,
  ...GROUP_21,
  ...GROUP_22,
};

export { sequelize };
export const MODEL_GROUPS = {
  GROUP_01, GROUP_02, GROUP_03, GROUP_04, GROUP_05, GROUP_06,
  GROUP_07, GROUP_08, GROUP_09, GROUP_10, GROUP_11, GROUP_12, GROUP_13,
  GROUP_14, GROUP_15, GROUP_16, GROUP_17, GROUP_18, GROUP_19,
  GROUP_20, GROUP_21, GROUP_22,
};

export default models;
