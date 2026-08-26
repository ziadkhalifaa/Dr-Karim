import { DataTypes, Sequelize } from "sequelize";

const now = () => new Date();
const IMG = (keywords, lock) => `https://loremflickr.com/600/600/${keywords}?lock=${lock}`;

export async function up(queryInterface) {
  try {
    const sequelize = queryInterface.sequelize;
    const tenantId = 1; // store resolves to tenant_id 1 by default

    const [existing] = await sequelize.query(
      "SELECT COUNT(*) AS c FROM product WHERE tenant_id = ?",
      { replacements: [tenantId] }
    );
    if (Number(existing[0]?.c) > 0) return; // already seeded

  const cats = [
    { name: "مكملات غذائية", slug: "supplements", description: "بروتين ومكملات لدعم اللياقة", active: 1, sortOrder: 1 },
    { name: "فيتامينات", slug: "vitamins", description: "فيتامينات ومعادن أساسية", active: 1, sortOrder: 2 },
    { name: "منتجات التخسيس", slug: "weight-loss", description: "دعم إنقاص الوزن والحرق", active: 1, sortOrder: 3 },
    { name: "العناية", slug: "skincare", description: "كولاجين ومنتجات العناية", active: 1, sortOrder: 4 },
  ];
  const [catExisting] = await sequelize.query(
    "SELECT id, slug FROM product_category WHERE tenant_id = ?",
    { replacements: [tenantId] }
  );
  if (catExisting.length === 0) {
    await queryInterface.bulkInsert(
      "product_category",
      cats.map((c) => ({
        tenant_id: tenantId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        active: c.active,
        sort_order: c.sortOrder,
        created_at: now(),
        updated_at: now(),
      }))
    );
  }
  const [catRows] = await sequelize.query(
    "SELECT id, slug FROM product_category WHERE tenant_id = ?",
    { replacements: [tenantId] }
  );
  const catId = (slug) => catRows.find((c) => c.slug === slug)?.id;

  const products = [
    { categorySlug: "supplements", name: "بروتين واي isolate عالي الجودة", slug: "whey-isolate-protein", shortDescription: "بروتين إيسوليت سريع الامتصاص لبناء العضلات", price: 450, compareAt: 600, desc: "بروتين واي إيسوليت نقي 25g بروتين لكل مغرفة، خالٍ من السكر المضاف، مثالي بعد التمرين أو كوجبة داعمة لبناء العضلات والحفاظ على الكتلة العضلية أثناء التخسيس.", weight: 500, img: "protein,supplement", lock: 11, featured: 1 },
    { categorySlug: "vitamins", name: "كبسولات أوميغا 3 للقلب", slug: "omega-3-capsules", shortDescription: "أوميغا 3 لصحة القلب والدماغ", price: 220, compareAt: null, desc: "زيت سمك نقي غني بـ EPA و DHA لدعم صحة القلب والشرايين والوظائف الذهنية، خالٍ من الروائح الكريهة.", weight: 60, img: "fishoil,supplement", lock: 12, featured: 0 },
    { categorySlug: "vitamins", name: "فيتامين د3 5000 وحدة", slug: "vitamin-d3-5000", shortDescription: "دعم المناعة والعظام", price: 130, compareAt: null, desc: "فيتامين د3 لتعزيز امتصاص الكالسيوم ودعم المناعة والعظام، خاصة في الأيام الأقل تعرضاً للشمس.", weight: 60, img: "vitamin,pills", lock: 13, featured: 0 },
    { categorySlug: "weight-loss", name: "شاي أخضر للتخسيس", slug: "green-tea-slim", shortDescription: "شاي أخضر طبيعي لحرق الدهون", price: 90, compareAt: 120, desc: "خلطة شاي أخضر غنية بمضادات الأكسدة تدعم عملية الأيض وتساعد على تحسين حرق الدهون مع نظام غذائي متوازن.", weight: 100, img: "greentea,tea", lock: 14, featured: 1 },
    { categorySlug: "weight-loss", name: "كارنيتين L حرق دهون", slug: "l-carnitine-fatburn", shortDescription: "كارنيتين سائل لحرق الدهون", price: 180, compareAt: null, desc: "كارنيتين يساعد على نقل الأحماض الدهنية إلى الميتوكوندريا لإنتاج الطاقة وحرق الدهون أثناء التمرين.", weight: 250, img: "fitness,supplement", lock: 15, featured: 0 },
    { categorySlug: "skincare", name: "كولاجين ببروتين البحر", slug: "marine-collagen", shortDescription: "كولاجين لشباب البشرة", price: 350, compareAt: 420, desc: "كولاجين بحري مع فيتامين سي لدعم مرونة البشرة وتقليل التجاعيد من الداخل لنتائج تظهر مع الاستمرار.", weight: 200, img: "cosmetic,cream", lock: 16, featured: 1 },
    { categorySlug: "supplements", name: "ألياف غذائية داعمة", slug: "dietary-fiber", shortDescription: "ألياف لتحسين الهضم", price: 160, compareAt: null, desc: "مكمل ألياف طبيعي يحسن حركة الأمعاء والشبع ويدعم صحة الجهاز الهضمي أثناء الحمية.", weight: 250, img: "fiber,food", lock: 17, featured: 0 },
    { categorySlug: "vitamins", name: "مغنيسيوم معدني", slug: "mineral-magnesium", shortDescription: "مغنيسيوم لاسترخاء العضلات", price: 110, compareAt: null, desc: "مغنيسيوم يدعم استرخاء العضلات ونوماً أفضل ويقلل التشنجات، مثالي لممارسي الرياضة.", weight: 60, img: "magnesium,pills", lock: 18, featured: 0 },
  ];

  const prodRows = products.map((p) => ({
    tenant_id: tenantId,
    category_id: catId(p.categorySlug),
    name: p.name,
    slug: p.slug,
    short_description: p.shortDescription,
    description: p.desc,
    price: p.price,
    compare_at_price: p.compareAt,
    currency: "EGP",
    stock_quantity: 100,
    sku: `SKU-${p.lock}`,
    status: "active",
    featured: p.featured,
    images_json: JSON.stringify([IMG(p.img, p.lock)]),
    weight_grams: p.weight,
    sort_order: p.lock,
    created_at: now(),
    updated_at: now(),
  }));
  await queryInterface.bulkInsert("product", prodRows);
  } catch (err) {
    console.error("[seed] demo store seeding (038) skipped:", err?.message || err);
  }
}

export async function down(queryInterface) {
  const sequelize = queryInterface.sequelize;
  const tenantId = 1;
  await sequelize.query("DELETE FROM product WHERE tenant_id = ?", { replacements: [tenantId] });
}
