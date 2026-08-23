import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[\uFFFD]/g, "")
    .replace(/[^a-z0-9,/().'-]+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();

const COLUMN_MAP = {
  "WATER (g)": "water_g",
  "ENERGY (Kcal)": "energy_kcal",
  "PROTEIN (g)": "protein_g",
  "FAT (g)": "fat_g",
  "ASH (g)": "ash_g",
  "FIBER (g)": "fiber_g",
  "CARBOHYDRATE  (g)": "carb_g",
  "SODIUM (mg)": "sodium_mg",
  "POTASSIUM (mg)": "potassium_mg",
  "CALCIUM (mg)": "calcium_mg",
  "PHOSPHORUS (mg)": "phosphorus_mg",
  "MAGNESIUM (mg)": "magnesium_mg",
  "IRON (mg)": "iron_mg",
  "ZINC (mg)": "zinc_mg",
  "COPPER (mg)": "copper_mg",
  "VITAMIN A (ugre)": "vitamin_a_ug",
  "VITAMIN C (mg)": "vitamin_c_mg",
  "THIAMIN (mg)": "thiamin_mg",
  "REBOFLAVIN (mg)": "riboflavin_mg"
};

const num = (v) => {
  const t = String(v ?? "").trim();
  if (!t || t.toUpperCase() === "T") return 0;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// Source CSV contains entry errors (e.g. Basterma meat carb_g=1500). Any
// macro expressed in grams cannot exceed 100 per 100 g of food.
const GRAM_KEYS = ["water_g", "protein_g", "fat_g", "ash_g", "fiber_g", "carb_g"];
const sanitizeMacros = (macros, nameEn) => {
  for (const key of GRAM_KEYS) {
    if (macros[key] > 100) {
      console.warn(`[food-build] implausible ${key}=${macros[key]} for "${nameEn}" -> 0`);
      macros[key] = 0;
    }
  }
  return macros;
};

// Names in the CSV contain corrupted bytes (\uFFFD), stray spaces and mixed
// spacing around punctuation. Clean once and reuse everywhere so code
// matching stays stable across rebuilds even when the CSV encoding shifts.
const cleanName = (s) =>
  String(s)
    .replace(/[\uFFFD]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

const csv = fs.readFileSync(path.join(ROOT, "Egyptian Food.csv"), "utf8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
const header = parseCsvLine(lines[0]).map((h) => h.trim());
const rows = lines.slice(1).map((line) => parseCsvLine(line));

const dictRaw = JSON.parse(fs.readFileSync(path.join(__dirname, "food-ar.json"), "utf8"));
const dict = {};
for (const [k, v] of Object.entries(dictRaw)) dict[norm(k)] = v;

const existing = JSON.parse(fs.readFileSync(path.join(__dirname, "food_seed.json"), "utf8"));
const codeByNormName = new Map(existing.map((item) => [norm(item.name_en), item.code]));
let nextCode = existing.length;
let translated = 0;
const missing = [];
const seen = new Set();
const usedCodes = new Set();
const items = [];

for (const cells of rows) {
  const row = {};
  header.forEach((h, i) => { row[h] = cells[i] ?? ""; });
  const nameEn = cleanName(row.FOOD);
  if (!nameEn || seen.has(nameEn)) continue;
  seen.add(nameEn);
  const nameAr = dict[norm(nameEn)];
  if (nameAr) translated++;
  else missing.push(nameEn);
  const macros = {};
  for (const [col, key] of Object.entries(COLUMN_MAP)) macros[key] = num(row[col]);
  sanitizeMacros(macros, nameEn);
  let code = codeByNormName.get(norm(nameEn));
  if (!code) code = `food_${String(nextCode++).padStart(4, "0")}`;
  usedCodes.add(code);
  items.push({ code, name_ar: nameAr || nameEn, name_en: nameEn, category_code: "general", unit: "100g", macros });
}

fs.writeFileSync(path.join(__dirname, "food_seed.json"), JSON.stringify(items, null, 2));

console.log(`items=${items.length} translated=${translated}/${items.length}`);
if (missing.length) console.log("MISSING AR:\n" + missing.join("\n"));
