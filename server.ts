import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type {
  CareerRoadmapResponse,
  InterviewPrepResponse,
  RoadmapRequest,
} from "./src/types/roadmap.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_DEV =
  process.argv.includes("--dev") ||
  (process.env.NODE_ENV !== "production" && !fs.existsSync(path.resolve(__dirname, "dist")));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
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
        "Comprehensive 8 to 10 row comparison of skills the student already has, partially has, and needs to learn for the target role.",
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
            description: "3 to 4 specific tools, concepts, or libraries to study.",
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

function buildPrompt(
  currentSkills: string[],
  targetRole: string,
  hoursPerWeek: number,
  experienceLevel: string
) {
  return [
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
}

function normalizeRoadmap(rawText: string, hoursPerWeek: number): CareerRoadmapResponse {
  const cleanedJson = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleanedJson) as CareerRoadmapResponse;

  if (!Array.isArray(parsed.skillGapTable)) {
    parsed.skillGapTable = [];
  }

  if (Array.isArray(parsed.roadmapWeeks)) {
    parsed.roadmapWeeks = parsed.roadmapWeeks
      .slice(0, 8)
      .sort((a, b) => a.week - b.week)
      .map((w, idx) => ({
        ...w,
        week: idx + 1,
        hoursAllocated: w.hoursAllocated || hoursPerWeek,
        objectives: Array.isArray(w.objectives) ? w.objectives : [],
        topics: Array.isArray(w.topics) ? w.topics : [],
      }));
  } else {
    parsed.roadmapWeeks = [];
  }

  if (Array.isArray(parsed.miniProjects)) {
    parsed.miniProjects = parsed.miniProjects.slice(0, 3).map((p) => ({
      ...p,
      skillsApplied: Array.isArray(p.skillsApplied) ? p.skillsApplied : [],
      deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
    }));
  } else {
    parsed.miniProjects = [];
  }

  return parsed;
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("timeout") ||
    msg.includes("fetch failed")
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timeout after ${ms}ms`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const extractSkillsSchema = {
  type: Type.OBJECT,
  properties: {
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Distinct, concise technical skills, languages, tools, or frameworks extracted from the text (max 15).",
    },
    suggestedLevel: {
      type: Type.STRING,
      enum: ["Beginner", "Intermediate", "Advanced"],
      description: "Best estimate of the student's current experience level.",
    },
  },
  required: ["skills", "suggestedLevel"],
};

const interviewPrepSchema = {
  type: Type.OBJECT,
  properties: {
    targetRole: {
      type: Type.STRING,
      description: "Target job role being prepared for.",
    },
    focusSummary: {
      type: Type.STRING,
      description: "Concise 1-2 sentence strategy on what hiring panels prioritize for this role given the candidate's current gaps.",
    },
    questions: {
      type: Type.ARRAY,
      description: "Exactly 6 tailored interview questions: 2 Technical, 2 Applied Scenario, and 2 Behavioral.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique short ID such as q1..q6.",
          },
          category: {
            type: Type.STRING,
            enum: ["Technical", "Applied Scenario", "Behavioral"],
          },
          difficulty: {
            type: Type.STRING,
            enum: ["Foundational", "Core", "Stretch"],
          },
          skillTested: {
            type: Type.STRING,
            description: "Specific skill or competency evaluated.",
          },
          question: {
            type: Type.STRING,
            description: "Realistic interview prompt a hiring manager would ask.",
          },
          whatInterviewersLookFor: {
            type: Type.STRING,
            description: "1-2 concise sentences describing strong signals interviewers look for.",
          },
          answerFramework: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 concise structured bullet points for answering effectively.",
          },
          sampleOutline: {
            type: Type.STRING,
            description: "2-3 sentence model response outline showing how to structure a crisp answer.",
          },
        },
        required: [
          "id",
          "category",
          "difficulty",
          "skillTested",
          "question",
          "whatInterviewersLookFor",
          "answerFramework",
          "sampleOutline",
        ],
      },
    },
  },
  required: ["targetRole", "focusSummary", "questions"],
};

async function generateStructuredJsonWithResilience(
  ai: ReturnType<typeof getGeminiClient>,
  options: {
    prompt: string;
    systemInstruction: string;
    responseSchema: Record<string, unknown>;
    onProgress?: (step: number, message: string) => void;
  }
): Promise<string> {
  const attempts: Array<{ model: string; thinkingLevel?: ThinkingLevel; timeoutMs: number }> = [
    { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 28000 },
    { model: "gemini-3.1-flash-lite", timeoutMs: 20000 },
    { model: "gemini-3.1-flash-lite", timeoutMs: 20000 },
  ];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const { model, thinkingLevel, timeoutMs } = attempts[i];
    try {
      if (i > 0) {
        options.onProgress?.(1, "Switching to fast fallback model for uninterrupted generation...");
        await new Promise((r) => setTimeout(r, 700 * i));
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: "application/json",
            responseSchema: options.responseSchema,
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
          },
        }),
        timeoutMs,
        model
      );

      const text = response.text?.trim();
      if (text) return text;
      lastError = new Error("Empty response received from Gemini API.");
    } catch (err: unknown) {
      lastError = err;
      console.warn(`Attempt ${i + 1} (${model}) failed:`, err instanceof Error ? err.message : err);
      if (!isRetryableError(err)) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error("Failed to generate response.");
}

async function generateRoadmapJsonWithResilience(
  ai: ReturnType<typeof getGeminiClient>,
  prompt: string,
  onProgress?: (step: number, message: string) => void
): Promise<string> {
  return generateStructuredJsonWithResilience(ai, {
    prompt,
    systemInstruction:
      "You are an expert technical career mentor. Output concise, practical, industry-aligned skill comparisons, 8-week learning plans, and portfolio projects in strict JSON. Keep descriptions to 1-2 short sentences.",
    responseSchema: roadmapSchema,
    onProgress,
  });
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : "Failed to generate roadmap.";
  if (message.includes("GEMINI_API_KEY")) {
    return {
      status: 500,
      message: "Gemini API key is not set. Add GEMINI_API_KEY in the Settings > Secrets panel.",
    };
  }
  if (message.includes("503") || message.includes("UNAVAILABLE") || message.includes("high demand")) {
    return {
      status: 503,
      message: "The AI service is experiencing temporary high demand. Please try again in a few seconds.",
    };
  }
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "API quota exceeded. Please wait a moment and try again.",
    };
  }
  if (message.includes("403") || message.includes("400") || message.includes("API_KEY")) {
    return {
      status: 403,
      message: "Unable to authenticate with Gemini API. Please verify GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (message.includes("timeout")) {
    return {
      status: 504,
      message: "The request took too long to respond. Please try again.",
    };
  }
  return { status: 500, message: "Unable to generate roadmap right now. Please try again." };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: IS_DEV ? "development" : "production",
    });
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
      const rawText = await generateRoadmapJsonWithResilience(
        ai,
        buildPrompt(currentSkills, targetRole, hoursPerWeek, experienceLevel)
      );

      return res.json(normalizeRoadmap(rawText, hoursPerWeek));
    } catch (err: unknown) {
      console.error("Roadmap generation error:", err);
      const mapped = mapGeminiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post("/api/roadmap/stream", async (req, res) => {
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

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const sendEvent = (event: string, payload: unknown) => {
      if (res.writableEnded || res.destroyed) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    let closed = false;
    res.on("close", () => {
      if (!res.writableEnded) {
        closed = true;
      }
    });

    const stageMessages = [
      "Comparing your skills against target role expectations...",
      "Evaluating skill gaps and priority hours...",
      "Sequencing your 8-week learning syllabus...",
      "Designing 3 portfolio mini-projects...",
    ];
    let stageIndex = 0;

    sendEvent("progress", { step: 0, message: stageMessages[0] });

    const keepAlive = setInterval(() => {
      if (closed || res.writableEnded) {
        clearInterval(keepAlive);
        return;
      }
      stageIndex = Math.min(stageIndex + 1, stageMessages.length - 1);
      sendEvent("progress", { step: stageIndex, message: stageMessages[stageIndex] });
    }, 2200);

    try {
      const ai = getGeminiClient();
      const rawText = await generateRoadmapJsonWithResilience(
        ai,
        buildPrompt(currentSkills, targetRole, hoursPerWeek, experienceLevel),
        (step, message) => sendEvent("progress", { step, message })
      );

      clearInterval(keepAlive);

      if (closed) {
        return;
      }

      const normalized = normalizeRoadmap(rawText, hoursPerWeek);
      sendEvent("result", normalized);
      res.end();
    } catch (err: unknown) {
      clearInterval(keepAlive);
      console.error("Streaming roadmap generation error:", err);
      const mapped = mapGeminiError(err);
      sendEvent("error", { error: mapped.message });
      res.end();
    }
  });

  app.post("/api/extract-skills", async (req, res) => {
    try {
      const text = String(req.body?.text ?? "").trim();
      if (text.length < 10) {
        return res
          .status(400)
          .json({ error: "Please paste a short resume excerpt, bio, or coursework list (at least 10 characters)." });
      }

      const ai = getGeminiClient();
      const rawText = await generateStructuredJsonWithResilience(ai, {
        prompt: `Extract distinct technical skills, tools, programming languages, and domain concepts from the following student text. Normalize skill names cleanly (e.g. "Basic Python", "SQL", "React", "Git") and estimate their experience level.\n\nText:\n${text.slice(0, 4000)}`,
        systemInstruction:
          "You extract concise, accurate technical skill lists from resumes, course lists, or student bios. Return strict JSON.",
        responseSchema: extractSkillsSchema,
      });

      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as {
        skills?: string[];
        suggestedLevel?: string;
      };

      const skills = Array.isArray(parsed.skills)
        ? Array.from(
            new Set(
              parsed.skills.map((s) => String(s).trim()).filter(Boolean)
            )
          ).slice(0, 15)
        : [];

      return res.json({
        skills,
        suggestedLevel:
          parsed.suggestedLevel === "Intermediate" ||
          parsed.suggestedLevel === "Advanced"
            ? parsed.suggestedLevel
            : "Beginner",
      });
    } catch (err: unknown) {
      console.error("Skill extraction error:", err);
      const mapped = mapGeminiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post("/api/interview-prep", async (req, res) => {
    try {
      const targetRole = String(req.body?.targetRole ?? "").trim();
      const currentSkills = Array.isArray(req.body?.currentSkills)
        ? req.body.currentSkills.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [];
      const gapSkills = Array.isArray(req.body?.gapSkills)
        ? req.body.gapSkills.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [];
      const experienceLevel = String(req.body?.experienceLevel ?? "Beginner");

      if (!targetRole) {
        return res.status(400).json({ error: "Target role is required." });
      }

      const ai = getGeminiClient();
      const prompt = [
        `Candidate Target Role: ${targetRole}`,
        `Experience Level: ${experienceLevel}`,
        `Existing Skills: ${currentSkills.join(", ") || "None listed"}`,
        `Key Skill Gaps Being Closed: ${gapSkills.join(", ") || "General entry-level competencies"}`,
        ``,
        `Generate exactly 6 realistic entry/junior interview questions:`,
        `- 2 Technical questions testing core fundamentals and gap skills`,
        `- 2 Applied Scenario questions testing real-world troubleshooting or design`,
        `- 2 Behavioral questions focused on projects, learning agility, and collaboration`,
        `Keep every field crisp, practical, and directly actionable for interview practice.`,
      ].join("\n");

      const rawText = await generateStructuredJsonWithResilience(ai, {
        prompt,
        systemInstruction:
          "You are a senior hiring manager and technical interviewer. Generate realistic, concise interview prep drills and structured answer frameworks in strict JSON.",
        responseSchema: interviewPrepSchema,
      });

      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as InterviewPrepResponse;

      if (!Array.isArray(parsed.questions)) {
        parsed.questions = [];
      } else {
        parsed.questions = parsed.questions.slice(0, 6).map((q, idx) => ({
          ...q,
          id: q.id || `q${idx + 1}`,
          answerFramework: Array.isArray(q.answerFramework)
            ? q.answerFramework
            : [],
        }));
      }

      return res.json(parsed);
    } catch (err: unknown) {
      console.error("Interview prep generation error:", err);
      const mapped = mapGeminiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (IS_DEV) {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(
      `CareerPath server (${IS_DEV ? "dev" : "production"}) listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
