export async function up(q) {
  const [rows] = await q.sequelize.query("SELECT id FROM tenant WHERE is_default = 1 LIMIT 1"); if (!rows[0]) return;
  await q.bulkInsert("platform_setting", [
    { key: "payment.vodafone_cash.enabled", value: "true", value_type: "boolean", description: "Enable Vodafone Cash manual payments" },
    { key: "payment.vodafone_cash.destination", value: "", value_type: "string", description: "Configured Vodafone Cash receiving number" },
    { key: "payment.instapay.enabled", value: "true", value_type: "boolean", description: "Enable InstaPay manual payments" },
    { key: "payment.instapay.destination", value: "", value_type: "string", description: "Configured InstaPay receiving identifier" },
    { key: "payment.instructions.ar", value: "حوّل المبلغ ثم أرسل صورة الإيصال ورقم العملية.", value_type: "string", description: "Arabic manual payment instructions" },
    { key: "payment.instructions.en", value: "Transfer the amount, then submit the receipt image and transaction reference.", value_type: "string", description: "English manual payment instructions" },
  ], {});
}
