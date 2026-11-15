import { ArrowUpRight } from "lucide-react";
import type { ExperienceLevel } from "../types/roadmap";

export interface SamplePreset {
  label: string;
  targetRole: string;
  skills: string[];
  hoursPerWeek: number;
  experienceLevel: ExperienceLevel;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    label: "CS Student → Data Scientist",
    targetRole: "Data Scientist",
    skills: ["C", "Basic Python", "HTML"],
    hoursPerWeek: 10,
    experienceLevel: "Beginner",
  },
  {
    label: "Frontend Starter → Full-Stack Developer",
    targetRole: "Full-Stack Developer",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
    hoursPerWeek: 12,
    experienceLevel: "Intermediate",
  },
  {
    label: "IT Grad → Cloud DevOps Engineer",
    targetRole: "Cloud DevOps Engineer",
    skills: ["Linux", "Basic Python", "SQL"],
    hoursPerWeek: 14,
    experienceLevel: "Beginner",
  },
];

interface EmptyStateProps {
  onSelectPreset: (preset: SamplePreset) => void;
}

export function EmptyState({ onSelectPreset }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-10 space-y-8 transition-colors">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
          Turn your target job title into a structured 8-week learning plan
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Enter the skills you already know, choose your target career role, and
          set your weekly study hours. CareerPath maps your exact skill gaps,
          sequences an 8-week syllabus, and proposes three portfolio builds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
            01. Skill Matrix
          </span>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
            Have vs. To Learn Table
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Side-by-side comparison separating what you already know from
            missing role requirements, ranked by hiring priority.
          </p>
        </div>

        <div>
          <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
            02. Paced Curriculum
          </span>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
            8-Week Learning Roadmap
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Ordered weekly modules scaled to your available study hours with
            clear objectives, core topics, and concrete milestones.
          </p>
        </div>

        <div>
          <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
            03. Proof of Work
          </span>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
            3 Portfolio Mini-Projects
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Starter, intermediate, and capstone builds tailored to bridge your
            gaps and demonstrate job readiness to recruiters.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
          Run an instant example
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="group text-left p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                  {preset.targetRole}
                </span>
                <ArrowUpRight
                  className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-700 dark:group-hover:text-blue-400 shrink-0"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {preset.skills.join(", ")} · {preset.hoursPerWeek} hrs/wk
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div
      aria-live="polite"
      aria-label="Generating career roadmap"
      className="space-y-6"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Generating your personalized career roadmap...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparing your current skills against role requirements and sequencing an 8-week study plan.
          </p>
        </div>
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-full max-w-xl bg-slate-100 dark:bg-slate-800/70 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-2">
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/70 rounded animate-pulse" />
              <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="h-10 w-full bg-slate-100 dark:bg-slate-800/70 rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
