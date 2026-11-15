import { useEffect, useState } from "react";
import { AlertCircle, Moon, Sun } from "lucide-react";
import { TopBar, type ActiveView } from "./components/TopBar";
import { ProfilePanel } from "./components/ProfilePanel";
import { RoadmapOverview } from "./components/RoadmapOverview";
import { SkillGapTable } from "./components/SkillGapTable";
import { RoadmapTimeline } from "./components/RoadmapTimeline";
import { MiniProjectsGrid } from "./components/MiniProjectsGrid";
import {
  EmptyState,
  LoadingSkeleton,
  SAMPLE_PRESETS,
  type SamplePreset,
} from "./components/EmptyState";
import {
  downloadTextFile,
  formatRoadmapAsMarkdown,
} from "./utils/exportPlan";
import type {
  CareerRoadmapResponse,
  ExperienceLevel,
  RoadmapRequest,
} from "./types/roadmap";

type ThemeMode = "light" | "dark";

const MOBILE_TABS: { id: ActiveView; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "skills", label: "Skill Matrix" },
  { id: "roadmap", label: "8-Week Plan" },
  { id: "projects", label: "Projects" },
];

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("careerpath-theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // Ignore storage errors
  }
  return "light";
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [skills, setSkills] = useState<string[]>(["C", "Basic Python", "HTML"]);
  const [targetRole, setTargetRole] = useState<string>("Data Scientist");
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("Beginner");

  const [roadmap, setRoadmap] = useState<CareerRoadmapResponse | null>(null);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("careerpath-theme", theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const generateRoadmap = async (overridePayload?: RoadmapRequest) => {
    const payload: RoadmapRequest = overridePayload ?? {
      currentSkills: skills,
      targetRole: targetRole.trim(),
      hoursPerWeek,
      experienceLevel,
    };

    if (!payload.targetRole || payload.currentSkills.length === 0) {
      setError("Please enter at least one current skill and a target job role.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || `Request failed with status ${res.status}`
        );
      }

      setRoadmap(data as CareerRoadmapResponse);
      setCompletedWeeks([]);
      setActiveView("all");
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

  const handleToggleWeekComplete = (weekNumber: number) => {
    setCompletedWeeks((prev) =>
      prev.includes(weekNumber)
        ? prev.filter((w) => w !== weekNumber)
        : [...prev, weekNumber]
    );
  };

  const handleExportMarkdown = () => {
    if (!roadmap) return;
    const slug = roadmap.targetRole
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const markdown = formatRoadmapAsMarkdown(roadmap);
    downloadTextFile(`${slug || "career"}-roadmap.md`, markdown);
  };

  return (
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
        {/* Workspace Toolbar: Contextual Breadcrumb + Theme Switcher */}
        <div className="flex items-center justify-between gap-4 mb-5">
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

          <div
            role="group"
            aria-label="Color theme"
            className="inline-flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                theme === "light"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dark</span>
            </button>
          </div>
        </div>

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
              onGenerate={() => void generateRoadmap()}
              hasRoadmap={Boolean(roadmap)}
            />
          </div>

          {/* Right Main Workspace Viewport */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {error && (
              <div
                role="alert"
                className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800 dark:text-red-200"
              >
                <AlertCircle
                  className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold">Could not generate roadmap</p>
                  <p className="text-red-700 dark:text-red-300 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Mobile Section Switcher (scrolls naturally, not sticky to respect 15% mobile cap) */}
            {roadmap && !isLoading && (
              <div className="md:hidden flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
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
              <LoadingSkeleton />
            ) : !roadmap ? (
              <EmptyState onSelectPreset={handleSelectPreset} />
            ) : (
              <div className="space-y-6">
                <RoadmapOverview
                  roadmap={roadmap}
                  completedWeeksCount={completedWeeks.length}
                />

                {(activeView === "all" || activeView === "skills") && (
                  <SkillGapTable items={roadmap.skillGapTable} />
                )}

                {(activeView === "all" || activeView === "roadmap") && (
                  <RoadmapTimeline
                    weeks={roadmap.roadmapWeeks}
                    completedWeeks={completedWeeks}
                    onToggleWeekComplete={handleToggleWeekComplete}
                  />
                )}

                {(activeView === "all" || activeView === "projects") && (
                  <MiniProjectsGrid projects={roadmap.miniProjects} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>CareerPath · Structured skill gap analysis and 8-week study planning</span>
          <span>Export any generated roadmap to Markdown for offline tracking</span>
        </div>
      </footer>
    </div>
  );
}
