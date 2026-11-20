import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  History,
  Moon,
  Printer,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { TopBar, type ActiveView } from "./components/TopBar";
import { ProfilePanel } from "./components/ProfilePanel";
import { RoadmapOverview } from "./components/RoadmapOverview";
import { SkillGapTable } from "./components/SkillGapTable";
import { RoadmapTimeline } from "./components/RoadmapTimeline";
import { MiniProjectsGrid } from "./components/MiniProjectsGrid";
import { InterviewPrepSection } from "./components/InterviewPrepSection";
import {
  EmptyState,
  LoadingSkeleton,
  SAMPLE_PRESETS,
  type SamplePreset,
} from "./components/EmptyState";
import {
  downloadTextFile,
  formatRoadmapAsMarkdown,
  getSkillKey,
} from "./utils/exportPlan";
import type {
  CareerRoadmapResponse,
  ExperienceLevel,
  InterviewPrepResponse,
  RoadmapRequest,
  SavedRoadmapEntry,
  SkillStatus,
} from "./types/roadmap";

type ThemeMode = "light" | "dark";

const STORAGE_THEME_KEY = "careerpath-theme";
const STORAGE_PLANS_KEY = "careerpath-saved-plans";

const MOBILE_TABS: { id: ActiveView; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "skills", label: "Skills" },
  { id: "roadmap", label: "8-Week" },
  { id: "projects", label: "Projects" },
  { id: "interview", label: "Interview" },
];

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // Ignore storage errors
  }
  return "light";
}

