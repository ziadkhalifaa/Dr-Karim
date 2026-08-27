import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../data/exercises.json");
const GIF_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/";

function loadExercises() {
  if (exercisesCache) return exercisesCache;
  try {
    const rawData = fs.readFileSync(dataPath, "utf8");
    exercisesCache = JSON.parse(rawData).map((ex, index) => ({
      id: ex.id || `ex_${index}`,
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      bodyPart: ex.body_part,
      target: ex.target,
      muscleGroup: ex.muscle_group,
      primaryMuscles: ex.muscle_group ? [ex.muscle_group] : [],
      secondaryMuscles: ex.secondary_muscles || [],
      instructions: ex.instructions || (ex.instruction_steps?.en?.join(" ") || ""),
      level: ex.level || null,
      gifUrl: ex.gif_url ? GIF_BASE + ex.gif_url : null,
      imageUrl: ex.image ? GIF_BASE + ex.image : null,
      attribution: ex.attribution || null,
    }));
    return exercisesCache;
  } catch (err) {
    console.error("Failed to load exercises dataset:", err);
    return [];
  }
}

export function exerciseCatalogRouter() {
  const router = express.Router();

  router.get("/", (req, res, next) => {
    try {
      const q = (req.query.q || "").toLowerCase();
      const limit = parseInt(req.query.limit, 10) || 50;
      let exercises = loadExercises();

      if (q) {
        exercises = exercises.filter(ex => 
          ex.name?.toLowerCase().includes(q) || 
          ex.muscleGroup?.toLowerCase().includes(q) ||
          ex.bodyPart?.toLowerCase().includes(q) ||
          ex.target?.toLowerCase().includes(q) ||
          ex.equipment?.toLowerCase().includes(q)
        );
      }

      res.json({
        items: exercises.slice(0, limit),
        total: exercises.length
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
