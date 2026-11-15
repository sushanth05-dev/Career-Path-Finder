import { useState, type KeyboardEvent } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { ExperienceLevel } from "../types/roadmap";

interface ProfilePanelProps {
  skills: string[];
  onChangeSkills: (skills: string[]) => void;
  targetRole: string;
  onChangeTargetRole: (role: string) => void;
  hoursPerWeek: number;
  onChangeHoursPerWeek: (hours: number) => void;
  experienceLevel: ExperienceLevel;
  onChangeExperienceLevel: (level: ExperienceLevel) => void;
  isLoading: boolean;
  onGenerate: () => void;
  hasRoadmap: boolean;
}

const SUGGESTED_SKILLS = [
  "C",
  "Basic Python",
  "HTML",
  "CSS",
  "JavaScript",
  "SQL",
  "Git",
  "Java",
  "Statistics",
  "Linux",
];

const SUGGESTED_ROLES = [
  "Data Scientist",
  "Full-Stack Developer",
  "Machine Learning Engineer",
  "Cloud DevOps Engineer",
  "Cybersecurity Analyst",
  "Backend Software Engineer",
];

const EXPERIENCE_LEVELS: ExperienceLevel[] = ["Beginner", "Intermediate", "Advanced"];

export function ProfilePanel({
  skills,
  onChangeSkills,
  targetRole,
  onChangeTargetRole,
  hoursPerWeek,
  onChangeHoursPerWeek,
  experienceLevel,
  onChangeExperienceLevel,
  isLoading,
  onGenerate,
  hasRoadmap,
}: ProfilePanelProps) {
  const [skillInput, setSkillInput] = useState("");
  const [mobileCollapsed, setMobileCollapsed] = useState(false);

  const addSkill = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const existingLower = new Set(skills.map((s) => s.toLowerCase()));
    const next = [...skills];
    for (const part of parts) {
      if (!existingLower.has(part.toLowerCase())) {
        next.push(part);
        existingLower.add(part.toLowerCase());
      }
    }
    onChangeSkills(next);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    onChangeSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === "Backspace" && !skillInput && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  const paceLabel =
    hoursPerWeek <= 7
      ? "Steady pace"
      : hoursPerWeek <= 16
      ? "Focused pace"
      : "Intensive pace";

  const availableSuggestions = SUGGESTED_SKILLS.filter(
    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  );

  return (
    <aside
      aria-label="Student profile and career goal configuration"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Learning Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define your starting point and target role
          </p>
        </div>

        {hasRoadmap && (
          <button
            type="button"
            onClick={() => setMobileCollapsed((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{mobileCollapsed ? "Edit Inputs" : "Hide"}</span>
            {mobileCollapsed ? (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (skillInput.trim()) {
            addSkill(skillInput);
          }
          onGenerate();
        }}
        className={`${mobileCollapsed ? "hidden lg:block" : "block"} mt-5 space-y-5`}
      >
        {/* Target Job Role */}
        <div>
          <label
            htmlFor="target-role-input"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
          >
            Target Job Role
          </label>
          <input
            id="target-role-input"
            type="text"
            value={targetRole}
            onChange={(e) => onChangeTargetRole(e.target.value)}
            placeholder="e.g. Data Scientist"
            className="w-full h-11 px-3.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
            required
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_ROLES.map((role) => {
              const selected = targetRole.trim().toLowerCase() === role.toLowerCase();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onChangeTargetRole(role)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                    selected
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Current Skills */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="current-skills-input"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Current Skills
            </label>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {skills.length} added
            </span>
          </div>

          <div className="flex gap-2">
            <input
              id="current-skills-input"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter"
              className="flex-1 min-w-0 h-11 px-3.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => addSkill(skillInput)}
              disabled={!skillInput.trim()}
              aria-label="Add skill"
              className="h-11 px-3.5 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {skills.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-700 dark:hover:text-red-300 hover:border-red-200 dark:hover:border-red-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  <span>{skill}</span>
                  <X className="w-3 h-3 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Add at least one skill or select from common foundations below.
            </p>
          )}

          {availableSuggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Quick add:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableSuggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSkill(suggestion)}
                    className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Hours per week */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label
              htmlFor="hours-slider"
              className="text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Study Time Available
            </label>
            <div className="text-right">
              <span className="font-mono text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                {hoursPerWeek} hrs/week
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                · {paceLabel}
              </span>
            </div>
          </div>

          <input
            id="hours-slider"
            type="range"
            min={2}
            max={40}
            step={1}
            value={hoursPerWeek}
            onChange={(e) => onChangeHoursPerWeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-700 dark:accent-blue-500"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 mt-1">
            <span>2h</span>
            <span>10h</span>
            <span>20h</span>
            <span>30h</span>
            <span>40h</span>
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
            Current Level
          </span>
          <div
            role="group"
            aria-label="Current experience level"
            className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {EXPERIENCE_LEVELS.map((level) => {
              const active = experienceLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChangeExperienceLevel(level)}
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isLoading || skills.length === 0 || !targetRole.trim()}
          className="w-full min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <span>{isLoading ? "Building Your Roadmap..." : "Generate Roadmap"}</span>
          {!isLoading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
        </button>
      </form>
    </aside>
  );
}
