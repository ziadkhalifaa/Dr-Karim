import fs from "fs";
import path from "path";
import { sequelize } from "../src/config/database.js";
import { models } from "../src/models/index.js";

const { FoodItem } = models;

async function seed() {
  try {
    console.log("Connecting to DB...");
    await sequelize.authenticate();
    
    // Check if food_item exists, if not sync it. (Usually sync is done in db-bootstrap but just in case)
    await FoodItem.sync({ alter: true });
    
    console.log("Reading food_seed.json...");
    const data = JSON.parse(fs.readFileSync(path.resolve("./scripts/food_seed.json"), "utf8"));
    
    console.log(`Found ${data.length} items to seed.`);
    
    const BATCH_SIZE = 50;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const rows = batch.map(item => ({
        code: item.code,
        name_ar: item.name_ar,
        name_en: item.name_en,
        category_code: item.category_code,
        unit: item.unit,
        macros_json: item.macros,
        active: true
      }));
      
      await FoodItem.bulkCreate(rows, { updateOnDuplicate: ["name_ar", "name_en", "macros_json", "category_code", "unit"] });
      console.log(`Seeded batch ${i / BATCH_SIZE + 1} / ${Math.ceil(data.length / BATCH_SIZE)}`);
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding food:", error);
    process.exit(1);
  }
}

seed();
