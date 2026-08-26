// Demo store catalog seed (additive, idempotent by slug).
// Runs after migrations via src/db-bootstrap.js, where models are ready.
import { models } from "../src/models/index.js";

const IMG = (keywords, lock) => `https://loremflickr.com/600/600/${keywords}?lock=${lock}`;

const CATS = [
  { name: "مكملات غذائية", slug: "supplements", description: "بروتين ومكملات لدعم اللياقة", sortOrder: 1 },
  { name: "فيتامينات", slug: "vitamins", description: "فيتامينات ومعادن أساسية", sortOrder: 2 },
  { name: "منتجات التخسيس", slug: "weight-loss", description: "دعم إنقاص الوزن والحرق", sortOrder: 3 },
  { name: "العناية", slug: "skincare", description: "كولاجين ومنتجات العناية", sortOrder: 4 },
];

const PRODUCTS = [
  { categorySlug: "supplements", name: "بروتين واي isolate عالي الجودة", slug: "whey-isolate-protein", shortDescription: "بروتين إيسوليت سريع الامتصاص لبناء العضلات", price: 450, compareAt: 600, desc: "بروتين واي إيسوليت نقي 25g بروتين لكل مغرفة، خالٍ من السكر المضاف، مثالي بعد التمرين أو كوجبة داعمة لبناء العضلات والحفاظ على الكتلة العضلية أثناء التخسيس.", weight: 500, img: "protein,supplement", lock: 11, featured: 1 },
  { categorySlug: "vitamins", name: "كبسولات أوميغا 3 للقلب", slug: "omega-3-capsules", shortDescription: "أوميغا 3 لصحة القلب والدماغ", price: 220, compareAt: null, desc: "زيت سمك نقي غني بـ EPA و DHA لدعم صحة القلب والشرايين والوظائف الذهنية، خالٍ من الروائح الكريهة.", weight: 60, img: "fishoil,supplement", lock: 12, featured: 0 },
  { categorySlug: "vitamins", name: "فيتامين د3 5000 وحدة", slug: "vitamin-d3-5000", shortDescription: "دعم المناعة والعظام", price: 130, compareAt: null, desc: "فيتامين د3 لتعزيز امتصاص الكالسيوم ودعم المناعة والعظام، خاصة في الأيام الأقل تعرضاً للشمس.", weight: 60, img: "vitamin,pills", lock: 13, featured: 0 },
  { categorySlug: "weight-loss", name: "شاي أخضر للتخسيس", slug: "green-tea-slim", shortDescription: "شاي أخضر طبيعي لحرق الدهون", price: 90, compareAt: 120, desc: "خلطة شاي أخضر غنية بمضادات الأكسدة تدعم عملية الأيض وتساعد على تحسين حرق الدهون مع نظام غذائي متوازن.", weight: 100, img: "greentea,tea", lock: 14, featured: 1 },
  { categorySlug: "weight-loss", name: "كارنيتين L حرق دهون", slug: "l-carnitine-fatburn", shortDescription: "كارنيتين سائل لحرق الدهون", price: 180, compareAt: null, desc: "كارنيتين يساعد على نقل الأحماض الدهنية إلى الميتوكوندريا لإنتاج الطاقة وحرق الدهون أثناء التمرين.", weight: 250, img: "fitness,supplement", lock: 15, featured: 0 },
  { categorySlug: "skincare", name: "كولاجين ببروتين البحر", slug: "marine-collagen", shortDescription: "كولاجين لشباب البشرة", price: 350, compareAt: 420, desc: "كولاجين بحري مع فيتامين سي لدعم مرونة البشرة وتقليل التجاعيد من الداخل لنتائج تظهر مع الاستمرار.", weight: 200, img: "cosmetic,cream", lock: 16, featured: 1 },
  { categorySlug: "supplements", name: "ألياف غذائية داعمة", slug: "dietary-fiber", shortDescription: "ألياف لتحسين الهضم", price: 160, compareAt: null, desc: "مكمل ألياف طبيعي يحسن حركة الأمعاء والشبع ويدعم صحة الجهاز الهضمي أثناء الحمية.", weight: 250, img: "fiber,food", lock: 17, featured: 0 },
  { categorySlug: "vitamins", name: "مغنيسيوم معدني", slug: "mineral-magnesium", shortDescription: "مغنيسيوم لاسترخاء العضلات", price: 110, compareAt: null, desc: "مغنيسيوم يدعم استرخاء العضلات ونوماً أفضل ويقلل التشنجات، مثالي لممارسي الرياضة.", weight: 60, img: "magnesium,pills", lock: 18, featured: 0 },
];

export async function runStoreSeed() {
  const { Product, ProductCategory, Tenant } = models;
  const tenant = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  const tenantId = tenant?.id || 1;

  // clean up any leftover debug product from diagnosis (any tenant)
  await Product.destroy({ where: { slug: "debug-product-xyz" } });

  const catMap = {};
  for (const c of CATS) {
    const [row] = await ProductCategory.findOrCreate({
      where: { tenant_id: tenantId, slug: c.slug },
      defaults: { tenant_id: tenantId, name: c.name, slug: c.slug, description: c.description, active: true, sort_order: c.sortOrder },
    });
    catMap[c.slug] = row.id;
  }

  let created = 0;
  for (const p of PRODUCTS) {
    // remove any orphan (wrong-tenant) demo product with this slug, then create fresh
    await Product.destroy({ where: { slug: p.slug } });
    await Product.create({
      tenant_id: tenantId,
      category_id: catMap[p.categorySlug],
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
      featured: !!p.featured,
      images_json: [IMG(p.img, p.lock)],
      weight_grams: p.weight,
      sort_order: p.lock,
    });
    created += 1;
  }
  console.log(`store seed: ${created} products created (tenant_id=${tenantId}).`);
}
