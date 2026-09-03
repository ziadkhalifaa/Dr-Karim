import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";

const { Notification, NotificationPreference, AuthUser, AuthUserTenant } = models;

const CATALOG = {
  assessment_submitted: ["تم تسليم تقييم جديد 📝", "تم استلام تقييم طبي جديد من مريض وهو قيد المراجعة."],
  review_queued: ["تقييم في قائمة الانتظار ⏳", "التقييم الطبي في انتظار المراجعة."],
  review_approved: ["تم اعتماد التقييم الطبي 🩺", "تمت مراجعة التقييم الطبي الخاص بك وجاري إعداد الخطة."],
  review_rejected: ["متابعة التقييم الطبي ⚠️", "يرجى الاطلاع على ملحوظات الدكتور حول التقييم."],
  review_needs_clarification: ["طلب توضيح ❓", "يرجى توضيح بعض البيانات للدكتور."],
  payment_submitted: ["تم إرسال عملية الدفع 💳", "تم استلام إثبات الدفع وهو قيد المراجعة والاعتماد."],
  payment_approved: ["تم تفعيل الاشتراك بنجاح 🎉", "مبروك! تم اعتماد الدفع وتفعيل باقتك والخدمات المتاحة لك."],
  payment_rejected: ["تنبيه بشأن عملية الدفع ⚠️", "تعذر اعتماد عملية الدفع. يرجى مراجعة سبب الرفض وإعادة الإرسال."],
  appointment_confirmed: ["تم تأكيد الموعد 📅", "تم تأكيد موعدك بنجاح."],
  appointment_cancelled: ["تم إلغاء الموعد ❌", "تم إلغاء الجلسة/الموعد."],
  appointment_completed: ["تم إكمال الموعد ✅", "شكراً لك، تم إكمال الجلسة بنجاح."],
  appointment_booked: ["حجز موعد جديد 🔔", "قام مريض بحجز موعد جديد في العيادة."],
  nutrition_plan_activated: ["تم تفعيل النظام الغذائي 🥗", "قام فريق الدكتور كريم بتفعيل نظامك الغذائي الجديد."],
  exercise_plan_activated: ["تم تفعيل خطة التمارين 🏋️", "تم تفعيل خطة التمارين الرياضية الخاصة بك."],
  care_program_activated: ["تم تفعيل برنامج الرعاية 📋", "تم تفعيل برنامج متابعتك اليومي."],
  plan_version_updated: ["تحديث الخطة 🔄", "تم تحديث نسخة خطتك الغذائية أو الرياضية."],
  care_progress_recorded: ["تسجيل متابعة يومية 🌟", "تم تسجيل التزامك اليومي بنجاح."],
  progress_measurement_recorded: ["تسجيل وزن/قياس جديد ⚖️", "تم تسجيل القياس الجديد في حسابك."],
  live_session_ready: ["جلسة البث المباشر جاهزة 🎥", "يمكنك الآن الانضمام للجلسة المباشرة مع الدكتور."],
  live_session_failed: ["تعذر تجهيز الجلسة المباشرة", "حدث تعذر مؤقت في تجهيز بث الجلسة."],
};

export const notificationService = {
  async emit({ tenantId, recipientUserId, recipientRole, type, relatedEntity, relatedRef, locale = "ar", transaction }) {
    try {
      const item = CATALOG[type];
      if (!item) {
        console.warn(`[notification] unknown type "${type}" — skipped`);
        return null;
      }
      const existing = await Notification.findOne({
        where: { tenant_id: tenantId, recipient_user_id: recipientUserId, type, related_ref: relatedRef || null },
        transaction,
      });
      if (existing) return existing.toJSON();

      const pref = await NotificationPreference.findOne({
        where: { tenant_id: tenantId, recipient_user_id: recipientUserId, notification_type: type, channel: "in_app" },
        transaction,
      });
      if (pref?.enabled === false) return null;

      return (
        await Notification.create(
          {
            tenant_id: tenantId,
            recipient_user_id: recipientUserId,
            recipient_role: recipientRole,
            type,
            title: item[0],
            message: item[1],
            locale,
            related_entity: relatedEntity || null,
            related_ref: relatedRef || null,
          },
          { transaction }
        )
      ).toJSON();
    } catch (err) {
      console.warn(`[notification] emit failed for type "${type}":`, err?.message);
      return null;
    }
  },

  async list({ tenantId, auth, unreadOnly = false }) {
    if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
    return Notification.findAll({
      where: {
        tenant_id: tenantId,
        recipient_user_id: auth.user.id,
        ...(unreadOnly ? { read_at: null } : {}),
      },
      order: [["created_at", "DESC"]],
      raw: true,
    });
  },

  async read({ tenantId, auth, id }) {
    const row = await Notification.findOne({ where: { id, tenant_id: tenantId, recipient_user_id: auth.user.id } });
    if (!row) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
    row.read_at = new Date();
    await row.save();
    return row.toJSON();
  },

  async readAll({ tenantId, auth }) {
    await Notification.update(
      { read_at: new Date() },
      { where: { tenant_id: tenantId, recipient_user_id: auth.user.id, read_at: null } }
    );
    return { markedRead: true };
  },

  async preferences({ tenantId, auth }) {
    return NotificationPreference.findAll({
      where: { tenant_id: tenantId, recipient_user_id: auth.user.id },
      raw: true,
    });
  },

  async setPreference({ tenantId, auth, body }) {
    const allowed = ["in_app", "email", "whatsapp", "sms"];
    if (!allowed.includes(body.channel))
      throw new AppError(422, "NOTIFICATION_CHANNEL_INVALID", "Unsupported notification channel");

    const [row] = await NotificationPreference.findOrCreate({
      where: {
        tenant_id: tenantId,
        recipient_user_id: auth.user.id,
        notification_type: body.notificationType,
        channel: body.channel,
      },
      defaults: { enabled: Boolean(body.enabled) },
    });

    if (row.enabled !== Boolean(body.enabled)) {
      row.enabled = Boolean(body.enabled);
      await row.save();
    }
    return row.toJSON();
  },

  async usersForRole({ tenantId, role }) {
    return AuthUser.findAll({
      include: [
        {
          model: AuthUserTenant,
          where: { tenant_id: tenantId, role, active: true },
          required: true,
        },
      ],
      where: { status: "enabled" },
      raw: true,
    });
  },

  async emitForPatient({ tenantId, patientId, type, relatedEntity, relatedRef, transaction }) {
    const user = await AuthUser.findOne({
      include: [
        {
          model: AuthUserTenant,
          where: { tenant_id: tenantId, role: "patient", active: true },
          required: true,
        },
      ],
      where: { patient_id: patientId, status: "enabled" },
      transaction,
      raw: true,
    });
    return user
      ? this.emit({ tenantId, recipientUserId: user.id, recipientRole: "patient", type, relatedEntity, relatedRef, transaction })
      : null;
  },

  async emitForDoctor({ tenantId, doctorId, type, relatedEntity, relatedRef, transaction }) {
    const user = await AuthUser.findOne({
      include: [
        {
          model: AuthUserTenant,
          where: { tenant_id: tenantId, role: "doctor", active: true },
          required: true,
        },
      ],
      where: { doctor_id: doctorId, status: "enabled" },
      transaction,
      raw: true,
    });
    return user
      ? this.emit({ tenantId, recipientUserId: user.id, recipientRole: "doctor", type, relatedEntity, relatedRef, transaction })
      : null;
  },
};
