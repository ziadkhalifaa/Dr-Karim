import { sequelize } from "../src/config/database.js";
import { models } from "../src/models/index.js";
import env from "../src/config/env.js";
import { logger } from "../src/utils/logger.js";

const { PlanTemplate, AuthUserTenant, FoodItem } = models;

const NUTRITION_TEMPLATES = [
  {
    domain: "nutrition",
    name: "نظام التنشيف السريع (1500 سعرة)",
    description: "نظام غذائي عالي البروتين ومنخفض الكارب، مصمم خصيصاً لحرق الدهون مع الحفاظ على الكتلة العضلية.",
    image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    content_json: {
      targets: { calories: 1500, protein: 140, carbs: 100, fats: 60 },
      rawMeals: [
        {
          dayId: 1,
          code: "breakfast",
          items: [
            { quantity: 4, unit: "حبة", foodItem: { nameAr: "بيض مسلوق كامل" } },
            { quantity: 50, unit: "g", foodItem: { nameAr: "شوفان" } }
          ]
        },
        {
          dayId: 1,
          code: "lunch",
          items: [
            { quantity: 150, unit: "g", foodItem: { nameAr: "صدر دجاج مشوي" } },
            { quantity: 100, unit: "g", foodItem: { nameAr: "أرز أبيض مطبوخ" } },
            { quantity: 1, unit: "طبق", foodItem: { nameAr: "سلطة خضراء" } }
          ]
        },
        {
          dayId: 1,
          code: "dinner",
          items: [
            { quantity: 150, unit: "g", foodItem: { nameAr: "سمك مشوي" } },
            { quantity: 1, unit: "طبق", foodItem: { nameAr: "خضار سوتيه" } }
          ]
        }
      ]
    }
  },
  {
    domain: "nutrition",
    name: "نظام الكيتو دايت (1800 سعرة)",
    description: "نظام منخفض الكربوهيدرات جداً وعالي الدهون لدفع الجسم لحرق الدهون المخزنة كطاقة رئيسية.",
    image_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=800&q=80",
    content_json: {
      targets: { calories: 1800, protein: 110, carbs: 30, fats: 140 },
      rawMeals: [
        { dayId: 1, code: "breakfast", items: [ { quantity: 3, unit: "حبة", foodItem: { nameAr: "بيض مقلي بالزبدة" } }, { quantity: 30, unit: "g", foodItem: { nameAr: "جبن شيدر" } } ] },
        { dayId: 1, code: "lunch", items: [ { quantity: 200, unit: "g", foodItem: { nameAr: "ستيك لحم بقري" } }, { quantity: 1, unit: "حبة", foodItem: { nameAr: "أفوكادو" } } ] },
      ]
    }
  },
  {
    domain: "nutrition",
    name: "نظام التضخيم العضلي (3000 سعرة)",
    description: "برنامج غذائي مخصص للزيادة العضلية النظيفة مع تزويد الجسم بكمية كافية من الكربوهيدرات للطاقة.",
    image_url: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&q=80",
    content_json: {
      targets: { calories: 3000, protein: 180, carbs: 350, fats: 95 },
      rawMeals: [
        { dayId: 1, code: "breakfast", items: [ { quantity: 100, unit: "g", foodItem: { nameAr: "شوفان" } }, { quantity: 2, unit: "كوب", foodItem: { nameAr: "حليب كامل الدسم" } }, { quantity: 2, unit: "حبة", foodItem: { nameAr: "موز" } } ] },
        { dayId: 1, code: "lunch", items: [ { quantity: 200, unit: "g", foodItem: { nameAr: "صدر دجاج" } }, { quantity: 250, unit: "g", foodItem: { nameAr: "مكرونة" } } ] },
      ]
    }
  },
  {
    domain: "nutrition",
    name: "النظام النباتي المتوازن (2000 سعرة)",
    description: "نظام غذائي متكامل خالي من المنتجات الحيوانية مع مصادر بروتين نباتية عالية الجودة.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    content_json: {
      targets: { calories: 2000, protein: 120, carbs: 240, fats: 60 },
      rawMeals: [
        { dayId: 1, code: "breakfast", items: [ { quantity: 1, unit: "كوب", foodItem: { nameAr: "حليب اللوز" } }, { quantity: 50, unit: "g", foodItem: { nameAr: "شوفان" } }, { quantity: 30, unit: "g", foodItem: { nameAr: "زبدة فول سوداني" } } ] },
        { dayId: 1, code: "lunch", items: [ { quantity: 150, unit: "g", foodItem: { nameAr: "توفو مشوي" } }, { quantity: 100, unit: "g", foodItem: { nameAr: "كينوا مطبوخة" } } ] },
      ]
    }
  },
  {
    domain: "nutrition",
    name: "نظام الصيام المتقطع (1600 سعرة)",
    description: "نظام غذائي مخصص لفترات الأكل في الصيام المتقطع لدعم نزول الوزن والنشاط المستمر.",
    image_url: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800&q=80",
    content_json: {
      targets: { calories: 1600, protein: 130, carbs: 120, fats: 65 },
      rawMeals: [
        { dayId: 1, code: "lunch", items: [ { quantity: 150, unit: "g", foodItem: { nameAr: "سلمون مشوي" } }, { quantity: 1, unit: "طبق", foodItem: { nameAr: "سلطة كينوا" } } ] },
        { dayId: 1, code: "dinner", items: [ { quantity: 150, unit: "g", foodItem: { nameAr: "صدر دجاج" } }, { quantity: 100, unit: "g", foodItem: { nameAr: "بطاطا حلوة" } } ] },
      ]
    }
  }
];