function loadSavedPlans(): SavedRoadmapEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PLANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedRoadmapEntry[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [skills, setSkills] = useState<string[]>(["C", "Basic Python", "HTML"]);
  const [targetRole, setTargetRole] = useState<string>("Data Scientist");
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("Beginner");

  const [savedPlans, setSavedPlans] =
    useState<SavedRoadmapEntry[]>(loadSavedPlans);
  const [activePlanId, setActivePlanId] = useState<string | null>(() => {
    const existing = loadSavedPlans();
    return existing.length > 0 ? existing[0].id : null;
  });
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<ActiveView>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [isInterviewLoading, setIsInterviewLoading] = useState<boolean>(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  const activePlan =
    savedPlans.find((plan) => plan.id === activePlanId) ?? null;
  const roadmap = activePlan?.data ?? null;
  const completedWeeks = activePlan?.completedWeeks ?? [];
  const weekNotes = activePlan?.weekNotes ?? {};
  const completedObjectives = activePlan?.completedObjectives ?? {};
  const completedDeliverables = activePlan?.completedDeliverables ?? {};
  const skillStatusOverrides = activePlan?.skillStatusOverrides ?? {};
  const interviewPrep = activePlan?.interviewPrep ?? null;
  const practicedQuestions = activePlan?.practicedQuestions ?? [];
  const interviewDrafts = activePlan?.interviewDrafts ?? {};

  const objectiveCounts = useMemo(() => {
    if (!roadmap) return { done: 0, total: 0 };
    let total = 0;
    let done = 0;
    for (const week of roadmap.roadmapWeeks) {
      week.objectives.forEach((_, idx) => {
        total++;
        if (completedObjectives[`${week.week}-${idx}`]) done++;
      });
    }
    return { done, total };
  }, [roadmap, completedObjectives]);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(savedPlans));
    } catch {
      // Ignore storage errors
    }
  }, [savedPlans]);

  const updateActivePlan = (
    updater: (plan: SavedRoadmapEntry) => SavedRoadmapEntry
  ) => {
    if (!activePlanId) return;
    setSavedPlans((prev) =>
      prev.map((plan) => (plan.id === activePlanId ? updater(plan) : plan))
    );
  };

  const saveNewRoadmap = (
    data: CareerRoadmapResponse,
    payload: RoadmapRequest
  ) => {
    const entry: SavedRoadmapEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      skillsInput: payload.currentSkills,
      experienceLevel: payload.experienceLevel,
      completedWeeks: [],
      weekNotes: {},
      completedObjectives: {},
      completedDeliverables: {},
      skillStatusOverrides: {},
      interviewPrep: null,
      practicedQuestions: [],
      interviewDrafts: {},
      data,
    };
    setSavedPlans((prev) => [entry, ...prev].slice(0, 8));
    setActivePlanId(entry.id);
    setActiveView("all");
    setInterviewError(null);
  };

  const generateWithFallback = async (
    payload: RoadmapRequest
  ): Promise<CareerRoadmapResponse> => {
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawBody = await res.text();
    let parsed: Record<string, unknown> | null = null;
    if (rawBody) {
      try {
        parsed = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      const errMessage =
        (parsed && typeof parsed.error === "string" && parsed.error) ||
        `Request failed with status ${res.status}. Please try again.`;
      throw new Error(errMessage);
    }

    if (!parsed) {
      throw new Error("Empty response received from server.");
    }

    return parsed as unknown as CareerRoadmapResponse;
  };

  const generateRoadmap = async (
    overridePayload?: RoadmapRequest,
    skillsOverride?: string[]
  ) => {
    const payload: RoadmapRequest = overridePayload ?? {
      currentSkills: skillsOverride ?? skills,
      targetRole: targetRole.trim(),
      hoursPerWeek,
      experienceLevel,
    };

    if (!payload.targetRole || payload.currentSkills.length === 0) {
      setError("Please enter at least one current skill and a target job role.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setLoadingMessage("Comparing your skills against target role expectations...");
    setError(null);
    setHistoryOpen(false);

    try {
      const res = await fetch("/api/roadmap/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("text/event-stream") || !res.body) {
        if (!res.ok && contentType.includes("application/json")) {
          const errJson = (await res.json()) as { error?: string };
          throw new Error(errJson.error || `Request failed (${res.status})`);
        }
        const fallbackData = await generateWithFallback(payload);
        saveNewRoadmap(fallbackData, payload);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedResult: CareerRoadmapResponse | null = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const lines = block.split("\n");
          let eventName = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine += line.slice(5).trim();
            }
          }
          if (!dataLine) continue;

          try {
            const parsed = JSON.parse(dataLine) as Record<string, unknown>;
            if (eventName === "progress") {
              if (typeof parsed.step === "number") setLoadingStep(parsed.step);
              if (typeof parsed.message === "string") {
                setLoadingMessage(parsed.message);
              }
            } else if (eventName === "result") {
              receivedResult = parsed as unknown as CareerRoadmapResponse;
            } else if (eventName === "error") {
              streamError =
                typeof parsed.error === "string"
                  ? parsed.error
                  : "Roadmap generation failed.";
            }
          } catch {
            // Ignore malformed SSE chunk
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!receivedResult) {
        const fallbackData = await generateWithFallback(payload);
        saveNewRoadmap(fallbackData, payload);
        return;
      }

      saveNewRoadmap(receivedResult, payload);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to generate career roadmap right now.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInterviewPrep = async () => {
    if (!roadmap || !activePlan) return;

    setIsInterviewLoading(true);
    setInterviewError(null);

    try {
      const gapSkills = roadmap.skillGapTable
        .filter((s) => {
          const eff =
            skillStatusOverrides[getSkillKey(s.skill, s.category)] ??
            s.currentStatus;
          return eff !== "Have";
        })
        .map((s) => s.skill);

      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: roadmap.targetRole,
          currentSkills: activePlan.skillsInput,
          gapSkills,
          experienceLevel: activePlan.experienceLevel,
        }),
      });

      const raw = await res.text();
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;

      if (!res.ok) {
        throw new Error(
          (parsed && typeof parsed.error === "string" && parsed.error) ||
            `Failed to generate interview prep (${res.status}).`
        );
      }

      const prepData = parsed as unknown as InterviewPrepResponse;
      updateActivePlan((plan) => ({
        ...plan,
        interviewPrep: prepData,
        practicedQuestions: [],
        interviewDrafts: {},
      }));
    } catch (err: unknown) {
      setInterviewError(
        err instanceof Error
          ? err.message
          : "Could not generate interview questions right now."
      );
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setSkills(preset.skills);
    setTargetRole(preset.targetRole);
    setHoursPerWeek(preset.hoursPerWeek);
    setExperienceLevel(preset.experienceLevel);
    void generateRoadmap({
      currentSkills: preset.skills,
      targetRole: preset.targetRole,
      hoursPerWeek: preset.hoursPerWeek,
      experienceLevel: preset.experienceLevel,
    });
  };

  const handleSelectSavedPlan = (plan: SavedRoadmapEntry) => {
    setActivePlanId(plan.id);
    setSkills(plan.skillsInput);
    setTargetRole(plan.data.targetRole);
    setHoursPerWeek(plan.data.hoursPerWeek);
    setExperienceLevel(plan.experienceLevel);
    setActiveView("all");
    setHistoryOpen(false);
    setError(null);
    setInterviewError(null);
  };

  const handleDeleteSavedPlan = (planId: string) => {
    setSavedPlans((prev) => {
      const next = prev.filter((p) => p.id !== planId);
      if (activePlanId === planId) {
        setActivePlanId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const handleCycleSkillStatus = (
    skillKey: string,
    currentStatus: SkillStatus
  ) => {
    const nextStatus: SkillStatus =
      currentStatus === "To Learn"
        ? "Partial"
        : currentStatus === "Partial"
        ? "Have"
        : "To Learn";
    updateActivePlan((plan) => ({
      ...plan,
      skillStatusOverrides: {
        ...(plan.skillStatusOverrides ?? {}),
        [skillKey]: nextStatus,
      },
    }));
  };

  const handleToggleWeekComplete = (weekNumber: number) => {
    updateActivePlan((plan) => {
      const exists = plan.completedWeeks.includes(weekNumber);
      return {
        ...plan,
        completedWeeks: exists
          ? plan.completedWeeks.filter((w) => w !== weekNumber)
          : [...plan.completedWeeks, weekNumber],
      };
    });
  };

  const handleToggleObjective = (weekNumber: number, objectiveIndex: number) => {
    const key = `${weekNumber}-${objectiveIndex}`;
    updateActivePlan((plan) => {
      const current = plan.completedObjectives ?? {};
      return {
        ...plan,
        completedObjectives: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const handleToggleDeliverable = (
    projectIndex: number,
    deliverableIndex: number
  ) => {
    const key = `${projectIndex}-${deliverableIndex}`;
    updateActivePlan((plan) => {
      const current = plan.completedDeliverables ?? {};
      return {
        ...plan,
        completedDeliverables: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const handleUpdateWeekNote = (weekNumber: number, note: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      weekNotes: {
        ...plan.weekNotes,
        [weekNumber]: note,
      },
    }));
  };

  const handleTogglePracticedQuestion = (questionId: string) => {
    updateActivePlan((plan) => {
      const existing = plan.practicedQuestions ?? [];
      const has = existing.includes(questionId);
      return {
        ...plan,
        practicedQuestions: has
          ? existing.filter((id) => id !== questionId)
          : [...existing, questionId],
      };
    });
  };

  const handleUpdateInterviewDraft = (questionId: string, value: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      interviewDrafts: {
        ...(plan.interviewDrafts ?? {}),
        [questionId]: value,
      },
    }));
  };

  const handleExportMarkdown = () => {
    if (!roadmap) return;
    const slug = roadmap.targetRole
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const markdown = formatRoadmapAsMarkdown(roadmap, {
      completedWeeks,
      weekNotes,
      completedObjectives,
      completedDeliverables,
      skillStatusOverrides,
      interviewPrep,
    });
    downloadTextFile(`${slug || "career"}-roadmap.md`, markdown);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        id="top"
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
      >
        <TopBar
          activeView={activeView}
          onSelectView={setActiveView}
          hasRoadmap={Boolean(roadmap)}
          onExportMarkdown={handleExportMarkdown}
          onLoadSample={() => handleSelectPreset(SAMPLE_PRESETS[0])}
        />

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {/* Workspace Toolbar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              <span>Career Workspace</span>
              {roadmap && (
                <>
                  <span aria-hidden="true" className="mx-1.5">/</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {roadmap.targetRole}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {savedPlans.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen((prev) => !prev)}
                  aria-expanded={historyOpen}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    historyOpen
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <History className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Saved Plans ({savedPlans.length})</span>
                </button>
              )}

              {roadmap && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Print</span>
                </button>
              )}

              <div
                role="group"
                aria-label="Color theme"
                className="inline-flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  aria-pressed={theme === "light"}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    theme === "light"
                      ? "text-slate-900"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {theme === "light" && (
                    <motion.span
                      layoutId="theme-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-slate-100 rounded-md"
                    />
                  )}
                  <Sun className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                  <span className="relative z-10">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  aria-pressed={theme === "dark"}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    theme === "dark"
                      ? "text-slate-100"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {theme === "dark" && (
                    <motion.span
                      layoutId="theme-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-slate-800 rounded-md"
                    />
                  )}
                  <Moon className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                  <span className="relative z-10">Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Plans Bar */}
          <AnimatePresence>
            {historyOpen && savedPlans.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="no-print mb-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Saved Career Plans
                  </h2>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    aria-label="Close saved plans"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {savedPlans.map((plan) => {
                    const isActive = plan.id === activePlanId;
                    return (
                      <div
                        key={plan.id}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors ${
                          isActive
                            ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectSavedPlan(plan)}
                          className="text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {plan.data.targetRole}
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                            {plan.completedWeeks.length}/{plan.data.roadmapWeeks.length} wks ·{" "}
                            {plan.data.hoursPerWeek}h/wk
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedPlan(plan.id)}
                          aria-label={`Delete ${plan.data.targetRole} plan`}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
            {/* Left Configuration Rail */}
            <div className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-24">
              <ProfilePanel
                skills={skills}
                onChangeSkills={setSkills}
                targetRole={targetRole}
                onChangeTargetRole={setTargetRole}
                hoursPerWeek={hoursPerWeek}
                onChangeHoursPerWeek={setHoursPerWeek}
                experienceLevel={experienceLevel}
                onChangeExperienceLevel={setExperienceLevel}
                isLoading={isLoading}
                onGenerate={(nextSkills) =>
                  void generateRoadmap(undefined, nextSkills)
                }
                hasRoadmap={Boolean(roadmap)}
              />
            </div>

            {/* Right Main Workspace Viewport */}
            <div className="flex-1 min-w-0 w-full space-y-6">
              {error && (
                <div
                  role="alert"
                  className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start justify-between gap-3 text-sm text-red-800 dark:text-red-200"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold">Could not generate roadmap</p>
                      <p className="text-red-700 dark:text-red-300 mt-0.5">
                        {error}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                    className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-200 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Mobile Section Switcher */}
              {roadmap && !isLoading && (
                <div className="no-print md:hidden flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                  {MOBILE_TABS.map((tab) => {
                    const active = activeView === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveView(tab.id)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? "bg-blue-700 dark:bg-blue-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {isLoading ? (
                <LoadingSkeleton
                  activeStep={loadingStep}
                  statusMessage={loadingMessage}
                />
              ) : !roadmap ? (
                <EmptyState
                  activeView={activeView}
                  onSelectPreset={handleSelectPreset}
                />
              ) : (
                <div className="space-y-6">
                  <RoadmapOverview
                    roadmap={roadmap}
                    completedWeeksCount={completedWeeks.length}
                    statusOverrides={skillStatusOverrides}
                    completedObjectivesCount={objectiveCounts.done}
                    totalObjectivesCount={objectiveCounts.total}
                    onOpenInterviewPrep={() => {
                      setActiveView("interview");
                      if (!interviewPrep && !isInterviewLoading) {
                        void handleGenerateInterviewPrep();
                      }
                    }}
                  />

                  {(activeView === "all" || activeView === "skills") && (
                    <SkillGapTable
                      items={roadmap.skillGapTable}
                      statusOverrides={skillStatusOverrides}
                      onCycleSkillStatus={handleCycleSkillStatus}
                    />
                  )}

                  {(activeView === "all" || activeView === "roadmap") && (
                    <RoadmapTimeline
                      targetRole={roadmap.targetRole}
                      weeks={roadmap.roadmapWeeks}
                      completedWeeks={completedWeeks}
                      completedObjectives={completedObjectives}
                      weekNotes={weekNotes}
                      onToggleWeekComplete={handleToggleWeekComplete}
                      onToggleObjective={handleToggleObjective}
                      onUpdateWeekNote={handleUpdateWeekNote}
                    />
                  )}

                  {(activeView === "all" || activeView === "projects") && (
                    <MiniProjectsGrid
                      projects={roadmap.miniProjects}
                      completedDeliverables={completedDeliverables}
                      onToggleDeliverable={handleToggleDeliverable}
                    />
                  )}

                  {(activeView === "all" || activeView === "interview") && (
                    <InterviewPrepSection
                      targetRole={roadmap.targetRole}
                      interviewPrep={interviewPrep}
                      practicedQuestions={practicedQuestions}
                      drafts={interviewDrafts}
                      isLoading={isInterviewLoading}
                      error={interviewError}
                      onGenerate={() => void handleGenerateInterviewPrep()}
                      onTogglePracticed={handleTogglePracticedQuestion}
                      onUpdateDraft={handleUpdateInterviewDraft}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 transition-colors">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              CareerPath · Structured skill gap analysis, 8-week study planning &amp; interview prep
            </span>
            <span>
              Progress, skill updates, notes &amp; interview drafts save automatically
            </span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
