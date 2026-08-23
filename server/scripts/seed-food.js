import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sequelize } from "../src/config/database.js";
import { models } from "../src/models/index.js";

const { FoodItem } = models;

export async function runFoodSeed() {
  await sequelize.authenticate();
  await FoodItem.sync({ alter: true });

  const data = JSON.parse(fs.readFileSync(path.resolve("./scripts/food_seed.json"), "utf8"));

  const BATCH_SIZE = 50;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const rows = batch.map((item) => ({
      code: item.code,
      name_ar: item.name_ar,
      name_en: item.name_en,
      category_code: item.category_code,
      unit: item.unit,
      macros_json: item.macros,
      active: true,
    }));
    await FoodItem.bulkCreate(rows, {
      updateOnDuplicate: ["name_ar", "name_en", "macros_json", "category_code", "unit"],
    });
  }

  console.log(`Food seed complete (${data.length} items).`);
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  runFoodSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding food:", error);
      process.exit(1);
    });
}
