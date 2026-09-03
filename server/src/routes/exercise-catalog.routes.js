import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../middleware/api-response.js";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../data/exercises.json");
const arPath = path.join(__dirname, "../data/exercises-ar.json");
const overridesPath = path.join(__dirname, "../data/exercises-ar-overrides.json");
const mediaOverridesPath = path.join(__dirname, "../data/exercises-media-overrides.json");
const GIF_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";

// Set up multer for local uploads
const upload = multer({
  dest: path.join(__dirname, "../../../public/uploads/exercises/"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

let exercisesCache = null;
let arNames = null;
let mediaOverridesCache = null;

function loadMediaOverrides() {
  if (mediaOverridesCache) return mediaOverridesCache;
  try {
    if (fs.existsSync(mediaOverridesPath)) {
      mediaOverridesCache = JSON.parse(fs.readFileSync(mediaOverridesPath, "utf8"));
    } else {
      mediaOverridesCache = {};
    }
  } catch {
    mediaOverridesCache = {};
  }
  return mediaOverridesCache;
}

function loadArNames() {
  if (arNames) return arNames;
  try {
    const base = JSON.parse(fs.readFileSync(arPath, "utf8"));
    let overrides = {};
    if (fs.existsSync(overridesPath)) {
      overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
    }
    // Overrides take priority; normalise keys to lowercase
    arNames = {};
    for (const [k, v] of Object.entries(base)) arNames[k.toLowerCase()] = v;
    for (const [k, v] of Object.entries(overrides)) arNames[k.toLowerCase()] = v;
    return arNames;
  } catch {
    arNames = {};
    return arNames;
  }
}

function loadExercises() {
  if (exercisesCache) return exercisesCache;
  const rawData = fs.readFileSync(dataPath, "utf8");
  const ar = loadArNames();
  const mediaOverrides = loadMediaOverrides();
  
  exercisesCache = JSON.parse(rawData).map((ex, index) => {
    const id = ex.id || `ex_${index}`;
    const nameKey = (ex.name || "").toLowerCase();
    const nameAr = ar[nameKey] || null;
    const customMedia = mediaOverrides[id] || null;
    
    let gifUrl = ex.gif_url ? GIF_BASE + ex.gif_url : null;
    let imageUrl = ex.image ? GIF_BASE + ex.image : null;
    
    if (customMedia) {
      if (customMedia.endsWith(".gif") || customMedia.endsWith(".mp4") || customMedia.endsWith(".webm") || customMedia.includes("giphy.com")) {
        gifUrl = customMedia.startsWith("http") ? customMedia : `/uploads/exercises/${customMedia}`;
        imageUrl = customMedia.startsWith("http") ? customMedia : `/uploads/exercises/${customMedia}`;
      } else {
        imageUrl = customMedia.startsWith("http") ? customMedia : `/uploads/exercises/${customMedia}`;
        gifUrl = customMedia.startsWith("http") ? customMedia : `/uploads/exercises/${customMedia}`; // Using image as gif if none exists
      }
    }

    return {
      id,
      name: ex.name,
      nameAr,
      category: ex.category,
      equipment: ex.equipment,
      bodyPart: ex.body_part,
      target: ex.target,
      muscleGroup: ex.muscle_group,
      primaryMuscles: ex.muscle_group ? [ex.muscle_group] : [],
      secondaryMuscles: ex.secondary_muscles || [],
      instructions: ex.instructions || (ex.instruction_steps?.en ? ex.instruction_steps.en.join(" ") : ""),
      level: ex.level || null,
      gifUrl,
      imageUrl,
      attribution: ex.attribution || null,
    };
  });
  return exercisesCache;
}

function invalidateCache() {
  exercisesCache = null;
  arNames = null;
  mediaOverridesCache = null;
}

export function exerciseCatalogRouter() {
  const router = express.Router();

  // Public list/search — no auth required (same as before)
  router.get("/", (req, res, next) => {
    try {
      const q = (req.query.q || "").toLowerCase();
      const limit = parseInt(req.query.limit, 10) || 50;
      let exercises = loadExercises();

      if (q) {
        exercises = exercises.filter(ex =>
          ex.name?.toLowerCase().includes(q) ||
          ex.nameAr?.includes(q) ||
          ex.muscleGroup?.toLowerCase().includes(q) ||
          ex.bodyPart?.toLowerCase().includes(q) ||
          ex.target?.toLowerCase().includes(q) ||
          ex.equipment?.toLowerCase().includes(q)
        );
      }

      res.json({
        success: true,
        data: {
          items: exercises.slice(0, limit),
          total: exercises.length
        }
      });
    } catch (err) {
      next(err);
    }
  });

  // Doctor-only: save a custom Arabic name override for an exercise
  router.put("/:exerciseId/ar-name", requireAuth, (req, res, next) => {
    try {
      if (req.auth.role !== "doctor" && req.auth.role !== "admin") {
        return res.status(403).json({ success: false, error: { message: "غير مصرح" } });
      }
      const { exerciseId } = req.params;
      const { nameAr, exerciseName } = req.body;
      if (!nameAr || !exerciseName) {
        return res.status(400).json({ success: false, error: { message: "nameAr و exerciseName مطلوبان" } });
      }

      let overrides = {};
      if (fs.existsSync(overridesPath)) {
        overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
      }
      overrides[exerciseName.toLowerCase()] = nameAr;
      fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), "utf8");

      invalidateCache();

      return res.json({ success: true, data: { exerciseId, nameAr } });
    } catch (err) {
      next(err);
    }
  });

  // Doctor-only: get all Arabic name overrides (for the manager page)
  router.get("/ar-overrides", requireAuth, (req, res, next) => {
    try {
      if (req.auth.role !== "doctor" && req.auth.role !== "admin") {
        return res.status(403).json({ success: false, error: { message: "غير مصرح" } });
      }
      let overrides = {};
      if (fs.existsSync(overridesPath)) {
        overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
      }
      return res.json({ success: true, data: overrides });
    } catch (err) {
      next(err);
    }
  });

  // Doctor-only: set media for an exercise (URL or upload)
  router.put("/:exerciseId/media", requireAuth, upload.single("mediaFile"), (req, res, next) => {
    try {
      if (req.auth.role !== "doctor" && req.auth.role !== "admin") {
        return res.status(403).json({ success: false, error: { message: "غير مصرح" } });
      }
      
      const { exerciseId } = req.params;
      const { mediaUrl } = req.body;
      
      let finalMedia = null;
      
      if (req.file) {
        // file uploaded locally
        finalMedia = req.file.filename;
      } else if (mediaUrl && mediaUrl.trim()) {
        // external url provided
        finalMedia = mediaUrl.trim();
      } else {
        return res.status(400).json({ success: false, error: { message: "يجب إرسال رابط أو رفع ملف" } });
      }
      
      let overrides = {};
      if (fs.existsSync(mediaOverridesPath)) {
        overrides = JSON.parse(fs.readFileSync(mediaOverridesPath, "utf8"));
      }
      
      overrides[exerciseId] = finalMedia;
      fs.writeFileSync(mediaOverridesPath, JSON.stringify(overrides, null, 2), "utf8");
      
      invalidateCache();
      
      return res.json({ success: true, data: { exerciseId, media: finalMedia } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
