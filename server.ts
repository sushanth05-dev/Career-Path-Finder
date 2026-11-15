import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import type { CareerRoadmapResponse, RoadmapRequest } from "./src/types/roadmap.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const roadmapSchema = {
  type: Type.OBJECT,
  properties: {
    targetRole: {
      type: Type.STRING,
      description: "Normalized title of the target career role.",
    },
    hoursPerWeek: {
      type: Type.INTEGER,
      description: "Weekly study hours committed by the student.",
    },
    roleSummary: {
      type: Type.STRING,
      description:
        "Concise 2-sentence overview of what the target role demands and how the student's current foundation maps to it.",
    },
    readinessSummary: {
      type: Type.STRING,
      description:
        "Realistic 1-sentence pacing note based on their weekly hours over the 8-week sprint.",
    },
    skillGapTable: {
      type: Type.ARRAY,
      description:
        "Comprehensive 8 to 12 row comparison of skills the student already has, partially has, and needs to learn for the target role.",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: {
            type: Type.STRING,
            description: "Specific skill, language, tool, or concept.",
          },
          category: {
            type: Type.STRING,
            description:
              "Domain category such as Programming, Data & ML, Mathematics, Systems, Frontend, or Tooling.",
          },
          currentStatus: {
            type: Type.STRING,
            enum: ["Have", "Partial", "To Learn"],
            description: "Whether the student already has, partially has, or needs to learn this skill.",
          },
          currentLevel: {
            type: Type.STRING,
            description: "Brief description of current proficiency (e.g., Basic syntax, Proficient, None).",
          },
          targetRequirement: {
            type: Type.STRING,
            description: "Concrete competency expected for an entry/junior target role.",
          },
          priority: {
            type: Type.STRING,
            enum: ["Critical", "High", "Recommended"],
            description: "Learning priority for getting job-ready.",
          },
          estimatedHours: {
            type: Type.INTEGER,
            description: "Estimated study hours needed to reach target requirement (0 if already Have).",
          },
        },
        required: [
          "skill",
          "category",
          "currentStatus",
          "currentLevel",
          "targetRequirement",
          "priority",
          "estimatedHours",
        ],
      },
    },
    roadmapWeeks: {
      type: Type.ARRAY,
      description:
        "Exactly 8 ordered weeks (Week 1 through Week 8) forming a progressive, realistic study plan scaled to hoursPerWeek.",
      items: {
        type: Type.OBJECT,
        properties: {
          week: {
            type: Type.INTEGER,
            description: "Week number from 1 to 8.",
          },
          title: {
            type: Type.STRING,
            description: "Clear theme title for the week.",
          },
          focusArea: {
            type: Type.STRING,
            description: "Primary skill domain covered this week.",
          },
          hoursAllocated: {
            type: Type.INTEGER,
            description: "Number of study hours for this week (equal to hoursPerWeek).",
          },
          objectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 concise, actionable learning objectives for this week.",
          },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 to 5 specific tools, concepts, or libraries to study.",
          },
          milestone: {
            type: Type.STRING,
            description: "Concrete end-of-week checkpoint or mini deliverable.",
          },
        },
        required: [
          "week",
          "title",
          "focusArea",
          "hoursAllocated",
          "objectives",
          "topics",
          "milestone",
        ],
      },
    },
    miniProjects: {
      type: Type.ARRAY,
      description:
        "Exactly 3 portfolio-ready mini project ideas that bridge the student's skill gaps.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Clear, practical project name.",
          },
          difficulty: {
            type: Type.STRING,
            enum: ["Starter", "Intermediate", "Capstone"],
            description: "Project complexity tier.",
          },
          estimatedHours: {
            type: Type.INTEGER,
            description: "Realistic hours needed to build and document the project.",
          },
          recommendedWeek: {
            type: Type.STRING,
            description: "Best window in the roadmap to build this (e.g., Week 3–4).",
          },
          summary: {
            type: Type.STRING,
            description: "2-sentence description of what the project builds and why recruiters care.",
          },
          skillsApplied: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 to 5 core skills practiced in this project.",
          },
          deliverables: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 concrete artifacts or features to ship in the GitHub repository.",
          },
        },
        required: [
          "title",
          "difficulty",
          "estimatedHours",
          "recommendedWeek",
          "summary",
          "skillsApplied",
          "deliverables",
        ],
      },
    },
  },
  required: [
    "targetRole",
    "hoursPerWeek",
    "roleSummary",
    "readinessSummary",
    "skillGapTable",
    "roadmapWeeks",
    "miniProjects",
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/roadmap", async (req, res) => {
    try {
      const body = req.body as Partial<RoadmapRequest>;
      const targetRole = (body.targetRole ?? "").trim();
      const currentSkills = Array.isArray(body.currentSkills)
        ? body.currentSkills.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const hoursPerWeek = Math.min(Math.max(Number(body.hoursPerWeek) || 10, 2), 60);
      const experienceLevel = body.experienceLevel || "Beginner";

      if (!targetRole) {
        return res.status(400).json({ error: "Please specify a target job role." });
      }
      if (currentSkills.length === 0) {
        return res.status(400).json({ error: "Please enter at least one current skill." });
      }

      const ai = getGeminiClient();

      const prompt = [
        `Student Profile:`,
        `- Current Skills: ${currentSkills.join(", ")}`,
        `- Target Job Role: ${targetRole}`,
        `- Weekly Study Availability: ${hoursPerWeek} hours/week`,
        `- Self-Assessed Level: ${experienceLevel}`,
        ``,
        `Instructions:`,
        `1. Build a crisp Skill Gap Table (8 to 10 rows) comparing what the student already knows ('Have'), knows partially ('Partial'), and needs to learn ('To Learn') for an entry-level ${targetRole}.`,
        `2. Create an exact 8-week progressive roadmap (weeks 1 through 8) sequenced from prerequisites to applied workflows, scaled realistically to ${hoursPerWeek} hrs/week. Include 3 concise objectives, 3-4 topics, and 1 clear milestone per week.`,
        `3. Design exactly 3 portfolio mini projects (Starter, Intermediate, Capstone) with 3 concise deliverables each.`,
        `4. Keep every text field crisp and direct (no long paragraphs or fluff).`,
      ].join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are an expert technical career mentor. Output concise, practical, industry-aligned skill comparisons, 8-week learning plans, and portfolio projects in strict JSON. Keep descriptions to 1-2 short sentences.",
          responseMimeType: "application/json",
          responseSchema: roadmapSchema,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        return res.status(502).json({ error: "Empty response received from Gemini API." });
      }

      const parsed = JSON.parse(rawText) as CareerRoadmapResponse;

      // Ensure weeks are sorted 1..8 and hoursAllocated matches
      if (Array.isArray(parsed.roadmapWeeks)) {
        parsed.roadmapWeeks = parsed.roadmapWeeks
          .slice(0, 8)
          .sort((a, b) => a.week - b.week)
          .map((w, idx) => ({
            ...w,
            week: idx + 1,
            hoursAllocated: w.hoursAllocated || hoursPerWeek,
          }));
      }

      if (Array.isArray(parsed.miniProjects)) {
        parsed.miniProjects = parsed.miniProjects.slice(0, 3);
      }

      return res.json(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate roadmap.";
      console.error("Roadmap generation error:", err);

      if (message.includes("GEMINI_API_KEY")) {
        return res.status(500).json({
          error:
            "Gemini API key is not set. Add GEMINI_API_KEY in the Settings > Secrets panel.",
        });
      }
      if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({
          error: "API quota exceeded. Please wait a moment and try again.",
        });
      }
      if (message.includes("403") || message.includes("400") || message.includes("API_KEY")) {
        return res.status(403).json({
          error:
            "Unable to authenticate with Gemini API. Please verify GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerPath server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