const EXERCISE_TEMPLATES = [
  {
    domain: "exercise",
    name: "🔥 برنامج التنشيف وحرق الدهون (HIIT)",
    description: "برنامج تدريبي يركز على الكارديو عالي الشدة مع بعض تمارين المقاومة.",
    image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
    content_json: {
      notes: "قم بأداء التمارين بأسلوب الدائرة (Circuit) مع راحة قليلة بين الجولات لزيادة الحرق.",
      exercises: [
        { id: "e1", dayId: 1, exercise: { name: "Jumping Jacks" }, sets: 4, reps: "60s", rest: "30s" },
        { id: "e2", dayId: 1, exercise: { name: "Burpees" }, sets: 4, reps: "15", rest: "30s" },
      ]
    }
  },
  {
    domain: "exercise",
    name: "💪 برنامج التضخيم للمبتدئين (Full Body)",
    description: "برنامج كلاسيكي للمبتدئين لبناء القوة والكتلة العضلية بتمرين الجسم كله 3 مرات أسبوعياً.",
    image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    content_json: {
      notes: "ركز على الأداء الصحيح في التمارين المركبة وزيادة الوزن تدريجياً.",
      exercises: [
        { id: "e1", dayId: 2, exercise: { name: "Barbell Squat" }, sets: 3, reps: "8-10", rest: "90s" },
        { id: "e2", dayId: 2, exercise: { name: "Dumbbell Bench Press" }, sets: 3, reps: "8-10", rest: "90s" },
        { id: "e3", dayId: 2, exercise: { name: "Lat Pulldown" }, sets: 3, reps: "10-12", rest: "60s" }
      ]
    }
  },
  {
    domain: "exercise",
    name: "🦍 برنامج Push/Pull/Legs للمتقدمين",
    description: "نظام تدريبي مكثف يقسم عضلات الجسم لزيادة الحجم العضلي وعزل العضلات بشكل مثالي.",
    image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    content_json: {
      notes: "برنامج مخصص لستة أيام في الأسبوع. (اليوم الأول: دفع، الثاني: سحب، الثالث: أرجل).",
      exercises: [
        { id: "e1", dayId: 1, exercise: { name: "Barbell Bench Press" }, sets: 4, reps: "6-8", rest: "120s" },
        { id: "e2", dayId: 1, exercise: { name: "Overhead Press" }, sets: 3, reps: "8-10", rest: "90s" },
      ]
    }
  },
  {
    domain: "exercise",
    name: "🏠 تمارين منزلية بدون معدات",
    description: "برنامج تدريبي متكامل يعتمد على وزن الجسم فقط ليناسب التدريب في المنزل.",
    image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    content_json: {
      notes: "احرص على أداء التمرين ببطء لزيادة الضغط على العضلة لتعويض نقص الأوزان.",
      exercises: [
        { id: "e1", dayId: 1, exercise: { name: "Push Ups" }, sets: 4, reps: "Max", rest: "60s" },
        { id: "e2", dayId: 1, exercise: { name: "Bodyweight Squats" }, sets: 4, reps: "20", rest: "60s" },
      ]
    }
  },
  {
    domain: "exercise",
    name: "🍑 برنامج شد الجزء السفلي (Glutes & Legs)",
    description: "برنامج مخصص لنحت وشد عضلات الأرجل والأرداف مع التركيز على التمارين المركبة السفلية.",
    image_url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
    content_json: {
      notes: "تفعيل عضلات الألوية قبل البدء بالتمرين مهم جداً.",
      exercises: [
        { id: "e1", dayId: 3, exercise: { name: "Barbell Hip Thrust" }, sets: 4, reps: "10-12", rest: "90s" },
        { id: "e2", dayId: 3, exercise: { name: "Romanian Deadlift" }, sets: 4, reps: "10-12", rest: "90s" },
      ]
    }
  }
];

