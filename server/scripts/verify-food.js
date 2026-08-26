import { sequelize } from "../src/config/database.js";

const [cols] = await sequelize.query("SHOW COLUMNS FROM food_item LIKE 'macros_json'");
const [cnt] = await sequelize.query("SELECT COUNT(*) AS c FROM food_item");
console.log("macros_json column present:", !!(cols && cols.length));
console.log("food_item rows:", cnt[0].c);
await sequelize.close();