async function seed() {
  logger.info("db templates seed starting", { step: "scripts/seed-templates.js" });
  await sequelize.authenticate();

  const membership = await AuthUserTenant.findOne({ where: { role: "doctor" }, raw: true });
  if (!membership) {
    logger.warn("No doctor found to attach templates to. Skipping.");
    return;
  }
  
  const tenantId = membership.tenant_id;
  // Get doctor id from user
  const user = await models.AuthUser.findByPk(membership.user_id, { raw: true });
  const doctorId = user.doctor_id;
  
  if (!doctorId) {
    logger.warn("User has no doctor_id. Skipping.");
    return;
  }

  // Pre-seed some food items if they don't exist
  const dummyFoods = [
    { name_ar: "بيض مسلوق كامل", name_en: "Boiled Egg", unit: "حبة", macros_json: { energy_kcal: 78, protein_g: 6, carb_g: 1, fat_g: 5 } },
    { name_ar: "شوفان", name_en: "Oats", unit: "g", macros_json: { energy_kcal: 389, protein_g: 16.9, carb_g: 66.3, fat_g: 6.9 } },
    { name_ar: "صدر دجاج مشوي", name_en: "Grilled Chicken Breast", unit: "g", macros_json: { energy_kcal: 165, protein_g: 31, carb_g: 0, fat_g: 3.6 } },
    { name_ar: "أرز أبيض مطبوخ", name_en: "Cooked White Rice", unit: "g", macros_json: { energy_kcal: 130, protein_g: 2.7, carb_g: 28, fat_g: 0.3 } }
  ];

  for (const f of dummyFoods) {
    const existing = await FoodItem.findOne({ where: { name_ar: f.name_ar } });
    if (!existing) {
      await FoodItem.create({ ...f, code: "food_" + Math.random().toString(36).substring(7) });
    }
  }

  // Re-map the nutrition rawMeals to point to real DB items if possible
  for (const tmpl of NUTRITION_TEMPLATES) {
    for (const meal of tmpl.content_json.rawMeals) {
      for (const item of meal.items) {
        const dbFood = await FoodItem.findOne({ where: { name_ar: item.foodItem.nameAr } });
        if (dbFood) {
          item.foodItemId = dbFood.id;
          item.foodItem.id = dbFood.id;
          item.foodItem.macros = dbFood.macros_json;
        }
      }
    }
  }

  const allTemplates = [...NUTRITION_TEMPLATES, ...EXERCISE_TEMPLATES];
  
  let inserted = 0;
  for (const tmpl of allTemplates) {
    const existing = await PlanTemplate.findOne({ where: { name: tmpl.name, doctor_id: doctorId } });
    if (!existing) {
      await PlanTemplate.create({
        tenant_id: tenantId,
        doctor_id: doctorId,
        domain: tmpl.domain,
        name: tmpl.name,
        description: tmpl.description,
        image_url: tmpl.image_url,
        content_json: tmpl.content_json,
      });
      inserted++;
    }
  }
  
  logger.info(`db templates seed done. Inserted ${inserted} new templates.`, { step: "scripts/seed-templates.js" });
  await sequelize.close();
}

seed().catch(err => {
  logger.error("db templates seed failed", { error: err.message });
  process.exit(1);
});
